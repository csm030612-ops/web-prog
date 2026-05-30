import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateListing } from '@/lib/actions/listings'

export default async function ListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (!listing) notFound()
  if (listing.user_id !== user.id) redirect('/dashboard')

  const updateListingWithId = updateListing.bind(null, listing.id)

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Link href={`/listings/${listing.id}`} style={{ fontSize: 14, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          ← 상세 페이지로 돌아가기
        </Link>

        <div className="card" style={{ padding: '32px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>
            게시글 수정하기
          </h1>

          {/* 에러 해결 핵심: async (formData) => { ... } 구조로 wrapping 하여 void/Promise<void> 타입 충족 */}
          <form 
            action={async (formData) => {
              'use server';
              await updateListingWithId(formData);
            }} 
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            
            {/* 글 종류 */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>구분</label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" name="type" value="offer" defaultChecked={listing.type === 'offer'} required />
                  재능 제공 (Offer)
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" name="type" value="seek" defaultChecked={listing.type === 'seek'} required />
                  도움 요청 (Seek)
                </label>
              </div>
            </div>

            {/* 거래 방식 */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>교환 방식</label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" name="mode" value="exchange" defaultChecked={listing.mode === 'exchange'} required />
                  재능 교환
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" name="mode" value="credit" defaultChecked={listing.mode === 'credit'} required />
                  크레딧 (50 Credits)
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="radio" name="mode" value="both" defaultChecked={listing.mode === 'both'} required />
                  둘 다 가능
                </label>
              </div>
            </div>

            {/* 제목 */}
            <div>
              <label htmlFor="title" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>제목</label>
              <input
                id="title"
                type="text"
                name="title"
                defaultValue={listing.title}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'inherit', fontSize: 14 }}
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label htmlFor="category" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>카테고리</label>
              <input
                id="category"
                type="text"
                name="category"
                defaultValue={listing.category}
                placeholder="예: 개발, 디자인, 어학, 마케팅"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'inherit', fontSize: 14 }}
              />
            </div>

            {/* 내용 */}
            <div>
              <label htmlFor="description" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>내용 설명</label>
              <textarea
                id="description"
                name="description"
                defaultValue={listing.description}
                rows={6}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'inherit', fontSize: 14, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {/* 희망 교환 재능 */}
            <div>
              <label htmlFor="exchange_for" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>원하는 교환 재능 (선택)</label>
              <input
                id="exchange_for"
                type="text"
                name="exchange_for"
                defaultValue={listing.exchange_for || ''}
                placeholder="받고 싶은 능력을 적어주세요"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'inherit', fontSize: 14 }}
              />
            </div>

            {/* 태그 */}
            <div>
              <label htmlFor="tags" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>태그 (쉼표로 구분)</label>
              <input
                id="tags"
                type="text"
                name="tags"
                defaultValue={listing.tags?.join(', ') || ''}
                placeholder="Next.js, UI설계, 영어회화"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'inherit', fontSize: 14 }}
              />
            </div>

            {/* 제출 버튼 세트 */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <Link
                href={`/listings/${listing.id}`}
                className="btn btn-outline"
                style={{ flex: 1, textAlign: 'center', padding: '12px', textDecoration: 'none', fontSize: 14 }}
              >
                취소
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                수정 완료
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}