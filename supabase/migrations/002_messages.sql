-- =============================================
-- CONVERSATIONS (채팅방)
-- =============================================
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  -- 두 참여자를 항상 정렬된 순서로 저장해서 중복 방지
  participant_a uuid references public.profiles(id) on delete cascade not null,
  participant_b uuid references public.profiles(id) on delete cascade not null,
  last_message_at timestamptz default now(),
  last_message_preview text,
  -- 각 참여자의 읽지 않은 메시지 수
  unread_a integer default 0,
  unread_b integer default 0,
  created_at timestamptz default now(),
  -- 같은 두 사람 간 대화방은 하나만 존재
  unique(participant_a, participant_b),
  check (participant_a < participant_b)
);

alter table public.conversations enable row level security;

create policy "Participants can view their conversations"
  on public.conversations for select
  using (auth.uid() = participant_a or auth.uid() = participant_b);

create policy "Users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = participant_a or auth.uid() = participant_b);

create policy "Participants can update their conversations"
  on public.conversations for update
  using (auth.uid() = participant_a or auth.uid() = participant_b);

-- =============================================
-- MESSAGES
-- =============================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  -- 메시지 타입: text, listing_share(재능 공유), system
  type text not null default 'text' check (type in ('text', 'listing_share', 'system')),
  -- 재능 공유 시 listing id
  listing_id uuid references public.listings(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

create policy "Users can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

create policy "Sender can update own messages"
  on public.messages for update
  using (auth.uid() = sender_id);

-- =============================================
-- TRIGGER: 메시지 전송 시 conversation 업데이트
-- =============================================
create or replace function public.handle_new_message()
returns trigger as $$
declare
  v_conv conversations%rowtype;
begin
  select * into v_conv from public.conversations where id = new.conversation_id;

  -- 미리보기 및 최신 메시지 시간 업데이트
  update public.conversations
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.content, 80),
    -- 수신자의 unread 카운트 증가
    unread_a = case when v_conv.participant_b = new.sender_id then unread_a + 1 else unread_a end,
    unread_b = case when v_conv.participant_a = new.sender_id then unread_b + 1 else unread_b end
  where id = new.conversation_id;

  -- 수신자에게 알림
  insert into public.notifications (user_id, type, title, message, link)
  select
    case when v_conv.participant_a = new.sender_id then v_conv.participant_b else v_conv.participant_a end,
    'new_message',
    '새 메시지',
    left(new.content, 60),
    '/messages/' || new.conversation_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_message_created
  after insert on public.messages
  for each row execute procedure public.handle_new_message();

-- =============================================
-- FUNCTION: 대화방 가져오기 (없으면 생성)
-- =============================================
create or replace function public.get_or_create_conversation(
  p_other_user_id uuid
)
returns uuid as $$
declare
  v_conv_id uuid;
  v_a uuid;
  v_b uuid;
begin
  -- 항상 작은 uuid가 participant_a
  if auth.uid() < p_other_user_id then
    v_a := auth.uid();
    v_b := p_other_user_id;
  else
    v_a := p_other_user_id;
    v_b := auth.uid();
  end if;

  -- 기존 대화방 조회
  select id into v_conv_id
  from public.conversations
  where participant_a = v_a and participant_b = v_b;

  -- 없으면 생성
  if v_conv_id is null then
    insert into public.conversations (participant_a, participant_b)
    values (v_a, v_b)
    returning id into v_conv_id;
  end if;

  return v_conv_id;
end;
$$ language plpgsql security definer;

-- =============================================
-- FUNCTION: 메시지 읽음 처리
-- =============================================
create or replace function public.mark_conversation_read(
  p_conversation_id uuid
)
returns void as $$
declare
  v_conv conversations%rowtype;
begin
  select * into v_conv from public.conversations where id = p_conversation_id;

  -- 내 unread 초기화
  update public.conversations
  set
    unread_a = case when participant_a = auth.uid() then 0 else unread_a end,
    unread_b = case when participant_b = auth.uid() then 0 else unread_b end
  where id = p_conversation_id;

  -- 메시지 read_at 업데이트
  update public.messages
  set read_at = now()
  where conversation_id = p_conversation_id
    and sender_id != auth.uid()
    and read_at is null;
end;
$$ language plpgsql security definer;

-- 인덱스
create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_created_at_idx on public.messages(created_at);
create index conversations_participant_a_idx on public.conversations(participant_a);
create index conversations_participant_b_idx on public.conversations(participant_b);
create index conversations_last_message_idx on public.conversations(last_message_at desc);

-- Realtime 활성화 (Supabase 대시보드에서도 설정 필요)
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
