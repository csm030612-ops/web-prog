'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export function SearchBar({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(q: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (q.trim()) {
      params.set('q', q.trim())
    } else {
      params.delete('q')
    }
    return `${pathname}?${params.toString()}`
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setValue(q)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        router.push(buildUrl(q))
      })
    }, 380)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    startTransition(() => {
      router.push(buildUrl(value))
    })
  }

  function handleClear() {
    setValue('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    startTransition(() => {
      router.push(buildUrl(''))
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative', marginBottom: 14 }}>
      {/* 검색 아이콘 */}
      <span style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: isPending ? 'var(--primary)' : 'var(--text-muted)',
        fontSize: 16, pointerEvents: 'none',
        transition: 'color 0.2s',
      }}>
        {isPending ? '⟳' : '🔍'}
      </span>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="재능, 키워드, 카테고리로 검색..."
        style={{
          width: '100%',
          padding: '12px 44px 12px 42px',
          border: '1.5px solid var(--border)',
          borderRadius: 12,
          fontSize: 15,
          background: 'white',
          color: 'var(--text-primary)',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxSizing: 'border-box',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--primary)'
          e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.1)'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border)'
          e.target.style.boxShadow = 'none'
        }}
      />

      {/* 지우기 버튼 */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'var(--surface-2)', border: 'none', cursor: 'pointer',
            width: 22, height: 22, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: 13, fontWeight: 700,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
        >
          ×
        </button>
      )}
    </form>
  )
}
