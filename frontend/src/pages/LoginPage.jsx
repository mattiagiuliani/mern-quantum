import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const S = {
  page: {
    background: '#080C14',
    minHeight: '100vh',
    color: '#F1EDE4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Mono', monospace",
    padding: '24px',
  },
  card: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: '40px 44px',
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  label: {
    display: 'block',
    fontSize: 10,
    letterSpacing: '0.15em',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    padding: '12px 14px',
    color: '#F1EDE4',
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    background: 'transparent',
    border: '1.5px solid #6EE7D0',
    color: '#6EE7D0',
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '14px',
    borderRadius: 8,
    cursor: 'pointer',
    textTransform: 'uppercase',
    width: '100%',
    transition: 'all 0.2s',
  },
  error: {
    fontSize: 12,
    color: '#FCA5A5',
    letterSpacing: '0.04em',
    padding: '10px 14px',
    background: 'rgba(252,165,165,0.08)',
    border: '1px solid rgba(252,165,165,0.25)',
    borderRadius: 6,
  },
  link: {
    color: '#6EE7D0',
    textDecoration: 'none',
    fontSize: 11,
  },
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/circuit-builder')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');`}</style>
      <div style={S.card}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#6EE7D0', textTransform: 'uppercase', marginBottom: 8 }}>
            mern-quantum
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Sign in</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={S.label}>Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={S.input}
            />
          </div>
          <div>
            <label style={S.label}>Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={S.input}
            />
          </div>

          {error && <div style={S.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...S.btn,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          No account?{' '}
          <Link to="/register" style={S.link}>Create one</Link>
        </div>
      </div>
    </div>
  )
}
