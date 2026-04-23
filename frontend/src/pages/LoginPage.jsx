import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { getApiErrorMessage } from '../api/apiError'
import { createAuthPageStyles } from './authPage.styles'
import { useAuth } from '../hooks/useAuth'

const S = createAuthPageStyles()

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
      setError(getApiErrorMessage(err, 'Login failed. Check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        .auth-input:focus { border-color: rgba(110,231,208,0.6) !important; outline: none !important; box-shadow: 0 0 0 3px rgba(110,231,208,0.1) !important; }
      `}</style>
      <div style={S.card}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#6EE7D0', textTransform: 'uppercase', marginBottom: 8 }}>
            mern-quantum
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Sign in</h1>
        </div>

        <Form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Form.Group>
            <Form.Label style={S.label}>Email</Form.Label>
            <Form.Control
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              style={S.input}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label style={S.label}>Password</Form.Label>
            <Form.Control
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              style={S.input}
            />
          </Form.Group>

          {error && <Alert variant="danger" style={S.error}>{error}</Alert>}

          <Button
            type="submit"
            disabled={loading}
            variant="outline-info"
            style={{
              ...S.btn,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Spinner size="sm" animation="border" />
                Signing in...
              </span>
            ) : 'Sign in'}
          </Button>
        </Form>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          No account?{' '}
          <Link to="/register" style={S.link}>Create one</Link>
        </div>
      </div>
    </div>
  )
}
