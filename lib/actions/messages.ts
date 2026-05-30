'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getOrCreateConversation(otherUserId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    p_other_user_id: otherUserId,
  })

  if (error) { console.error(error); return null }
  
  // 대화방 생성/조회 시 메시지함 목록 캐시 갱신
  revalidatePath('/messages')
  return data as string
}

export async function sendMessage(
  conversationId: string,
  content: string,
  type: 'text' | 'listing_share' = 'text',
  listingId?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  if (!content.trim()) return { error: '메시지를 입력해주세요.' }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content.trim(),
    type,
    listing_id: listingId ?? null,
  })

  if (error) return { error: error.message }
  
  // 메시지 전송 시 관련 경로 캐시 갱신
  revalidatePath(`/messages/${conversationId}`)
  revalidatePath('/messages')
  return { success: true }
}

export async function markAsRead(conversationId: string) {
  const supabase = await createClient()
  await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId })
  revalidatePath('/messages')
}