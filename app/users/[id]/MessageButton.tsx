'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateConversation, markAsRead } from '@/lib/actions/messages' // markAsRead 추가

export function MessageButton({ targetUserId }: { targetUserId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    
    // 1. 대화방 생성 또는 가져오기
    const convId = await getOrCreateConversation(targetUserId)
    
    if (convId) {
      // 2. [추가] 이동하기 전에 이 채팅방의 읽지 않은 메시지를 읽음 처리
      // 이렇게 하면 메시지함 목록 페이지로 돌아왔을 때 숫자가 이미 0으로 되어 있습니다.
      await markAsRead(convId)
      
      // 3. 채팅방으로 이동
      router.push(`/messages/${convId}`)
    } else {
      alert('메시지를 시작할 수 없습니다. 로그인 상태를 확인해주세요.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn"
      style={{
        background: 'rgba(255,255,255,0.15)', color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
        fontSize: 13, padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      {loading ? '이동 중...' : '💬 메시지 보내기'}
    </button>
  )
}