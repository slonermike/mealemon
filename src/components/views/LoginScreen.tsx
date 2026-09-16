import { useState } from 'react'
import { useAuthStore } from '@/store/authSlice'

export function LoginScreen() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setAuthenticated()
      } else {
        setError('Incorrect password')
        setPassword('')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={heroWrapStyle}>
          <div style={heroCircleStyle} />
        </div>
        <h1 style={titleStyle}>{'Mealemon'}</h1>
        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            type={'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={'Password'}
            autoFocus={true} // eslint-disable-line jsx-a11y/no-autofocus
            style={inputStyle}
            disabled={loading}
          />
          {error && <p style={errorStyle}>{error}</p>}
          <button type={'submit'} style={buttonStyle} disabled={loading || !password}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f9fafb',
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: '32px 24px',
  width: '100%',
  maxWidth: 320,
}

const heroWrapStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 20,
}

const heroCircleStyle: React.CSSProperties = {
  width: 140,
  height: 140,
  borderRadius: '50%',
  backgroundImage: 'url(/login-hero.jpeg)',
  backgroundSize: '220%',
  backgroundPosition: '52% 18%',
  border: '3px solid #e5e7eb',
  flexShrink: 0,
}

const titleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  textAlign: 'center',
  marginBottom: 24,
  color: '#111827',
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 16,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box',
}

const errorStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#dc2626',
  margin: 0,
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 0',
  fontSize: 15,
  fontWeight: 600,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}
