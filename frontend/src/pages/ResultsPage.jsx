import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from 'react-bootstrap'

function calculatePct(count, total) {
  if (!total) return 0
  return Math.round((count / total) * 100)
}

function FullRunResults({ results, shots, circuitName }) {
  const counts = results.counts ?? results
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        fontSize: 10, letterSpacing: '0.15em', color: '#6EE7D0',
        textTransform: 'uppercase', marginBottom: 4,
      }}>
        {circuitName} · {shots} shots
      </div>
      {entries.map(([state, count]) => {
        const pct = calculatePct(count, shots)
        return (
          <div key={state}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 14, fontWeight: 700, color: '#6EE7D0',
              }}>
                {'|' + state + '\u27E9'}
              </span>
              <span style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{pct}%</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{count}</span>
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: pct + '%',
                background: 'linear-gradient(90deg, rgba(110,231,208,0.8), rgba(110,231,208,0.35))',
                borderRadius: 4,
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GuidedRunResults({ liveState, circuitName }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        fontSize: 10, letterSpacing: '0.15em', color: '#A78BFA',
        textTransform: 'uppercase', marginBottom: 4,
      }}>
        {circuitName} · guided run final state
      </div>
      {liveState.map((q, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '10px 14px',
          background: 'rgba(167,139,250,0.06)',
          border: '1px solid rgba(167,139,250,0.18)',
          borderRadius: 8,
        }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', minWidth: 30 }}>
            q[{i}]
          </span>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 18, fontWeight: 700,
            color: q.superposition ? '#FCD34D' : q.value === 1 ? '#FCA5A5' : '#6EE7D0',
          }}>
            {q.superposition ? '|+⟩' : q.value === 1 ? '|1⟩' : '|0⟩'}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: "'Space Mono', monospace" }}>
            {q.superposition ? 'superposition' : q.value === 1 ? 'measured 1' : 'ground state'}
          </span>
        </div>
      ))}
    </div>
  )
}

function QasmPreviewBlock({ circuitMatrix }) {
  if (!Array.isArray(circuitMatrix) || circuitMatrix.length === 0) return null
  const stepCount = circuitMatrix[0]?.length ?? 0
  const lines = []
  for (let s = 0; s < stepCount; s++) {
    for (let q = 0; q < circuitMatrix.length; q++) {
      const g = circuitMatrix[q][s]
      if (!g) continue
      const gName = g === 'H' ? 'h' : g === 'X' ? 'x' : 'measure'
      lines.push(g === 'M' ? `${gName} q[${q}] -> c[${q}];` : `${gName} q[${q}];`)
    }
  }
  if (lines.length === 0) return null
  const header = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${circuitMatrix.length}];\ncreg c[${circuitMatrix.length}];`
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 9, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 10 }}>
        QASM
      </div>
      <pre style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 11, color: 'rgba(255,255,255,0.6)',
        margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6,
      }}>
        {header + '\n' + lines.join('\n')}
      </pre>
    </div>
  )
}

export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state

  useEffect(() => {
    if (!state) navigate('/dashboard', { replace: true })
  }, [navigate, state])

  if (!state) return null

  const { results, shots, circuitName = 'Circuit', circuitMatrix } = state
  const isGuidedResult = Array.isArray(results)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080C14',
      color: '#F1EDE4',
      fontFamily: "'Space Mono', monospace",
      padding: '80px 24px 32px',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Lora:wght@400;500&display=swap');`}</style>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#6EE7D0', textTransform: 'uppercase', marginBottom: 6 }}>
              mern-quantum · Results
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F1EDE4', letterSpacing: '-0.02em', margin: 0 }}>
              {circuitName}
            </h1>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              {isGuidedResult ? 'Guided run · final qubit state' : shots ? `${shots} shots · probabilistic simulation` : 'Probabilistic simulation'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate(-1)}
              style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              ← Back
            </Button>
            <Button
              variant="outline-info"
              size="sm"
              onClick={() => navigate('/circuit-builder')}
              style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#6EE7D0', borderColor: 'rgba(110,231,208,0.35)' }}
            >
              Builder
            </Button>
          </div>
        </div>

        {/* results card */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(110,231,208,0.18)',
          borderRadius: 14, padding: '24px',
        }}>
          {isGuidedResult
            ? <GuidedRunResults liveState={results} circuitName={circuitName} />
            : <FullRunResults results={results} shots={shots} circuitName={circuitName} />
          }
        </div>

        {/* qasm preview */}
        {circuitMatrix && <QasmPreviewBlock circuitMatrix={circuitMatrix} />}

      </div>
    </div>
  )
}
