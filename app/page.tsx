import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/types'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; type?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('*, profiles(username, avatar_url, rating, rating_count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(24)

  if (params.category) query = query.eq('category', params.category)
  if (params.type) query = query.eq('type', params.type)
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const { data: listings } = await query

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(160deg, #1B4332 0%, #2D6A4F 60%, #52B788 100%)',
        padding: '80px 24px',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(82,183,136,0.3) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(244,162,97,0.2) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)', padding: '6px 16px',
            borderRadius: 100, fontSize: 13, fontWeight: 600,
            marginBottom: 24, backdropFilter: 'blur(8px)',
          }}>
            🌱 재능과 경험을 나누는 커뮤니티
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            당신의 재능이<br />누군가의 꿈이 됩니다
          </h1>
          <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 36, lineHeight: 1.6 }}>
            재능을 교환하거나 크레딧으로 도움을 주고받으세요.<br />
            첫 가입 시 100 크레딧을 드립니다.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register" className="btn" style={{
              background: 'var(--accent)', color: 'white',
              padding: '14px 28px', fontSize: 15, borderRadius: 12,
            }}>
              무료로 시작하기 →
            </Link>
            <Link href="#listings" className="btn" style={{
              background: 'rgba(255,255,255,0.15)', color: 'white',
              padding: '14px 28px', fontSize: 15, borderRadius: 12,
              backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)',
            }}>
              재능 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: 'white', borderBottom: '1.5px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: 48, padding: '20px 24px' }}>
          {[
            { label: '등록된 재능', value: listings?.length ?? 0, suffix: '+' },
            { label: '첫 크레딧', value: 100, suffix: '점' },
            { label: '도움 1회 비용', value: 50, suffix: '점' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>
                {stat.value}{stat.suffix}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Category filter */}
      <section className="container" style={{ padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          <Link href="/" style={{
            padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600,
            background: !params.category ? 'var(--primary)' : 'white',
            color: !params.category ? 'white' : 'var(--text-secondary)',
            border: '1.5px solid', borderColor: !params.category ? 'var(--primary)' : 'var(--border)',
            whiteSpace: 'nowrap',
          }}>
            전체
          </Link>
          {CATEGORIES.slice(0, 8).map(cat => (
            <Link key={cat} href={`/?category=${cat}`} style={{
              padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600,
              background: params.category === cat ? 'var(--primary)' : 'white',
              color: params.category === cat ? 'white' : 'var(--text-secondary)',
              border: '1.5px solid',
              borderColor: params.category === cat ? 'var(--primary)' : 'var(--border)',
              whiteSpace: 'nowrap',
            }}>
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Listings grid */}
      <section id="listings" className="container" style={{ padding: '24px 24px 64px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {listings?.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
          {(!listings || listings.length === 0) && (
            <div style={{
              gridColumn: '1 / -1', textAlign: 'center',
              padding: '80px 24px', color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)' }}>
                아직 등록된 재능이 없어요
              </div>
              <p style={{ marginTop: 8 }}>첫 번째 재능을 등록해보세요!</p>
              <Link href="/listings/new" className="btn btn-primary" style={{ marginTop: 20 }}>
                재능 등록하기
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'white', padding: '64px 24px', borderTop: '1.5px solid var(--border)' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 8 }}>
            어떻게 작동하나요?
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 48 }}>
            재능 교환부터 크레딧 거래까지, 두 가지 방식으로 연결돼요
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { icon: '🎁', title: '가입하면 100 크레딧', desc: '바로 사용 가능한 100 크레딧을 드려요. 누군가의 도움을 바로 받아보세요.' },
              { icon: '🔄', title: '재능 교환 (크레딧 무료)', desc: '서로 필요한 재능이 일치하면? 크레딧 없이 바로 교환할 수 있어요.' },
              { icon: '💎', title: '크레딧으로 도움받기', desc: '50 크레딧으로 원하는 도움을 받고, 도움을 주면 50 크레딧을 얻어요.' },
              { icon: '⭐', title: '후기와 추천', desc: '교환 후 서로 평가하고, 신뢰할 수 있는 커뮤니티를 만들어요.' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '28px 24px', borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--border)', background: 'var(--surface)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{item.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function ListingCard({ listing }: { listing: any }) {
  const modeLabel = listing.mode === 'credit' ? '크레딧' : listing.mode === 'exchange' ? '재능교환' : '둘 다'
  const modeClass = listing.mode === 'credit' ? 'badge-credit' : listing.mode === 'exchange' ? 'badge-exchange' : 'badge-both'
  const typeColor = listing.type === 'offer' ? '#2D6A4F' : '#C07038'

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Top accent */}
        <div style={{ height: 4, background: listing.type === 'offer' ? 'var(--primary)' : 'var(--accent)' }} />
        <div style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: typeColor,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {listing.type === 'offer' ? '제공 가능' : '도움 요청'}
            </span>
            <span className={`badge ${modeClass}`} style={{ fontSize: 11 }}>
              {modeLabel}
            </span>
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            {listing.title}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {listing.description}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 6,
              background: 'var(--surface-2)', color: 'var(--text-secondary)', fontWeight: 600,
            }}>
              {listing.category}
            </span>
            {listing.tags?.slice(0, 2).map((tag: string) => (
              <span key={tag} style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 6,
                background: 'var(--surface-2)', color: 'var(--text-muted)',
              }}>
                #{tag}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                {listing.profiles?.username?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{listing.profiles?.username}</span>
              {listing.profiles?.rating > 0 && (
                <span style={{ fontSize: 12, color: '#F4A261', fontWeight: 700 }}>
                  ★ {listing.profiles.rating.toFixed(1)}
                </span>
              )}
            </div>
            {listing.mode !== 'exchange' && (
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--credit-color)' }}>
                {listing.credit_cost} 크레딧
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
