import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

const HomePage = lazy(() => import('./pages/Homepage'))
const CircuitBuilderPage = lazy(() => import('./pages/CircuitBuilderPage'))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080C14',
        color: 'rgba(241,237,228,0.8)',
        fontFamily: "'Space Mono', monospace",
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontSize: 12,
      }}
    >
      Loading...
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/circuit-builder" element={<CircuitBuilderPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
