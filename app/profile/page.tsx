import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditForm } from './ProfileEditForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: listings }, { data: reviews }, { data: transactions }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('listings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(username)')
        .eq('reviewee_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('credit_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ])

  const totalEarned = transactions?.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0) ?? 0
  const totalSpent = Math.abs(transactions?.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + t.amount, 0) ?? 0)
  const completedCount = listings?.filter((l: any) => l.status === 'completed').length ?? 0

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* Profile header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
          borderRadius: 'var(--radius-lg)', padding: '36px 40px',
          color: 'white', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 28,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, flexShrink: 0,
          }}>
            {profile?.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              {profile?.full_name || profile?.username}
            </h1>
            <p style={{ opacity: 0.75, fontSize: 14, marginBottom: 8 }}>@{profile?.username}</p>
            {profile?.bio && (
              <p style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.5 }}>{profile.bio}</p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{profile?.credits}</div>
            <div style={{ opacity: 0.7, fontSize: 13, marginTop: 2 }}>크레딧</div>
            {profile?.rating > 0 && (
              <div style={{ marginTop: 8, fontSize: 14 }}>
                ★ {profile.rating.toFixed(1)} ({profile.rating_count})
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: '등록한 재능', value: listings?.length ?? 0 },
            { label: '완료한 교환', value: completedCount },
            { label: '획득 크레딧', value: totalEarned },
            { label: '사용 크레딧', value: totalSpent },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Edit form */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>
              프로필 수정
            </h2>
            <ProfileEditForm profile={profile} />
          </div>

          {/* Reviews */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>
              받은 후기
            </h2>
            {reviews?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviews.map((r: any) => (
                  <div key={r.id} style={{
                    padding: '14px 16px', borderRadius: 12,
                    border: '1.5px solid var(--border)', background: 'white',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{r.reviewer?.username}</span>
                      <span style={{ color: '#F4A261', fontSize: 14 }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    {r.comment && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '40px 24px', textAlign: 'center',
                border: '1.5px dashed var(--border)', borderRadius: 16, color: 'var(--text-muted)',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
                <p style={{ fontSize: 13 }}>아직 받은 후기가 없어요</p>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {profile?.skills?.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>
              보유 스킬
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profile.skills.map((skill: string) => (
                <span key={skill} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'rgba(45,106,79,0.1)', color: 'var(--primary)',
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
