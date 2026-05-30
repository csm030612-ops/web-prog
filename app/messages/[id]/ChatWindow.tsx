'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/actions/messages'

type Props = {
  conversationId: string
  initialMessages: any[]
  currentUserId: string
  otherUser: any
  theirListings: any[]
}

// 🕒 [새로 추가] 오전/오후 11:21 형태로 시각 변환
const formatTime = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // 자동으로 오전/오후 분기
  })
}

// 📅 [새로 추가] 2026년 5월 30일 토요일 형태로 날짜 구분선 변환
const formatDateSeparator = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

export function ChatWindow({
  conversationId,
  initialMessages,
  currentUserId,
  otherUser,
  theirListings,
}: Props) {
  const [messages, setMessages] = useState<any[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    
    setSending(true)
    setInput('')
    
    // 1. UI 즉시 업데이트 (로컬 상태에 임시 메시지 추가)
    const tempMsg = {
      id: Date.now().toString(),
      content: text,
      sender_id: currentUserId,
      created_at: new Date().toISOString()
    }
    setMessages((prev) => [...prev, tempMsg])

    // 2. 서버 전송
    await sendMessage(conversationId, text)
    setSending(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* 메시지 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, index) => {
          // 현재 메시지의 날짜 문자열 추출
          const currentMessageDate = msg.created_at ? new Date(msg.created_at).toDateString() : ''
          // 이전 메시지의 날짜 문자열 추출하여 비교
          const previousMessageDate = index > 0 && messages[index - 1].created_at 
            ? new Date(messages[index - 1].created_at).toDateString() 
            : null
          
          // 날짜가 바뀌었거나 첫 메시지라면 구분선 노출
          const showDateSeparator = currentMessageDate !== previousMessageDate
          const isMine = msg.sender_id === currentUserId

          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* [날짜 구분선] 날짜가 변경되는 시점에 중앙 정렬 뱃지 표시 */}
              {showDateSeparator && msg.created_at && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  margin: '24px 0 16px 0'
                }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#666666',
                    background: '#f2f2f2',
                    padding: '6px 16px',
                    borderRadius: 20,
                  }}>
                    {formatDateSeparator(msg.created_at)}
                  </span>
                </div>
              )}

              {/* [말풍선 + 시간 레이아웃] */}
              <div style={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end', // 말풍선 바닥선에 시간을 정렬시킴
                gap: 6,
                margin: '4px 0'
              }}>
                
                {/* 1. 내가 보낸 메시지라면: [시간] [말풍선] 순서로 배치 */}
                {isMine && msg.created_at && (
                  <span style={{
                    fontSize: 11,
                    color: '#999999',
                    marginBottom: 2,
                    whiteSpace: 'nowrap'
                  }}>
                    {formatTime(msg.created_at)}
                  </span>
                )}

                {/* 2. 공통 말풍선 디자인 */}
                <div style={{ 
                  display: 'inline-block', 
                  padding: '10px 14px', 
                  borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px', 
                  background: isMine ? '#2D6A4F' : '#eee',
                  color: isMine ? 'white' : 'black',
                  maxWidth: '70%',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontSize: 14,
                  lineHeight: 1.4
                }}>
                  {msg.content}
                </div>

                {/* 3. 상대방이 보낸 메시지라면: [말풍선] [시간] 순서로 배치 */}
                {!isMine && msg.created_at && (
                  <span style={{
                    fontSize: 11,
                    color: '#999999',
                    marginBottom: 2,
                    whiteSpace: 'nowrap'
                  }}>
                    {formatTime(msg.created_at)}
                  </span>
                )}

              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div style={{ padding: 12, borderTop: '1px solid #ccc', display: 'flex', gap: 8 }}>
        <textarea 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          style={{ 
            flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #ccc',
            resize: 'none', height: 40, fontFamily: 'inherit' 
          }} 
        />
        <button 
          onClick={handleSend} 
          disabled={sending}
          style={{ 
            padding: '8px 16px', cursor: 'pointer',
            background: '#2D6A4F', color: 'white', border: 'none',
            borderRadius: 8, fontWeight: 600
          }}
        >
          {sending ? '중...' : '전송'}
        </button>
      </div>
    </div>
  )
}