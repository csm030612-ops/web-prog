import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { markAsRead } from '@/lib/actions/messages'
import { ChatWindow } from './ChatWindow'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 대화방 + 참여자 정보
  const { data: conv } = await supabase
    .from('conversations')
    .select(`
      *,
      profile_a:profiles!conversations_participant_a_fkey(id, username, avatar_url, bio, rating, rating_count, skills, credits),
      profile_b:profiles!conversations_participant_b_fkey(id, username, avatar_url, bio, rating, rating_count, skills, credits)
    `)
    .eq('id', id)
    .single()

  if (!conv) notFound()

  // 참여자인지 확인
  if (conv.participant_a !== user.id && conv.participant_b !== user.id) {
    redirect('/messages')
  }

  const otherUser = conv.participant_a === user.id ? conv.profile_b : conv.profile_a
  const myProfile = conv.participant_a === user.id ? conv.profile_a : conv.profile_b

  // 메시지 불러오기 (최신 50개)
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
      listing:listings(id, title, category, type, mode)
    `)
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(50)

  // 읽음 처리
  // await markAsRead(id)

  // 상대방의 다른 활성 리스팅 (메시지에서 공유 가능하도록)
  const { data: theirListings } = await supabase
    .from('listings')
    .select('id, title, category, type, mode, credit_cost')
    .eq('user_id', otherUser.id)
    .eq('status', 'active')
    .limit(5)

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 64px)',
      maxWidth: 1100, margin: '0 auto',
    }}>
      {/* 왼쪽: 채팅창 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 채팅 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px',
          borderBottom: '1.5px solid var(--border)',
          background: 'white',
          flexShrink: 0,
        }}>
          <Link href="/messages" style={{
            color: 'var(--text-muted)', fontSize: 20, lineHeight: 1,
            padding: '4px 8px', borderRadius: 8,
          }}>
            ←
          </Link>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 16, fontWeight: 800, flexShrink: 0,
          }}>
            {otherUser?.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
              {otherUser?.username}
            </p>
            {otherUser?.rating > 0 && (
              <p style={{ fontSize: 12, color: '#F4A261' }}>
                ★ {Number(otherUser.rating).toFixed(1)} ({otherUser.rating_count}건)
              </p>
            )}
          </div>
          <Link href={`/users/${otherUser?.id}`} style={{
            fontSize: 12, color: 'var(--primary)', fontWeight: 600,
            padding: '6px 12px', borderRadius: 8,
            border: '1.5px solid rgba(45,106,79,0.3)',
          }}>
            프로필 보기
          </Link>
        </div>

        {/* 실시간 채팅 윈도우 (Client Component) */}
        <ChatWindow
          conversationId={id}
          initialMessages={messages ?? []}
          currentUserId={user.id}
          otherUser={otherUser}
          theirListings={theirListings ?? []}
        />
      </div>

      {/* 오른쪽: 상대방 정보 패널 */}
      <div style={{
        width: 260, borderLeft: '1.5px solid var(--border)',
        background: 'white', padding: '20px 18px',
        overflowY: 'auto', flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* 상대방 프로필 요약 */}
        <div>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 22, fontWeight: 800,
            margin: '0 auto 12px',
          }}>
            {otherUser?.username?.[0]?.toUpperCase()}
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, textAlign: 'center' }}>{otherUser?.username}</p>
          {otherUser?.bio && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 6, lineHeight: 1.5 }}>
              {otherUser.bio}
            </p>
          )}
          {otherUser?.rating > 0 && (
            <p style={{ fontSize: 13, color: '#F4A261', textAlign: 'center', marginTop: 6, fontWeight: 700 }}>
              ★ {Number(otherUser.rating).toFixed(1)}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({otherUser.rating_count}건)</span>
            </p>
          )}
        </div>

        {/* 스킬 */}
        {otherUser?.skills?.length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              보유 스킬
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {otherUser.skills.map((s: string) => (
                <span key={s} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'rgba(45,106,79,0.1)', color: 'var(--primary)',
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 상대방 활성 리스팅 */}
        {theirListings && theirListings.length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              등록한 재능
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {theirListings.map((l: any) => (
                <Link key={l.id} href={`/listings/${l.id}`}>
                  <div style={{
                    padding: '10px 12px', borderRadius: 10,
                    border: '1.5px solid var(--border)', background: 'var(--surface)',
                    transition: 'border-color 0.15s ease',
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 3, lineHeight: 1.3 }}>{l.title}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.category}</span>
                      {l.mode !== 'exchange' && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--credit-color)' }}>
                          {l.credit_cost}점
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
