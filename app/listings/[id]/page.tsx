import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExchangeRequestForm } from './ExchangeRequestForm'
import { deleteListing } from '@/lib/actions/listings'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles(*)')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  // Increment views
  await supabase
    .from('listings')
    .update({ views: (listing.views || 0) + 1 })
    .eq('id', id)

  const [{ data: profile }, { data: reviews }] = await Promise.all([
    user ? supabase.from('profiles').select('credits').eq('id', user.id).single() : { data: null },
    supabase.from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(username, avatar_url)')
      .eq('reviewee_id', listing.user_id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const isOwner = user?.id === listing.user_id

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Back */}
        <Link href="/" style={{ fontSize: 14, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          ← 목록으로
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>
          {/* Main content */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: listing.type === 'offer' ? 'var(--primary)' : '#C07038',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {listing.type === 'offer' ? '제공 가능' : '도움 요청'}
              </span>
              <span className={`badge ${listing.mode === 'credit' ? 'badge-credit' : listing.mode === 'exchange' ? 'badge-exchange' : 'badge-both'}`}>
                {listing.mode === 'credit' ? '크레딧' : listing.mode === 'exchange' ? '재능교환' : '둘 다'}
              </span>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
              {listing.title}
            </h1>

            {/* [새로 추가됨] 작성 날짜 및 조회수 메타 정보 피드 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              <span>
                {listing.created_at 
                  ? new Date(listing.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '날짜 정보 없음'}
              </span>
              <span>•</span>
              <span>조회 {listing.views || 0}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--surface-2)', color: 'var(--text-secondary)',
              }}>
                {listing.category}
              </span>
              {listing.tags?.map((tag: string) => (
                <span key={tag} style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: 12,
                  background: 'var(--surface-2)', color: 'var(--text-muted)',
                }}>
                  #{tag}
                </span>
              ))}
            </div>

            <div style={{
              fontSize: 15, lineHeight: 1.8, color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap', marginBottom: 24,
            }}>
              {listing.description}
            </div>

            {listing.exchange_for && (
              <div style={{
                padding: '16px 20px', borderRadius: 12, marginBottom: 24,
                background: 'rgba(45,106,79,0.06)', border: '1px solid rgba(45,106,79,0.2)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                  🔄 원하는 교환 재능
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{listing.exchange_for}</p>
              </div>
            )}

            {/* Provider profile */}
            <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>제공자 정보</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--primary)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700,
                }}>
                  {listing.profiles?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700 }}>{listing.profiles?.username}</p>
                  {listing.profiles?.rating > 0 && (
                    <p style={{ fontSize: 14, color: '#F4A261' }}>
                      ★ {listing.profiles.rating.toFixed(1)} ({listing.profiles.rating_count}건)
                    </p>
                  )}
                  {listing.profiles?.bio && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {listing.profiles.bio}
                    </p>
                  )}
                </div>
              </div>
              {listing.profiles?.skills?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  {listing.profiles.skills.map((s: string) => (
                    <span key={s} style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 12,
                      background: 'rgba(45,106,79,0.1)', color: 'var(--primary)', fontWeight: 600,
                    }}>{s}</span>
                  ))}
                </div>
              )}
              {/* 프로필 / 메시지 버튼 */}
              {!isOwner && (
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <Link
                    href={`/users/${listing.user_id}`}
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: 12, padding: '8px' }}
                  >
                    프로필 보기
                  </Link>
                  {user && (
                    <Link
                      href={`/users/${listing.user_id}`}
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: 12, padding: '8px' }}
                    >
                      💬 메시지
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>후기</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.map((r: any) => (
                    <div key={r.id} style={{
                      padding: '16px', borderRadius: 12,
                      border: '1.5px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{r.reviewer?.username}</span>
                        <span style={{ color: '#F4A261', fontSize: 14 }}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </span>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Request panel */}
          <div style={{ width: 280, position: 'sticky', top: 88 }}>
            {isOwner ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>내가 등록한 재능입니다</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href="/dashboard" className="btn btn-outline" style={{ width: '100%' }}>
                    대시보드 가기
                  </Link>
                  
                  {/* 수정 페이지 링크 버튼 */}
                  <Link 
                    href={`/listings/${listing.id}/edit`} 
                    style={{ 
                      width: '100%', padding: '8px 16px', background: 'var(--primary)', color: 'white', 
                      borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: 'center', textDecoration: 'none' 
                    }}
                  >
                    게시글 수정
                  </Link>
                  
                  {/* 삭제 액션 버튼 */}
                  <form action={async () => {
                    'use server';
                    await deleteListing(listing.id);
                    redirect('/dashboard');
                  }}>
                    <button 
                      type="submit" 
                      style={{ 
                        width: '100%', padding: '8px 16px', background: '#E63946', color: 'white', 
                        borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' 
                      }}
                    >
                      게시글 삭제
                    </button>
                  </form>
                </div>
              </div>
            ) : !user ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  교환을 신청하려면 로그인이 필요해요
                </p>
                <Link href="/auth/login" className="btn btn-primary" style={{ width: '100%' }}>
                  로그인하기
                </Link>
              </div>
            ) : (
              <ExchangeRequestForm
                listing={listing}
                userCredits={profile?.credits ?? 0}
                currentUserId={user.id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}