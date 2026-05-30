'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await signIn(formData)
    if (result?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #f0f9f4 0%, #fafaf8 100%)',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌱</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--primary)' }}>
            TalentEx
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 15 }}>
            재능과 경험을 나누는 커뮤니티
          </p>
        </div>

        <div className="card" style={{ padding: '36px 32px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.02em' }}>
            로그인
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input
                name="email"
                type="email"
                className="form-input"
                placeholder="hello@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '13px', fontSize: 15, marginTop: 4 }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            아직 계정이 없으신가요?{' '}
            <Link href="/auth/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              회원가입
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>
          가입 시 100 크레딧을 무료로 드립니다 🎁
        </p>
      </div>
    </div>
  )
}
