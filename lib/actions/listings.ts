'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// 게시글 생성
export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const mode = formData.get('mode') as string
  const listing = {
    user_id: user.id,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    category: formData.get('category') as string,
    type: formData.get('type') as string,
    mode,
    credit_cost: mode === 'exchange' ? 0 : 50,
    tags: (formData.get('tags') as string).split(',').map(s => s.trim()).filter(Boolean),
    exchange_for: formData.get('exchange_for') as string || null,
  }

  const { error } = await supabase.from('listings').insert(listing)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// 교환 요청 처리
export async function createExchangeRequest(
  listingId: string,
  providerId: string,
  mode: 'credit' | 'exchange',
  message: string,
  mySkillOffer?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  if (mode === 'credit') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits < 50) {
      return { error: '크레딧이 부족합니다. (최소 50 크레딧 필요)' }
    }
  }

  const { error } = await supabase.from('exchange_requests').insert({
    listing_id: listingId,
    requester_id: user.id,
    provider_id: providerId,
    mode,
    credit_amount: mode === 'credit' ? 50 : 0,
    message,
    my_skill_offer: mySkillOffer || null,
    status: 'pending',
  })

  if (error) return { error: error.message }

  await supabase.from('notifications').insert({
    user_id: providerId,
    type: 'exchange_request',
    title: '새 교환 요청',
    message: `누군가 당신의 재능을 원합니다!`,
    link: '/exchange',
  })

  revalidatePath('/exchange')
  return { success: true }
}

// 요청 응답
export async function respondToRequest(
  requestId: string,
  action: 'accept' | 'reject'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  if (action === 'accept') {
    const { data: req } = await supabase
      .from('exchange_requests')
      .select('*, listings(*)')
      .eq('id', requestId)
      .single()

    if (!req) return { error: '요청을 찾을 수 없습니다.' }

    if (req.mode === 'credit') {
      await supabase.rpc('process_credit_exchange', { p_request_id: requestId })
    } else {
      await supabase
        .from('exchange_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId)
    }

    await supabase.from('notifications').insert({
      user_id: req.requester_id,
      type: 'request_accepted',
      title: '요청이 수락되었습니다!',
      message: `재능 교환 요청이 수락되었습니다.`,
      link: '/exchange',
    })
  } else {
    await supabase
      .from('exchange_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId)
  }

  revalidatePath('/exchange')
  return { success: true }
}

// 교환 완료 처리
export async function completeExchange(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: req } = await supabase
    .from('exchange_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!req) return { error: '요청을 찾을 수 없습니다.' }

  if (req.mode === 'exchange') {
    await supabase
      .from('exchange_requests')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    await supabase.from('listings')
      .update({ status: 'completed' })
      .eq('id', req.listing_id)
  }

  revalidatePath('/exchange')
  return { success: true }
}

// 리뷰 제출
export async function submitReview(
  requestId: string,
  revieweeId: string,
  rating: number,
  comment: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase.from('reviews').insert({
    exchange_request_id: requestId,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    rating,
    comment,
  })

  if (error) return { error: error.message }
  revalidatePath('/exchange')
  return { success: true }
}

// 게시글 삭제
export async function deleteListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: listing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', listingId)
    .single()

  if (!listing || listing.user_id !== user.id) {
    return { error: '본인의 게시글만 삭제할 수 있습니다.' }
  }

  const { error } = await supabase.from('listings').delete().eq('id', listingId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/')
  return { success: true }
}

// 게시글 수정
export async function updateListing(listingId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: listing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', listingId)
    .single()

  if (!listing || listing.user_id !== user.id) {
    return { error: '본인의 게시글만 수정할 수 있습니다.' }
  }

  const mode = formData.get('mode') as string
  const updatedData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    category: formData.get('category') as string,
    type: formData.get('type') as string,
    mode,
    credit_cost: mode === 'exchange' ? 0 : 50,
    tags: (formData.get('tags') as string).split(',').map(s => s.trim()).filter(Boolean),
    exchange_for: formData.get('exchange_for') as string || null,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('listings')
    .update(updatedData)
    .eq('id', listingId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath(`/listings/${listingId}`)
  redirect(`/listings/${listingId}`)
}