'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { markAsRead } from '@/lib/actions/messages'

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const supabase = createClient()

  // 데이터 로드 함수를 useCallback으로 감싸서 어디서든 안전하게 호출
  const loadConversations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: rawConvs } = await supabase
      .from('conversations')
      .select(`
        *,
        profile_a:profiles!conversations_participant_a_fkey(id, username, avatar_url, rating),
        profile_b:profiles!conversations_participant_b_fkey(id, username, avatar_url, rating)
      `)
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    const formatted = (rawConvs ?? []).map((c: any) => ({
      ...c,
      other_user: c.participant_a === user.id ? c.profile_b : c.profile_a,
      my_unread: c.participant_a === user.id ? c.unread_a : c.unread_b,
    }))
    setConversations(formatted)
  }, [supabase])

  // 페이지 진입 시 데이터 로드
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const handleRead = async (convId: string, unread: number) => {
    if (unread > 0) {
      // 1. DB에서 읽음 처리 (RPC 호출)
      await markAsRead(convId)
      // 2. 즉시 로컬 상태를 갱신하여 숫자 지우기
      await loadConversations()
      // 3. 서버 캐시 갱신
      router.refresh()
    }
  }

  const totalUnread = conversations.reduce((s, c) => s + (c.my_unread ?? 0), 0)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>
            메시지
            {totalUnread > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: 10, width: 22, height: 22, borderRadius: '50%',
                background: '#E63946', color: 'white', fontSize: 11, fontWeight: 800,
              }}>
                {totalUnread}
              </span>
            )}
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {conversations.map((conv) => (
          <div key={conv.id} onClick={() => handleRead(conv.id, conv.my_unread)}>
            <ConversationRow conv={conv} unread={conv.my_unread} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ConversationRow({ conv, unread }: { conv: any; unread: number }) {
  const other = conv.other_user
  const initial = other?.username?.[0]?.toUpperCase() ?? '?'
  const timeStr = formatTime(conv.last_message_at)

  return (
    <Link href={`/messages/${conv.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 14,
        background: unread > 0 ? 'white' : 'transparent',
        border: unread > 0 ? '1.5px solid var(--border)' : '1.5px solid transparent',
        transition: 'all 0.15s ease', cursor: 'pointer',
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 18, fontWeight: 800,
          }}>
            {initial}
          </div>
          {unread > 0 && (
            <div style={{
              position: 'absolute', top: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              background: '#E63946', border: '2px solid var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: 'white',
            }}>
              {unread > 9 ? '9+' : unread}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: unread > 0 ? 800 : 600, color: 'var(--text-primary)' }}>
              {other?.username ?? '알 수 없음'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{timeStr}</span>
          </div>
          <p style={{
            fontSize: 13, color: unread > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
            fontWeight: unread > 0 ? 600 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {conv.last_message_preview ?? '대화를 시작해보세요'}
          </p>
        </div>
      </div>
    </Link>
  )
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return '방금'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}