'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { markAsRead } from '@/lib/actions/messages'

export function ConversationRow({ conv, unread }: { conv: any; unread: number }) {
  const router = useRouter()

  const handleRead = async (e: React.MouseEvent) => {
    if (unread > 0) {
      await markAsRead(conv.id)
      router.refresh()
    }
  }

  const other = conv.other_user
  const initial = other?.username?.[0]?.toUpperCase() ?? '?'
  const timeStr = formatTime(conv.last_message_at)

  return (
    <Link 
      href={`/messages/${conv.id}`} 
      onClick={handleRead} 
      style={{ textDecoration: 'none' }}
    >
      <div 
        className={`conv-row-item ${unread > 0 ? 'unread-bg' : ''}`}
        style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: 14,
          padding: '14px 16px', 
          borderRadius: 14,
          transition: 'all 0.15s ease', 
          cursor: 'pointer',
          // border 중복 에러 해결: 아래 한 줄로 조건부 스타일 적용
          border: unread > 0 ? '1.5px solid var(--border)' : '1.5px solid transparent',
          background: unread > 0 ? 'white' : 'transparent',
        }}
      >
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
            <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
              {timeStr}
            </span>
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