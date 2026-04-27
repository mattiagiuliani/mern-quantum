import { lazy, Suspense, Component } from 'react'
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import styles from './App.module.css'
import { captureFrontendError } from './config/sentry'

const HomePage = lazy(() => import('./pages/Homepage'))
const CircuitBuilderPage = lazy(() => import('./pages/CircuitBuilderPage'))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ResultsPage = lazy(() => import('./pages/ResultsPage'))

const NAV_HIDDEN = ['/login', '/register']

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, logout } = useAuth()
  if (NAV_HIDDEN.includes(location.pathname)) return null
  const active = (p) => location.pathname === p
  return (
    <nav className={styles.navbar}>
      <button onClick={() => navigate('/')} className={styles.navBrand}>
        mern-quantum
      </button>
      <div className={styles.navLinks}>
        <button className={`${styles.navLink} ${active('/circuit-builder') ? styles.active : ''}`} onClick={() => navigate('/circuit-builder')}>Builder</button>
        <button className={`${styles.navLink} ${active('/templates') ? styles.active : ''}`} onClick={() => navigate('/templates')}>Templates</button>
        {user && <button className={`${styles.navLink} ${active('/dashboard') ? styles.active : ''}`} onClick={() => navigate('/dashboard')}>My Circuits</button>}
      </div>
      <div className={styles.navActions}>
        {!loading && (user ? (
          <>
            <span className={styles.navUser}>{user.username}</span>
            <button onClick={async () => { await logout() }} className={styles.navBtn}>Sign out</button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/login')} className={styles.navBtn}>Sign in</button>
            <button onClick={() => navigate('/register')} className={`${styles.navBtn} ${styles.navBtnPrimary}`}>Register</button>
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
    captureFrontendError(error, { componentStack: info?.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorTitle}>
            Something went wrong
          </div>
          <div className={styles.errorMessage}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </div>
          <button
            onClick={() => window.location.reload()}
            className={styles.errorButton}
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
    <div className={styles.fallback}>
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
