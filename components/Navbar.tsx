import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { Gem, User, LogOut } from 'lucide-react' // 1. Gem 아이콘으로 변경

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let totalUnread = 0
  if (user) {
    const [{ data: p }, { data: convs }] = await Promise.all([
      supabase.from('profiles').select('username, credits, avatar_url').eq('id', user.id).single(),
      supabase
        .from('conversations')
        .select('participant_a, participant_b, unread_a, unread_b')
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`),
    ])
    profile = p
    totalUnread = (convs ?? []).reduce((sum: number, c: any) => {
      return sum + (c.participant_a === user.id ? c.unread_a : c.unread_b)
    }, 0)
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          Talent<span>Ex</span>
        </Link>

        <Link href="/" style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
          padding: '6px 12px', borderRadius: 8,
          transition: 'all 0.15s ease',
        }}>
          탐색
        </Link>

        {user ? (
          <>
            <Link href="/dashboard" style={{
              fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
              padding: '6px 12px', borderRadius: 8,
            }}>
              대시보드
            </Link>
            <Link href="/exchange" style={{
              fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
              padding: '6px 12px', borderRadius: 8,
            }}>
              교환 내역
            </Link>
            <Link href="/messages" style={{
              fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
              padding: '6px 12px', borderRadius: 8,
              position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              💬 메시지
              {totalUnread > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px',
                  background: '#E63946', color: 'white',
                  fontSize: 10, fontWeight: 800, lineHeight: 1,
                }}>
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Link>
            <Link href="/listings/new" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
              + 등록하기
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="credit-badge">
                {/* 2. 보석(Gem) 아이콘으로 적용 */}
                <Gem size={14} strokeWidth={2.5} />
                {profile?.credits ?? 0}
              </span>
              <Link href="/profile">
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer',
                }}>
                  {profile?.username?.[0]?.toUpperCase() ?? 'U'}
                </div>
              </Link>
              <form action={signOut}>
                <button type="submit" className="btn btn-ghost" style={{ fontSize: 13 }}>
                  로그아웃
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>
              로그인
            </Link>
            <Link href="/auth/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
              시작하기
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}