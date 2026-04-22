import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { getApiErrorMessage } from '../api/apiError'
import { createAuthPageStyles } from './authPage.styles'
import { useAuth } from '../hooks/useAuth'

const S = createAuthPageStyles()

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setError('')
    setLoading(true)

    try {
      await register(username, email, password)
      navigate('/circuit-builder')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please try again.'))
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
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Create account</h1>
        </div>

        <Form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Form.Group>
            <Form.Label style={S.label}>Username</Form.Label>
            <Form.Control
              type="text"
              required
              autoComplete="username"
              minLength={3}
              maxLength={30}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={S.input}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label style={S.label}>Email</Form.Label>
            <Form.Control
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={S.input}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label style={S.label}>Password</Form.Label>
            <Form.Control
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                Creating account...
              </span>
            ) : 'Create account'}
          </Button>
        </Form>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={S.link}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
