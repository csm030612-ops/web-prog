'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createListing } from '@/lib/actions/listings'
import { CATEGORIES } from '@/types'

export default function NewListingPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'credit' | 'exchange' | 'both'>('credit')
  const [type, setType] = useState<'offer' | 'request'>('offer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createListing(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
          재능/경험 등록하기
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          제공 가능한 재능이나 필요한 도움을 등록해보세요
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Type selector */}
        <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>등록 유형</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(['offer', 'request'] as const).map((t) => (
              <label key={t} style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '16px', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${type === t ? 'var(--primary)' : 'var(--border)'}`,
                background: type === t ? 'rgba(45,106,79,0.04)' : 'white',
                transition: 'all 0.15s ease',
              }}>
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={type === t}
                  onChange={() => setType(t)}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: 24 }}>{t === 'offer' ? '🎁' : '🙋'}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: type === t ? 'var(--primary)' : 'var(--text-primary)' }}>
                  {t === 'offer' ? '제공 가능' : '도움 요청'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {t === 'offer' ? '내가 해줄 수 있는 것' : '내가 필요한 것'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Mode selector */}
        <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>거래 방식</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {([
              { value: 'credit', label: '크레딧', desc: '50 크레딧', emoji: '💎' },
              { value: 'exchange', label: '재능교환', desc: '크레딧 무료', emoji: '🔄' },
              { value: 'both', label: '둘 다', desc: '선택 가능', emoji: '✨' },
            ] as const).map((m) => (
              <label key={m.value} style={{
                display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center',
                padding: '14px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                border: `2px solid ${mode === m.value ? 'var(--primary)' : 'var(--border)'}`,
                background: mode === m.value ? 'rgba(45,106,79,0.04)' : 'white',
                transition: 'all 0.15s ease',
              }}>
                <input
                  type="radio"
                  name="mode"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: 20 }}>{m.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{m.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>상세 정보</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">제목 *</label>
              <input
                name="title"
                type="text"
                className="form-input"
                placeholder="예: React 개발 도움 드립니다"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">카테고리 *</label>
              <select name="category" className="form-input" required>
                <option value="">카테고리 선택</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">상세 설명 *</label>
              <textarea
                name="description"
                className="form-input"
                placeholder="어떤 재능/경험을 제공하거나 필요로 하시는지 자세히 적어주세요."
                rows={4}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {(mode === 'exchange' || mode === 'both') && (
              <div className="form-group">
                <label className="form-label">
                  원하는 교환 재능
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
                    (교환 매칭에 활용됩니다)
                  </span>
                </label>
                <input
                  name="exchange_for"
                  type="text"
                  className="form-input"
                  placeholder="예: 영어 회화, 요리 레시피 공유, 디자인 피드백..."
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                태그
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
                  쉼표로 구분 (예: react, 프론트엔드, 초보)
                </span>
              </label>
              <input
                name="tags"
                type="text"
                className="form-input"
                placeholder="태그1, 태그2, 태그3"
              />
            </div>
          </div>
        </div>

        {/* Preview box */}
        <div style={{
          padding: '16px 20px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(45,106,79,0.06)', border: '1px solid rgba(45,106,79,0.2)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
            💡 등록 안내
          </p>
          <ul style={{ fontSize: 12, color: 'var(--text-secondary)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mode !== 'exchange' && <li>• 크레딧 거래: 도움 제공 시 50 크레딧 획득</li>}
            {mode !== 'credit' && <li>• 재능 교환: 크레딧 없이 서로 교환 가능</li>}
            <li>• 등록 후 언제든지 수정/삭제 가능</li>
          </ul>
        </div>

        {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => router.back()}
            style={{ flex: 1, padding: '13px' }}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ flex: 2, padding: '13px', fontSize: 15 }}
          >
            {loading ? '등록 중...' : '재능 등록하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
