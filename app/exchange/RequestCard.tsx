'use client'

import { useState } from 'react'
import { respondToRequest, completeExchange, submitReview } from '@/lib/actions/listings'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '대기 중', color: '#C07038', bg: 'rgba(244,162,97,0.12)' },
  accepted: { label: '수락됨', color: 'var(--primary)', bg: 'rgba(45,106,79,0.1)' },
  rejected: { label: '거절됨', color: '#E63946', bg: 'rgba(230,57,70,0.08)' },
  completed: { label: '완료', color: 'var(--text-muted)', bg: 'var(--surface-2)' },
  cancelled: { label: '취소됨', color: 'var(--text-muted)', bg: 'var(--surface-2)' },
}

export function RequestCard({
  request,
  type,
  currentUserId,
}: {
  request: any
  type: 'incoming' | 'outgoing'
  currentUserId: string
}) {
  const [loading, setLoading] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const status = STATUS_MAP[request.status] || STATUS_MAP.pending
  const otherUser = type === 'incoming' ? request.requester : request.provider

  async function handleAction(action: 'accept' | 'reject') {
    setLoading(true)
    await respondToRequest(request.id, action)
    setLoading(false)
  }

  async function handleComplete() {
    setLoading(true)
    await completeExchange(request.id)
    setLoading(false)
  }

  async function handleReview() {
    setLoading(true)
    const revieweeId = type === 'incoming' ? request.requester_id : request.provider_id
    await submitReview(request.id, revieweeId, rating, comment)
    setShowReview(false)
    setLoading(false)
  }

  return (
    <div style={{
      padding: '18px 20px', borderRadius: 14,
      border: '1.5px solid var(--border)',
      background: 'white',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
            {request.listings?.title}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {request.listings?.category}
          </p>
        </div>
        <span style={{
          padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
          color: status.color, background: status.bg,
        }}>
          {status.label}
        </span>
      </div>

      {/* User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--surface)' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          {otherUser?.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700 }}>{otherUser?.username}</p>
          {otherUser?.rating > 0 && (
            <p style={{ fontSize: 11, color: '#F4A261' }}>★ {otherUser.rating.toFixed(1)}</p>
          )}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className={`badge ${request.mode === 'credit' ? 'badge-credit' : 'badge-exchange'}`} style={{ fontSize: 11 }}>
            {request.mode === 'credit' ? `💎 ${request.credit_amount}점` : '🔄 교환'}
          </span>
        </div>
      </div>

      {/* Message */}
      {request.message && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
          "{request.message}"
        </p>
      )}

      {/* Skill offer for exchange */}
      {request.mode === 'exchange' && request.my_skill_offer && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 12,
          background: 'rgba(45,106,79,0.06)', fontSize: 13, color: 'var(--primary)',
        }}>
          제공 재능: {request.my_skill_offer}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {type === 'incoming' && request.status === 'pending' && (
          <>
            <button
              onClick={() => handleAction('accept')}
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1, padding: '9px 12px', fontSize: 13 }}
            >
              {loading ? '처리 중...' : '✓ 수락'}
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={loading}
              className="btn btn-outline"
              style={{ flex: 1, padding: '9px 12px', fontSize: 13 }}
            >
              ✕ 거절
            </button>
          </>
        )}

        {request.status === 'accepted' && request.mode === 'exchange' && (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="btn btn-primary"
            style={{ flex: 1, padding: '9px 12px', fontSize: 13 }}
          >
            {loading ? '...' : '🎉 교환 완료 확인'}
          </button>
        )}

        {request.status === 'completed' && !showReview && (
          <button
            onClick={() => setShowReview(true)}
            className="btn btn-outline"
            style={{ flex: 1, padding: '9px 12px', fontSize: 13 }}
          >
            ⭐ 후기 남기기
          </button>
        )}
      </div>

      {/* Review form */}
      {showReview && (
        <div style={{ marginTop: 12, padding: '14px', borderRadius: 10, background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {[1,2,3,4,5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                style={{
                  background: 'none', border: 'none', fontSize: 22, cursor: 'pointer',
                  color: star <= rating ? '#F4A261' : 'var(--border)',
                }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="form-input"
            placeholder="후기를 남겨주세요 (선택)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
            style={{ fontSize: 13, width: '100%', marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleReview} disabled={loading} className="btn btn-primary" style={{ flex: 1, fontSize: 13, padding: '8px' }}>
              등록
            </button>
            <button onClick={() => setShowReview(false)} className="btn btn-outline" style={{ flex: 1, fontSize: 13, padding: '8px' }}>
              취소
            </button>
          </div>
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
        {new Date(request.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}
