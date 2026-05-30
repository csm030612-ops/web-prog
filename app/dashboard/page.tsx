import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: myListings }, { data: transactions }, { data: requests }, { data: matches }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('listings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('credit_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('exchange_requests')
        .select('*, listings(title), requester:profiles!exchange_requests_requester_id_fkey(username)')
        .or(`provider_id.eq.${user.id},requester_id.eq.${user.id}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5),
      // Potential matches for exchange
      supabase.from('listings')
        .select('*, profiles(username, rating)')
        .neq('user_id', user.id)
        .eq('status', 'active')
        .in('mode', ['exchange', 'both'])
        .limit(6),
    ])

  const pendingCount = requests?.filter((r: any) => r.provider_id === user.id).length ?? 0

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      {/* Welcome + credits */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 32,
      }}>
        <div style={{
          gridColumn: 'span 2',
          background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
          borderRadius: 'var(--radius-lg)', padding: '28px 32px', color: 'white',
        }}>
          <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>안녕하세요,</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>
            {profile?.full_name || profile?.username} 님 👋
          </h1>
          <p style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>
            오늘도 재능을 나눠보세요
          </p>
        </div>

        <StatCard
          label="보유 크레딧"
          value={profile?.credits ?? 0}
          unit="점"
          color="var(--credit-color)"
          icon="💎"
        />
        <StatCard
          label="등록한 재능"
          value={myListings?.length ?? 0}
          unit="개"
          color="var(--primary)"
          icon="🎯"
        />
        <StatCard
          label="대기 중인 요청"
          value={pendingCount}
          unit="건"
          color={pendingCount > 0 ? '#E63946' : 'var(--text-secondary)'}
          icon="📬"
        />
        <StatCard
          label="평점"
          value={profile?.rating ? profile.rating.toFixed(1) : '-'}
          unit={profile?.rating_count ? `(${profile.rating_count}건)` : ''}
          color="#F4A261"
          icon="⭐"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

        {/* Quick actions */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>
            빠른 실행
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/listings/new" className="btn btn-primary" style={{ justifyContent: 'flex-start', padding: '12px 16px' }}>
              🎁 새 재능/경험 등록하기
            </Link>
            <Link href="/exchange" className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px 16px' }}>
              🔄 교환 요청 관리
            </Link>
            <Link href="/profile" className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px 16px' }}>
              👤 내 프로필 수정
            </Link>
          </div>

          {pendingCount > 0 && (
            <div style={{
              marginTop: 16, padding: '12px 14px', borderRadius: 10,
              background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.2)',
            }}>
              <p style={{ fontSize: 13, color: '#E63946', fontWeight: 600 }}>
                📬 {pendingCount}개의 교환 요청이 대기 중입니다
              </p>
              <Link href="/exchange" style={{ fontSize: 12, color: '#E63946', textDecoration: 'underline' }}>
                확인하러 가기 →
              </Link>
            </div>
          )}
        </div>

        {/* My listings */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>내 재능 목록</h2>
            <Link href="/listings/new" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>+ 추가</Link>
          </div>
          {myListings?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myListings.map((l: any) => (
                <div key={l.id} style={{
                  padding: '10px 12px', borderRadius: 10,
                  border: '1.5px solid var(--border)', background: 'var(--surface)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{l.title}</span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600,
                      background: l.status === 'active' ? 'rgba(45,106,79,0.1)' : 'rgba(154,154,146,0.15)',
                      color: l.status === 'active' ? 'var(--primary)' : 'var(--text-muted)',
                    }}>
                      {l.status === 'active' ? '활성' : l.status === 'completed' ? '완료' : '비활성'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{l.category}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
              <p style={{ fontSize: 13 }}>아직 등록한 재능이 없어요</p>
            </div>
          )}
        </div>

        {/* Credit history */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>
            크레딧 내역
          </h2>
          {transactions?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {transactions.map((t: any) => (
                <div key={t.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{t.description || t.type}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(t.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 15, fontWeight: 700,
                    color: t.amount > 0 ? 'var(--primary)' : '#E63946',
                  }}>
                    {t.amount > 0 ? '+' : ''}{t.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              거래 내역이 없어요
            </p>
          )}
        </div>

        {/* Recommended matches */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>
            🔄 교환 가능한 재능
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            크레딧 없이 교환할 수 있는 재능들
          </p>
          {matches?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {matches.map((m: any) => (
                <Link key={m.id} href={`/listings/${m.id}`} style={{
                  padding: '10px 12px', borderRadius: 10,
                  border: '1.5px solid var(--border)', background: 'var(--surface)',
                  display: 'block', transition: 'all 0.15s ease',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{m.title}</span>
                    <span className="badge badge-exchange" style={{ fontSize: 10 }}>교환</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {m.profiles?.username} · {m.category}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              현재 교환 가능한 재능이 없어요
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, color, icon }: any) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value} <span style={{ fontSize: 14, fontWeight: 600 }}>{unit}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</p>
    </div>
  )
}
