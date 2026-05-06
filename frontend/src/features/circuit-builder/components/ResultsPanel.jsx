import { Button } from 'react-bootstrap'
import { calculatePercentage } from '../../multi-run/index'

/**
 * Displays shot results histogram after a multi-run simulation.
 */
export function ResultsPanel({ results, lastExecutedShots, savedCircuitName, circuit, onViewFull }) {
  return (
    <div data-testid="results-panel" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(110,231,208,0.2)', borderRadius: 14, padding: '20px', animation: 'fadeIn 0.5s ease both' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#6EE7D0', textTransform: 'uppercase', marginBottom: 16 }}>
        {'Results · ' + lastExecutedShots + ' shots'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(results)
          .sort((a, b) => b[1] - a[1])
          .map(([state, count]) => {
            const pct = calculatePercentage(count, lastExecutedShots)
            return (
              <div key={state}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: '#6EE7D0' }}>
                    {'|' + state + String.fromCharCode(0x27E9)}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{pct}%</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{count}</span>
                  </div>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, rgba(110,231,208,0.7), rgba(110,231,208,0.35))', borderRadius: 3, animation: 'barGrow 0.6s ease both' }} />
                </div>
              </div>
            )
          })}
      </div>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
          Local sim / api/circuits/run
        </div>
        <Button
          size="sm"
          variant="outline-info"
          onClick={() => onViewFull({ results, shots: lastExecutedShots, circuitName: savedCircuitName || 'Circuit', circuitMatrix: circuit })}
          style={{ fontSize: 10, letterSpacing: '0.05em', padding: '3px 10px' }}
        >
          View Full Results
        </Button>
      </div>
    </div>
  )
}
