-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES (extends Supabase auth.users)
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  credits integer not null default 100,
  skills text[] default '{}',
  location text,
  rating numeric(3,2) default 0,
  rating_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup with 100 credits
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- LISTINGS (재능/경험 등록)
-- =============================================
create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null,
  type text not null check (type in ('offer', 'request')),
  -- 'credit': 크레딧으로 거래, 'exchange': 재능 교환
  mode text not null default 'credit' check (mode in ('credit', 'exchange', 'both')),
  credit_cost integer default 50,
  tags text[] default '{}',
  exchange_for text, -- 교환을 원하는 재능 설명
  status text not null default 'active' check (status in ('active', 'inactive', 'completed')),
  views integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.listings enable row level security;

create policy "Listings are viewable by everyone"
  on public.listings for select using (true);

create policy "Users can create own listings"
  on public.listings for insert with check (auth.uid() = user_id);

create policy "Users can update own listings"
  on public.listings for update using (auth.uid() = user_id);

create policy "Users can delete own listings"
  on public.listings for delete using (auth.uid() = user_id);

-- =============================================
-- EXCHANGE REQUESTS (교환/도움 요청)
-- =============================================
create table public.exchange_requests (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  provider_id uuid references public.profiles(id) on delete cascade not null,
  mode text not null check (mode in ('credit', 'exchange')),
  credit_amount integer default 50,
  message text,
  my_skill_offer text, -- 교환 시: 내가 제공하는 재능
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.exchange_requests enable row level security;

create policy "Users can view own exchange requests"
  on public.exchange_requests for select
  using (auth.uid() = requester_id or auth.uid() = provider_id);

create policy "Users can create exchange requests"
  on public.exchange_requests for insert
  with check (auth.uid() = requester_id);

create policy "Provider can update exchange requests"
  on public.exchange_requests for update
  using (auth.uid() = provider_id or auth.uid() = requester_id);

-- =============================================
-- CREDIT TRANSACTIONS
-- =============================================
create table public.credit_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null, -- positive = earn, negative = spend
  type text not null check (type in ('initial', 'earn_help', 'spend_help', 'refund', 'bonus')),
  exchange_request_id uuid references public.exchange_requests(id),
  description text,
  created_at timestamptz default now()
);

alter table public.credit_transactions enable row level security;

create policy "Users can view own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- =============================================
-- REVIEWS / RATINGS
-- =============================================
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  exchange_request_id uuid references public.exchange_requests(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(exchange_request_id, reviewer_id)
);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Users can create reviews"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

-- Auto-update profile rating when review is added
create or replace function public.update_profile_rating()
returns trigger as $$
begin
  update public.profiles
  set
    rating = (
      select avg(rating)::numeric(3,2)
      from public.reviews
      where reviewee_id = new.reviewee_id
    ),
    rating_count = (
      select count(*)
      from public.reviews
      where reviewee_id = new.reviewee_id
    )
  where id = new.reviewee_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_created
  after insert on public.reviews
  for each row execute procedure public.update_profile_rating();

-- =============================================
-- NOTIFICATIONS
-- =============================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- =============================================
-- HANDLE CREDIT EXCHANGE (function)
-- =============================================
create or replace function public.process_credit_exchange(
  p_request_id uuid
)
returns void as $$
declare
  v_request exchange_requests%rowtype;
  v_listing listings%rowtype;
begin
  select * into v_request from exchange_requests where id = p_request_id;
  select * into v_listing from listings where id = v_request.listing_id;

  if v_request.mode = 'credit' then
    -- Deduct from requester
    update public.profiles
    set credits = credits - v_request.credit_amount
    where id = v_request.requester_id;

    -- Add to provider
    update public.profiles
    set credits = credits + v_request.credit_amount
    where id = v_request.provider_id;

    -- Log transactions
    insert into public.credit_transactions (user_id, amount, type, exchange_request_id, description)
    values
      (v_request.requester_id, -v_request.credit_amount, 'spend_help', p_request_id, '서비스 이용'),
      (v_request.provider_id, v_request.credit_amount, 'earn_help', p_request_id, '서비스 제공');
  end if;

  -- Mark request as completed
  update public.exchange_requests
  set status = 'completed', updated_at = now()
  where id = p_request_id;

  -- Mark listing as completed
  update public.listings
  set status = 'completed', updated_at = now()
  where id = v_request.listing_id;
end;
$$ language plpgsql security definer;

-- =============================================
-- MATCHES VIEW (교환 매칭)
-- =============================================
create or replace view public.potential_matches as
select
  a.id as listing_a_id,
  a.user_id as user_a_id,
  a.title as listing_a_title,
  a.exchange_for as a_wants,
  b.id as listing_b_id,
  b.user_id as user_b_id,
  b.title as listing_b_title,
  b.exchange_for as b_wants,
  a.tags && b.tags as has_tag_overlap
from public.listings a
join public.listings b
  on a.user_id != b.user_id
  and a.status = 'active'
  and b.status = 'active'
  and (a.mode = 'exchange' or a.mode = 'both')
  and (b.mode = 'exchange' or b.mode = 'both');

-- Indexes for performance
create index listings_user_id_idx on public.listings(user_id);
create index listings_category_idx on public.listings(category);
create index listings_status_idx on public.listings(status);
create index exchange_requests_requester_idx on public.exchange_requests(requester_id);
create index exchange_requests_provider_idx on public.exchange_requests(provider_id);
create index notifications_user_id_idx on public.notifications(user_id);
