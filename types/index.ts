export type Profile = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  credits: number
  skills: string[]
  location: string | null
  rating: number
  rating_count: number
  created_at: string
  updated_at: string
}

export type ListingType = 'offer' | 'request'
export type ListingMode = 'credit' | 'exchange' | 'both'
export type ListingStatus = 'active' | 'inactive' | 'completed'

export type Listing = {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  type: ListingType
  mode: ListingMode
  credit_cost: number
  tags: string[]
  exchange_for: string | null
  status: ListingStatus
  views: number
  created_at: string
  updated_at: string
  profiles?: Profile
}

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'

export type ExchangeRequest = {
  id: string
  listing_id: string
  requester_id: string
  provider_id: string
  mode: 'credit' | 'exchange'
  credit_amount: number
  message: string | null
  my_skill_offer: string | null
  status: RequestStatus
  created_at: string
  updated_at: string
  listings?: Listing
  requester?: Profile
  provider?: Profile
}

export type CreditTransaction = {
  id: string
  user_id: string
  amount: number
  type: 'initial' | 'earn_help' | 'spend_help' | 'refund' | 'bonus'
  exchange_request_id: string | null
  description: string | null
  created_at: string
}

export type Review = {
  id: string
  exchange_request_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer?: Profile
}

export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
}

export const CATEGORIES = [
  '프로그래밍/개발',
  '디자인/그래픽',
  '언어/번역',
  '음악/악기',
  '요리/베이킹',
  '운동/헬스',
  '글쓰기/편집',
  '사진/영상',
  '비즈니스/컨설팅',
  '교육/튜터링',
  '생활/수리',
  '예술/공예',
  '마케팅/홍보',
  '법률/회계',
  '기타',
] as const

export type MessageType = 'text' | 'listing_share' | 'system'

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: MessageType
  listing_id: string | null
  read_at: string | null
  created_at: string
  sender?: Profile
  listing?: Listing
}

export type Conversation = {
  id: string
  participant_a: string
  participant_b: string
  last_message_at: string
  last_message_preview: string | null
  unread_a: number
  unread_b: number
  created_at: string
  // joined
  other_user?: Profile
  messages?: Message[]
}

export const CREDIT_PER_HELP = 50
export const INITIAL_CREDITS = 100
