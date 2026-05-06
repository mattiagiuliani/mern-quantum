import { qubitDisplay } from '../circuitBuilder.utils'

export function LiveStatePanel({ liveState, measurementLog }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* qubit state indicators */}
      <div>
        <div style={{
          fontSize: 10, letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase', marginBottom: 14,
          fontFamily: "'Space Mono', monospace",
        }}>
          Qubit snapshot
        </div>
        <div style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 12,
          color: 'rgba(255,255,255,0.45)',
          marginBottom: 12,
        }}>
          Live view of each qubit after your latest action.{' '}
          <span style={{ color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
            Uses a simplified qubit model for instant feedback — run the simulation for statistically accurate results.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {liveState.map((q, i) => {
            const { label, color, bg } = qubitDisplay(q)

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 52, height: 52,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: bg,
                  border: `1.5px solid ${color}`,
                  borderRadius: 10,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 13, fontWeight: 700,
                  color,
                  transition: 'all 0.35s ease',
                  animation: q.superposition ? 'superPulse 2s ease-in-out infinite' : 'none',
                  boxShadow: q.superposition ? `0 0 12px ${color}55` : 'none',
                }}>
                  {label}
                </div>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9, color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.05em',
                }}>
                  q[{i}]
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* measurement log */}
      {measurementLog.length > 0 && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <div>
            <div style={{
              fontSize: 10, letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase', marginBottom: 14,
              fontFamily: "'Space Mono', monospace",
            }}>
              Recent measurements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {measurementLog.map((m, i) => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  animation: i === 0 ? 'fadeIn 0.25s ease both' : 'none',
                  opacity: Math.max(0.2, 1 - i * 0.22),
                }}>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11, color: 'rgba(255,255,255,0.35)',
                  }}>q[{m.qubit}]</span>
                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>{'→'}</span>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 15, fontWeight: 700,
                    color: m.value === 1 ? '#6EE7D0' : 'rgba(255,255,255,0.45)',
                    animation: i === 0 ? 'measureFlash 0.4s ease both' : 'none',
                  }}>
                    {m.value}
                  </span>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: m.value === 1 ? '#6EE7D055' : 'rgba(255,255,255,0.15)',
                  }}>{`|${m.value}\u27e9`}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
