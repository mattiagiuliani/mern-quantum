import { useEffect, useState, useCallback } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getMineCircuits, deleteCircuit } from '../api/apiClient'
import { useAuth } from '../hooks/useAuth'

const S = {
  page: {
    minHeight: '100vh',
    background: '#080C14',
    color: '#F1EDE4',
    fontFamily: "'Space Mono', monospace",
    padding: '32px 24px',
  },
  inner: { maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 },
  eyebrow: { fontSize: 10, letterSpacing: '0.2em', color: '#6EE7D0', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: '#F1EDE4', letterSpacing: '-0.02em', margin: 0 },
  card: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: '18px 22px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  cardName: { flex: 1, minWidth: 160, fontSize: 14, fontWeight: 700, color: '#F1EDE4', letterSpacing: '-0.01em' },
  cardMeta: { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 },
  badge: {
    fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '4px 10px', borderRadius: 6,
    border: '1px solid rgba(110,231,208,0.25)',
    color: 'rgba(110,231,208,0.8)',
  },
  empty: {
    textAlign: 'center', padding: '60px 24px',
    color: 'rgba(255,255,255,0.3)', fontSize: 13,
    border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 14,
  },
  btnBase: { fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '0.06em', border: 'none', padding: '6px 14px', borderRadius: 6 },
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [circuits, setCircuits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getMineCircuits()
      setCircuits(data.circuits ?? [])
    } catch {
      setError('Could not load circuits.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) load()
  }, [authLoading, user, load])

  const handleLoad = useCallback((circuit) => {
    navigate('/circuit-builder', { state: { savedCircuitToLoad: circuit } })
  }, [navigate])

  const handleDelete = useCallback(async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 3000)
      return
    }
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      await deleteCircuit(id)
      setCircuits(prev => prev.filter(c => c._id !== id))
    } catch {
      setError('Could not delete circuit.')
    } finally {
      setDeletingId(null)
    }
  }, [confirmDeleteId])

  if (authLoading || (loading && !circuits.length)) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner animation="border" variant="info" />
      </div>
    )
  }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');`}</style>
      <div style={S.inner}>

        {/* header */}
        <div style={S.header}>
          <div>
            <div style={S.eyebrow}>mern-quantum · Dashboard</div>
            <h1 style={S.title}>Saved Circuits</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/')}
              style={{ ...S.btnBase, color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              Home
            </Button>
            <Button
              variant="outline-info"
              onClick={() => navigate('/circuit-builder')}
              style={{ ...S.btnBase, color: '#6EE7D0', borderColor: 'rgba(110,231,208,0.4)' }}
            >
              + New Circuit
            </Button>
          </div>
        </div>

        {error && (
          <div style={{ color: '#FCA5A5', fontSize: 12, padding: '10px 16px', border: '1px solid rgba(252,165,165,0.2)', borderRadius: 8 }}>
            {error}
          </div>
        )}

        {/* list */}
        {circuits.length === 0 ? (
          <div style={S.empty}>
            <div style={{ marginBottom: 12, fontSize: 24 }}>⊙</div>
            <div>No saved circuits yet.</div>
            <div style={{ marginTop: 8, fontSize: 11 }}>
              Build a circuit and save it from the Circuit Builder.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {circuits.map(item => (
              <div key={item._id} style={S.card}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={S.cardName}>{item.name}</div>
                  <div style={S.cardMeta}>
                    {item.qubits} qubit{item.qubits !== 1 ? 's' : ''} · saved {formatDate(item.updatedAt)}
                  </div>
                </div>

                <div style={S.badge}>
                  {(item.circuitMatrix ?? []).reduce((acc, row) => acc + row.filter(Boolean).length, 0)} gates
                </div>

                <Button
                  variant="outline-info"
                  onClick={() => handleLoad(item)}
                  style={{ ...S.btnBase, color: '#6EE7D0', borderColor: 'rgba(110,231,208,0.35)', fontSize: 11 }}
                >
                  Load
                </Button>
                {item.lastResult && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/results', {
                      state: {
                        results: item.lastResult,
                        shots: Array.isArray(item.lastResult) ? null : item.lastResult.shots,
                        circuitName: item.name,
                        circuitMatrix: item.circuitMatrix,
                      },
                    })}
                    style={{ ...S.btnBase, border: '1px solid rgba(167,139,250,0.3)', color: 'rgba(167,139,250,0.85)', fontSize: 11 }}
                  >
                    Results
                  </Button>
                )}
                {confirmDeleteId === item._id ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#FCA5A5', fontFamily: "'Space Mono', monospace", letterSpacing: '0.04em' }}>Sure?</span>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={deletingId === item._id}
                      onClick={() => handleDelete(item._id)}
                      style={{ ...S.btnBase, color: '#FCA5A5', border: '1px solid rgba(252,165,165,0.5)', fontSize: 10, padding: '3px 8px' }}
                    >
                      {deletingId === item._id ? <Spinner size="sm" animation="border" /> : 'Yes, delete'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => setConfirmDeleteId(null)}
                      style={{ ...S.btnBase, color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, padding: '3px 8px' }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline-danger"
                    disabled={deletingId === item._id}
                    onClick={() => handleDelete(item._id)}
                    style={{ ...S.btnBase, color: '#FCA5A5', border: '1px solid rgba(252,165,165,0.3)', fontSize: 11 }}
                  >
                    {deletingId === item._id ? <Spinner size="sm" animation="border" /> : 'Delete'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
