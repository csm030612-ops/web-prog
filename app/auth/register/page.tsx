'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { CATEGORIES } from '@/types'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '', password: '', username: '', full_name: '',
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await signUp(fd)
    if (result?.error) {
      setError(result.error)
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
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌱</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--primary)' }}>
            TalentEx 가입하기
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            가입 즉시 <strong>100 크레딧</strong>을 드립니다 🎁
          </p>
        </div>

        <div className="card" style={{ padding: '36px 32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">이름</label>
                <input
                  name="full_name"
                  type="text"
                  className="form-input"
                  placeholder="홍길동"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">사용자명</label>
                <input
                  name="username"
                  type="text"
                  className="form-input"
                  placeholder="gildong123"
                  pattern="[a-zA-Z0-9_]+"
                  title="영문, 숫자, 밑줄만 사용 가능"
                  required
                />
              </div>
            </div>

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
                placeholder="6자 이상"
                minLength={6}
                required
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: '#FFF0F0', color: '#E63946',
                fontSize: 13, fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Benefits */}
            <div style={{
              padding: '16px', borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(45,106,79,0.06), rgba(82,183,136,0.08))',
              border: '1px solid rgba(45,106,79,0.15)',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
                🎁 가입 혜택
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['100 크레딧 즉시 지급', '재능 교환은 크레딧 무료', '도움 제공 시 50 크레딧 획득'].map(item => (
                  <li key={item} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--primary)' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '13px', fontSize: 15 }}
            >
              {loading ? '계정 생성 중...' : '무료로 시작하기'}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
