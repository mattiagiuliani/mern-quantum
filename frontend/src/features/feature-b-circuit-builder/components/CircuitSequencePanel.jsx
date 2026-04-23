import { useState, useRef, useEffect } from 'react'
import { GATES } from '../circuitBuilder.constants'

export function CircuitSequencePanel({
  gateSequence,
  selectedOperationId,
  lastAddedOperationId,
  onSelectOperation,
}) {
  const [expanded, setExpanded] = useState(true)
  const timelineScrollRef = useRef(null)

  useEffect(() => {
    if (!lastAddedOperationId || !expanded) return
    const container = timelineScrollRef.current
    if (!container) return

    const targetNode = Array.from(container.querySelectorAll('[data-op-id]'))
      .find((el) => el.dataset.opId === lastAddedOperationId)

    if (targetNode) {
      const targetLeft = Math.max(
        0,
        targetNode.offsetLeft - (container.clientWidth / 2) + (targetNode.clientWidth / 2)
      )
      const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth)
      container.scrollTo({ left: Math.min(targetLeft, maxLeft), behavior: 'smooth' })
    }
  }, [lastAddedOperationId, gateSequence.length, expanded])

  const opsCount = gateSequence.length

  const header = (
    <div
      className="builder-collapsible-header"
      onClick={() => setExpanded(e => !e)}
      style={{ marginBottom: expanded && opsCount > 0 ? 12 : 0 }}
    >
      <div style={{
        fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)',
        textTransform: 'uppercase',
        fontFamily: "'Space Mono', monospace",
      }}>
        Build timeline{opsCount > 0 ? ` · ${opsCount} steps` : ''}
      </div>
      <span
        className="builder-chevron"
        style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
      >
        ▾
      </span>
    </div>
  )

  if (opsCount === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '18px 22px',
      }}>
        {header}
        {expanded && (
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.05em',
          }}>
            No gates yet. Pick a gate and click a cell to add your first step.
          </div>
        )}
      </div>
    )
  }

  const groupedByStep = gateSequence.reduce((acc, op) => {
    if (!acc[op.step]) acc[op.step] = []
    acc[op.step].push(op)
    return acc
  }, {})
  const steps = Object.keys(groupedByStep).map(Number).sort((a, b) => a - b)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '18px 22px',
    }}>
      {header}

      {expanded && (
        <>
          {/* step summary pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {steps.map((step) => (
              <div
                key={`step-${step}`}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.55)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 999,
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                t{step} · {groupedByStep[step].length} gate{groupedByStep[step].length !== 1 ? 's' : ''}
              </div>
            ))}
          </div>

          {/* scrollable timeline */}
          <div style={{ overflowX: 'auto', paddingBottom: 6 }} ref={timelineScrollRef}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0,
              minWidth: 'max-content',
              padding: '6px 2px',
            }}>
              {gateSequence.map((op, idx) => {
                const gateMeta = GATES[op.gate]
                const isLast       = idx === gateSequence.length - 1
                const isNewlyAdded = op.id === lastAddedOperationId
                const isSelected   = op.id === selectedOperationId

                return (
                  <div key={op.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <div
                      onClick={() => onSelectOperation(op)}
                      data-op-id={op.id}
                      style={{
                        minWidth: 108,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                      title={`${gateMeta.name} on q[${op.qubit}] at t${op.step}`}
                    >
                      <div style={{
                        width: 18, height: 18,
                        borderRadius: '50%',
                        border: `1.5px solid ${gateMeta.border}`,
                        background: gateMeta.bg,
                        color: gateMeta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 10, fontWeight: 700,
                        boxShadow: isNewlyAdded ? `0 0 16px ${gateMeta.color}88` : 'none',
                      }}>
                        {op.gate}
                      </div>

                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        padding: '6px 8px', borderRadius: 8,
                        border: `1px solid ${gateMeta.border}`,
                        background: gateMeta.bg,
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 10, letterSpacing: '0.03em',
                        boxShadow: isSelected
                          ? '0 0 0 2px rgba(110,231,208,0.45), 0 0 16px rgba(110,231,208,0.2)'
                          : isNewlyAdded
                            ? `0 0 0 1px ${gateMeta.color}88, 0 0 14px ${gateMeta.color}44`
                            : 'none',
                        transform: isSelected ? 'translateY(-1px)' : 'translateY(0)',
                        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                      }}>
                        <span style={{ color: 'rgba(255,255,255,0.45)' }}>#{idx + 1}</span>
                        <span style={{ color: gateMeta.color, fontWeight: 700 }}>{gateMeta.name}</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>q[{op.qubit}] · t{op.step}</span>
                      </div>
                    </div>

                    {!isLast && (
                      <div style={{
                        width: 34, height: 1, margin: '0 6px',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))',
                        position: 'relative',
                      }}>
                        <span style={{
                          position: 'absolute', right: -2, top: -4,
                          color: 'rgba(255,255,255,0.25)', fontSize: 9,
                        }}>
                          ▶
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
