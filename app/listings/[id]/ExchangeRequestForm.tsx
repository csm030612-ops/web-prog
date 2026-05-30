'use client'

import { useState } from 'react'
import { createExchangeRequest } from '@/lib/actions/listings'

export function ExchangeRequestForm({
  listing,
  userCredits,
  currentUserId,
}: {
  listing: any
  userCredits: number
  currentUserId: string
}) {
  const [mode, setMode] = useState<'credit' | 'exchange'>(
    listing.mode === 'exchange' ? 'exchange' : 'credit'
  )
  const [message, setMessage] = useState('')
  const [mySkillOffer, setMySkillOffer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const hasEnoughCredits = userCredits >= 50

  async function handleSubmit() {
    setError('')
    if (!message.trim()) {
      setError('메시지를 입력해주세요')
      return
    }
    if (mode === 'exchange' && !mySkillOffer.trim()) {
      setError('제공할 재능을 입력해주세요')
      return
    }
    setLoading(true)
    const result = await createExchangeRequest(
      listing.id,
      listing.user_id,
      mode,
      message,
      mySkillOffer
    )
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="card" style={{ padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>요청 완료!</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          상대방의 수락을 기다려주세요.<br />
          교환 내역에서 확인할 수 있어요.
        </p>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>교환 신청</h3>

      {/* Current credits */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 10, marginBottom: 16,
        background: 'var(--surface-2)',
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>내 크레딧</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--credit-color)' }}>
          {userCredits}점
        </span>
      </div>

      {/* Mode selection */}
      {listing.mode === 'both' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {([
            { value: 'credit', label: '💎 크레딧', sub: '50점 차감' },
            { value: 'exchange', label: '🔄 재능교환', sub: '무료' },
          ] as const).map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              style={{
                padding: '10px 8px', borderRadius: 10, border: `2px solid`,
                borderColor: mode === m.value ? 'var(--primary)' : 'var(--border)',
                background: mode === m.value ? 'rgba(45,106,79,0.04)' : 'white',
                color: mode === m.value ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div>{m.label}</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{m.sub}</div>
            </button>
          ))}
        </div>
      )}

      {/* Credit warning */}
      {mode === 'credit' && !hasEnoughCredits && (
        <div style={{
          padding: '10px 12px', borderRadius: 8, marginBottom: 12,
          background: 'rgba(230,57,70,0.06)', color: '#E63946', fontSize: 13,
        }}>
          크레딧이 부족합니다. (필요: 50점, 보유: {userCredits}점)
        </div>
      )}

      {mode === 'credit' && hasEnoughCredits && (
        <div style={{
          padding: '10px 12px', borderRadius: 8, marginBottom: 12,
          background: 'rgba(123,94,167,0.06)', color: 'var(--credit-color)', fontSize: 13,
        }}>
          💎 수락 시 50 크레딧이 차감됩니다
        </div>
      )}

      {mode === 'exchange' && (
        <div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ fontSize: 13 }}>내가 제공할 재능 *</label>
            <input
              type="text"
              className="form-input"
              placeholder="예: 영어 회화, 디자인 피드백..."
              value={mySkillOffer}
              onChange={e => setMySkillOffer(e.target.value)}
              style={{ fontSize: 13, padding: '10px 12px' }}
            />
          </div>
          <div style={{
            padding: '10px 12px', borderRadius: 8, marginBottom: 12,
            background: 'rgba(45,106,79,0.06)', color: 'var(--primary)', fontSize: 13,
          }}>
            🔄 재능 교환은 크레딧 소모 없이 무료!
          </div>
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label" style={{ fontSize: 13 }}>신청 메시지 *</label>
        <textarea
          className="form-input"
          placeholder="간단한 소개와 함께 어떤 도움이 필요한지 적어주세요..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          style={{ fontSize: 13, padding: '10px 12px', resize: 'vertical' }}
        />
      </div>

      {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || (mode === 'credit' && !hasEnoughCredits)}
        className="btn btn-primary"
        style={{ width: '100%', padding: '12px', fontSize: 14 }}
      >
        {loading ? '신청 중...' : '교환 신청하기'}
      </button>
    </div>
  )
}
