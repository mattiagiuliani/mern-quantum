import { lazy, Suspense, Component } from 'react'
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { TOKENS } from './styles/tokens'

const { colors: C, fonts: F, radius: R } = TOKENS

const HomePage = lazy(() => import('./pages/Homepage'))
const CircuitBuilderPage = lazy(() => import('./pages/CircuitBuilderPage'))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ResultsPage = lazy(() => import('./pages/ResultsPage'))

const NAV_HIDDEN = ['/login', '/register']
const BTN = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: F.mono, fontSize: 10,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  padding: '4px 10px', borderRadius: R.sm, transition: 'color 0.2s',
}

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, logout } = useAuth()
  if (NAV_HIDDEN.includes(location.pathname)) return null
  const active = (p) => location.pathname === p
  const link = (p) => ({ ...BTN, color: active(p) ? C.teal : C.textMuted })
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 24px', height: 48,
      background: 'rgba(8,12,20,0.92)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <button onClick={() => navigate('/')} style={{ ...BTN, fontSize: 11, letterSpacing: '0.2em', color: C.teal }}>
        mern-quantum
      </button>
      <div style={{ display: 'flex', gap: 2 }}>
        <button style={link('/circuit-builder')} onClick={() => navigate('/circuit-builder')}>Builder</button>
        <button style={link('/templates')} onClick={() => navigate('/templates')}>Templates</button>
        {user && <button style={link('/dashboard')} onClick={() => navigate('/dashboard')}>My Circuits</button>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!loading && (user ? (
          <>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', fontFamily: F.mono }}>{user.username}</span>
            <button onClick={async () => { await logout() }} style={{ ...BTN, border: `1px solid ${C.border}`, color: C.textMuted }}>Sign out</button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/login')} style={{ ...BTN, border: `1px solid ${C.borderStrong}`, color: C.textMuted }}>Sign in</button>
            <button onClick={() => navigate('/register')} style={{ ...BTN, border: `1px solid ${C.tealFaint}`, color: C.teal }}>Register</button>
          </>
        ))}
      </div>
    </nav>
  )
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20,
          background: '#080C14', color: '#F1EDE4',
          fontFamily: "'Space Mono', monospace", textAlign: 'center', padding: 24,
        }}>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#FCA5A5', textTransform: 'uppercase' }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', maxWidth: 400 }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'none', border: '1px solid rgba(110,231,208,0.4)', color: '#6EE7D0',
              fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '0.1em',
              textTransform: 'uppercase', padding: '8px 20px', borderRadius: 4, cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function RouteFallback() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080C14', color: 'rgba(241,237,228,0.8)',
      fontFamily: "'Space Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12,
    }}>
      Loading...
    </div>
  )
}

function AppShell() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/circuit-builder" element={<CircuitBuilderPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppShell />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}
