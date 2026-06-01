import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions/auth';
import { Gem } from 'lucide-react';

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let totalUnread = 0;
  let exchangeCount = 0;

  if (user) {
    // 1. 프로필 및 기타 데이터 조회
    const [{ data: p }, { data: convs }, { count }] = await Promise.all([
      supabase.from('profiles').select('username, credits').eq('id', user.id).single(),
      supabase.from('conversations').select('participant_a, participant_b, unread_a, unread_b').or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`),
      // Dashboard와 동일하게 exchange_requests 테이블 사용
      supabase
        .from('exchange_requests')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', user.id) // 대시보드 로직에 따라 provider_id로 필터링
        .eq('status', 'pending'),
    ]);

    profile = p;
    totalUnread = (convs ?? []).reduce((sum, c) => 
      sum + (c.participant_a === user.id ? (c.unread_a || 0) : (c.unread_b || 0)), 0);
    
    exchangeCount = count ?? 0;
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">Talent<span>Ex</span></Link>
        <Link href="/" style={{ padding: '6px 12px', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>탐색</Link>

        {user ? (
          <>
            <Link href="/dashboard" style={{ padding: '6px 12px', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>대시보드</Link>
            
            {/* 교환 내역: 이제 exchange_requests 테이블을 조회하므로 숫자가 정상적으로 뜹니다 */}
            <Link href="/exchange" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', padding: '6px 12px', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              교환 내역
              {exchangeCount > 0 && (
                <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px', background: '#E63946', color: 'white', fontSize: 10, fontWeight: 800 }}>
                  {exchangeCount > 9 ? '9+' : exchangeCount}
                </span>
              )}
            </Link>

            <Link href="/messages" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', padding: '6px 12px', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              메시지
              {totalUnread > 0 && (
                <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px', background: '#E63946', color: 'white', fontSize: 10, fontWeight: 800 }}>
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Link>

            <Link href="/listings/new" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>+ 등록하기</Link>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="credit-badge"><Gem size={14} /> {profile?.credits ?? 0}</span>
              <form action={signOut}><button type="submit" className="btn btn-ghost" style={{ fontSize: 13 }}>로그아웃</button></form>
            </div>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>로그인</Link>
            <Link href="/auth/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>시작하기</Link>
          </>
        )}
      </div>
    </nav>
  );
}