import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MessageButton } from './MessageButton'

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: me } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: listings }, { data: reviews }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('listings')
      .select('*')
      .eq('user_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase.from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(username)')
      .eq('reviewee_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!profile) notFound()

  const isMe = me?.id === id

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* 프로필 헤더 */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
          borderRadius: 'var(--radius-lg)', padding: '36px 40px',
          color: 'white', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, flexShrink: 0,
          }}>
            {profile.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              {profile.full_name || profile.username}
            </h1>
            <p style={{ opacity: 0.75, fontSize: 14, marginBottom: 6 }}>@{profile.username}</p>
            {profile.bio && (
              <p style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.5 }}>{profile.bio}</p>
            )}
            {profile.location && (
              <p style={{ opacity: 0.65, fontSize: 13, marginTop: 4 }}>📍 {profile.location}</p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
            {profile.rating > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 900 }}>★ {Number(profile.rating).toFixed(1)}</div>
                <div style={{ opacity: 0.65, fontSize: 12 }}>{profile.rating_count}건의 후기</div>
              </div>
            )}
            {!isMe && me && (
              <MessageButton targetUserId={id} />
            )}
            {isMe && (
              <Link href="/profile" className="btn" style={{
                background: 'rgba(255,255,255,0.15)', color: 'white',
                border: '1px solid rgba(255,255,255,0.3)', fontSize: 13, padding: '8px 16px',
              }}>
                프로필 수정
              </Link>
            )}
          </div>
        </div>

        {/* 스킬 */}
        {profile.skills?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>
              보유 스킬
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profile.skills.map((s: string) => (
                <span key={s} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'rgba(45,106,79,0.1)', color: 'var(--primary)',
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {/* 등록한 재능 */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>
              등록한 재능 {listings?.length ? `(${listings.length})` : ''}
            </h2>
            {listings?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {listings.map((l: any) => (
                  <Link key={l.id} href={`/listings/${l.id}`}>
                    <div style={{
                      padding: '14px 16px', borderRadius: 14,
                      border: '1.5px solid var(--border)', background: 'white',
                      transition: 'all 0.15s ease',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{l.title}</span>
                        <span className={`badge ${l.mode === 'credit' ? 'badge-credit' : l.mode === 'exchange' ? 'badge-exchange' : 'badge-both'}`} style={{ fontSize: 10 }}>
                          {l.mode === 'credit' ? '크레딧' : l.mode === 'exchange' ? '교환' : '둘 다'}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', padding: '20px 0' }}>
                아직 등록한 재능이 없어요
              </p>
            )}
          </div>

          {/* 후기 */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>
              후기 {reviews?.length ? `(${reviews.length})` : ''}
            </h2>
            {reviews?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reviews.map((r: any) => (
                  <div key={r.id} style={{
                    padding: '14px 16px', borderRadius: 14,
                    border: '1.5px solid var(--border)', background: 'white',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{r.reviewer?.username}</span>
                      <span style={{ color: '#F4A261', fontSize: 14 }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    {r.comment && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {r.comment}
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      {new Date(r.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', padding: '20px 0' }}>
                아직 후기가 없어요
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
