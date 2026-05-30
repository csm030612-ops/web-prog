import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RequestCard } from './RequestCard'

export default async function ExchangePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: incoming }, { data: outgoing }] = await Promise.all([
    supabase
      .from('exchange_requests')
      .select('*, listings(title, mode, category), requester:profiles!exchange_requests_requester_id_fkey(username, rating, skills)')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('exchange_requests')
      .select('*, listings(title, mode, category), provider:profiles!exchange_requests_provider_id_fkey(username, rating)')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
        교환 내역
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15 }}>
        받은 요청과 보낸 요청을 관리하세요
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32 }}>
        {/* Incoming */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>📬 받은 요청</h2>
            {incoming?.filter((r: any) => r.status === 'pending').length ? (
              <span style={{
                background: '#E63946', color: 'white',
                fontSize: 12, fontWeight: 700,
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {incoming.filter((r: any) => r.status === 'pending').length}
              </span>
            ) : null}
          </div>

          {incoming?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {incoming.map((req: any) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  type="incoming"
                  currentUserId={user.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="받은 요청이 없어요" />
          )}
        </div>

        {/* Outgoing */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📤 보낸 요청</h2>
          {outgoing?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {outgoing.map((req: any) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  type="outgoing"
                  currentUserId={user.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="보낸 요청이 없어요" />
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: '40px 24px', textAlign: 'center',
      border: '1.5px dashed var(--border)', borderRadius: 16,
      color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  )
}
