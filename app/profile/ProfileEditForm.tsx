'use client'

import { useState } from 'react'
import { updateProfile } from '@/lib/actions/auth'

export function ProfileEditForm({ profile }: { profile: any }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">이름</label>
          <input
            name="full_name"
            type="text"
            className="form-input"
            defaultValue={profile?.full_name || ''}
            placeholder="홍길동"
          />
        </div>

        <div className="form-group">
          <label className="form-label">한 줄 소개</label>
          <textarea
            name="bio"
            className="form-input"
            defaultValue={profile?.bio || ''}
            placeholder="간단하게 자신을 소개해주세요"
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">지역</label>
          <input
            name="location"
            type="text"
            className="form-input"
            defaultValue={profile?.location || ''}
            placeholder="예: 서울 강남구"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            보유 스킬
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
              쉼표로 구분
            </span>
          </label>
          <input
            name="skills"
            type="text"
            className="form-input"
            defaultValue={profile?.skills?.join(', ') || ''}
            placeholder="React, 영어, 요리..."
          />
        </div>

        {error && <p className="error-text">{error}</p>}
        {success && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 13,
            background: 'rgba(45,106,79,0.08)', color: 'var(--primary)', fontWeight: 600,
          }}>
            ✓ 프로필이 업데이트되었습니다
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '12px', fontSize: 14 }}
        >
          {loading ? '저장 중...' : '저장하기'}
        </button>
      </form>
    </div>
  )
}
