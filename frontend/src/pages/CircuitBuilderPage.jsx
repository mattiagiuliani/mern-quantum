import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { applyGate as apiApplyGate } from '../api/apiClient'
import {
  SHOT_PRESETS,
  calculatePercentage,
  useFeatureAMultiRun,
} from '../features/feature-a-multi-run/feature-a-multi-run'

// ─── constants ────────────────────────────────────────────────────────────────

const NUM_QUBITS = 3
const MAX_STEPS  = 8

const GATES = {
  H: {
    label: 'H',
    name: 'Hadamard',
    desc: 'Creates/removes superposition (simplified model).',
    color: '#6EE7D0',
    bg: 'rgba(110,231,208,0.12)',
    border: 'rgba(110,231,208,0.5)',
  },
  X: {
    label: 'X',
    name: 'Pauli-X',
    desc: 'Classical NOT behavior: flips |0⟩↔|1⟩.',
    color: '#FCA5A5',
    bg: 'rgba(252,165,165,0.12)',
    border: 'rgba(252,165,165,0.5)',
  },
  M: {
    label: '⊕',
    name: 'Measure',
    desc: 'Collapses superposition and returns 0 or 1.',
    color: '#FCD34D',
    bg: 'rgba(252,211,77,0.12)',
    border: 'rgba(252,211,77,0.5)',
  },
}

const emptyCircuit     = () => Array.from({ length: NUM_QUBITS }, () => Array(MAX_STEPS).fill(null))
const initialLiveState = () => Array.from({ length: NUM_QUBITS }, () => ({ value: 0, superposition: false }))

const isValidGate = (gate) => gate === null || gate === 'H' || gate === 'X' || gate === 'M'

function normalizeTemplateCircuit(circuit) {
  const next = emptyCircuit()

  for (let qubit = 0; qubit < Math.min(NUM_QUBITS, circuit?.length ?? 0); qubit++) {
    const row = circuit[qubit]
    if (!Array.isArray(row)) continue

    for (let step = 0; step < Math.min(MAX_STEPS, row.length); step++) {
      const gate = row[step]
      if (isValidGate(gate)) {
        next[qubit][step] = gate
      }
    }
  }

  return next
}

function buildGateSequenceFromCircuit(circuit) {
  const operations = []
  let opCounter = 0

  for (let step = 0; step < MAX_STEPS; step++) {
    for (let qubit = 0; qubit < NUM_QUBITS; qubit++) {
      const gate = circuit[qubit][step]
      if (!gate) continue

      operations.push({
        id: `tpl-${Date.now()}-${opCounter++}-${qubit}-${step}`,
        gate,
        qubit,
        step,
      })
    }
  }

  return operations
}

const qubitDisplay = (q) => ({
  label: q.superposition ? '|ψ⟩' : q.value === 1 ? '|1⟩' : '|0⟩',
  color: q.superposition ? '#A78BFA' : q.value === 1 ? '#6EE7D0' : 'rgba(255,255,255,0.25)',
  bg:    q.superposition ? 'rgba(167,139,250,0.1)' : q.value === 1 ? 'rgba(110,231,208,0.1)' : 'rgba(255,255,255,0.03)',
})

const BUILDER_BUTTON_STYLE_TOKENS = {
  headerBase: {
    background: 'transparent',
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.08em',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
  },
  headerTemplates: {
    border: '1px solid rgba(110,231,208,0.24)',
    color: 'rgba(110,231,208,0.85)',
    padding: '8px 12px',
  },
  headerReset: {
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.35)',
    padding: '8px 16px',
  },
  shotsPresetBase: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.06em',
    padding: '6px 8px',
    borderRadius: 6,
    minWidth: 46,
  },
  runButtonBase: {
    background: 'transparent',
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '14px 20px',
    borderRadius: 8,
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
}

const buildShotPresetStyle = (isActive, isRunning) => ({
  ...BUILDER_BUTTON_STYLE_TOKENS.shotsPresetBase,
  background: isActive ? 'rgba(110,231,208,0.12)' : 'transparent',
  border: `1px solid ${isActive ? 'rgba(110,231,208,0.45)' : 'rgba(255,255,255,0.15)'}`,
  color: isActive ? '#6EE7D0' : 'rgba(255,255,255,0.45)',
  cursor: isRunning ? 'default' : 'pointer',
})

const buildRunButtonStyle = (hasGates) => ({
  ...BUILDER_BUTTON_STYLE_TOKENS.runButtonBase,
  border: `1.5px solid ${hasGates ? '#6EE7D0' : 'rgba(255,255,255,0.1)'}`,
  color: hasGates ? '#6EE7D0' : 'rgba(255,255,255,0.2)',
  cursor: hasGates ? 'pointer' : 'default',
})

// ─── GateChip ─────────────────────────────────────────────────────────────────

function GateChip({ type, size = 'md', onClick, isNew = false }) {
  const g  = GATES[type]
  const sz = size === 'sm' ? 36 : 42

  return (
    <div
      onClick={onClick}
      style={{
        width: sz, height: sz,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: g.bg,
        border: `1.5px solid ${g.border}`,
        borderRadius: 8,
        fontFamily: "'Space Mono', monospace",
        fontSize: size === 'sm' ? 13 : 15,
        fontWeight: 700,
        color: g.color,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        flexShrink: 0,
        animation: isNew ? 'gateInsert 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none',
        boxShadow: isNew ? `0 0 18px ${g.color}55` : 'none',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {g.label}
    </div>
  )
}

// ─── GatePaletteButton ───────────────────────────────────────────────────────

function GatePaletteButton({ type, selected, onClick }) {
  const g = GATES[type]
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={() => onClick(type)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '14px 18px',
        background: selected ? g.bg : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: `1.5px solid ${selected ? g.border : hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12, cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hovered || selected ? 'translateY(-2px)' : 'translateY(0)',
        minWidth: 80,
      }}
    >
      <div style={{
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: selected ? g.bg : 'rgba(255,255,255,0.05)',
        border: `1.5px solid ${selected ? g.border : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 10,
        fontFamily: "'Space Mono', monospace",
        fontSize: 18, fontWeight: 700,
        color: selected ? g.color : 'rgba(255,255,255,0.5)',
        transition: 'all 0.2s',
        boxShadow: selected ? `0 0 12px ${g.color}33` : 'none',
      }}>
        {g.label}
      </div>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 10, fontWeight: 700,
        color: selected ? g.color : 'rgba(255,255,255,0.5)',
        letterSpacing: '0.08em',
      }}>
        {g.name}
      </div>
    </button>
  )
}

// ─── Cell ─────────────────────────────────────────────────────────────────────

function Cell({ gate, selectedGate, onClick, isNew = false, isFocused = false }) {
  const [hovered, setHovered] = useState(false)
  const isEmpty = !gate

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isEmpty
          ? hovered && selectedGate ? GATES[selectedGate].bg : 'rgba(255,255,255,0.03)'
          : 'transparent',
        border: `1.5px solid ${isEmpty
          ? hovered && selectedGate ? GATES[selectedGate].border : 'rgba(255,255,255,0.08)'
          : 'transparent'}`,
        borderRadius: 8,
        cursor: isEmpty ? (selectedGate ? 'cell' : 'default') : 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        flexShrink: 0,
        boxShadow: isFocused ? '0 0 0 2px rgba(110,231,208,0.55), 0 0 16px rgba(110,231,208,0.25)' : 'none',
      }}
    >
      {gate && (
        <div title="Click to remove">
          <GateChip type={gate} size="sm" isNew={isNew} />
        </div>
      )}
      {isEmpty && hovered && selectedGate && (
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 16,
          color: GATES[selectedGate].color,
          opacity: 0.45,
          pointerEvents: 'none',
        }}>
          {GATES[selectedGate].label}
        </div>
      )}
    </div>
  )
}

// ─── QubitWire ────────────────────────────────────────────────────────────────

function QubitWire({ qubitIndex, steps, selectedGate, onCellClick, onCellClear, animatingCells, liveQ, focusedCell }) {
  const { label: stateLabel, color: stateColor } = qubitDisplay(liveQ)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 64 }}>
      {/* qubit label + live state badge */}
      <div style={{
        width: 80, flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        paddingRight: 12, gap: 2,
      }}>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.02em',
        }}>
          q[{qubitIndex}]
        </span>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10, fontWeight: 700,
          color: stateColor,
          transition: 'color 0.3s ease',
          animation: liveQ.superposition ? 'superPulse 2s ease-in-out infinite' : 'none',
          letterSpacing: '0.04em',
        }}>
          {stateLabel}
        </span>
      </div>

      {/* wire + cells */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, ${stateColor}60, ${stateColor}20)`,
          transition: 'background 0.4s ease',
        }} />
        <div style={{ display: 'flex', gap: 6, position: 'relative', zIndex: 1 }}>
          {steps.map((gate, stepIdx) => (
            <Cell
              key={stepIdx}
              gate={gate}
              selectedGate={selectedGate}
              isNew={animatingCells.has(`${qubitIndex}-${stepIdx}`)}
              isFocused={focusedCell?.qubit === qubitIndex && focusedCell?.step === stepIdx}
              onClick={() => gate
                ? onCellClear(qubitIndex, stepIdx)
                : onCellClick(qubitIndex, stepIdx)
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── InfoTooltip ─────────────────────────────────────────────────────────────

function InfoTooltip({ gate }) {
  if (!gate) return (
    <div style={{
      padding: '10px 14px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      fontFamily: "'Space Mono', monospace",
      fontSize: 11,
      color: 'rgba(255,255,255,0.25)',
      letterSpacing: '0.05em',
    }}>
      ← select a gate, then click a wire
    </div>
  )
  const g = GATES[gate]
  return (
    <div style={{
      padding: '10px 14px',
      background: g.bg, border: `1px solid ${g.border}`,
      borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center',
    }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: g.color }}>{g.label}</span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: g.color, letterSpacing: '0.08em' }}>{g.name}</span>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>·</span>
      <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{g.desc}</span>
    </div>
  )
}

// ─── LiveStatePanel ───────────────────────────────────────────────────────────

function LiveStatePanel({ liveState, measurementLog }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '20px 24px',
      display: 'flex',
      gap: 32,
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    }}>

      {/* qubit state indicators */}
      <div>
        <div style={{
          fontSize: 10, letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase', marginBottom: 14,
          fontFamily: "'Space Mono', monospace",
        }}>
          Live state
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
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

      {/* divider */}
      {measurementLog.length > 0 && (
        <div style={{ width: 1, background: 'rgba(255,255,255,0.07)', alignSelf: 'stretch' }} />
      )}

      {/* measurement log */}
      {measurementLog.length > 0 && (
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{
            fontSize: 10, letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', marginBottom: 14,
            fontFamily: "'Space Mono', monospace",
          }}>
            Measurements
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
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>→</span>
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
                }}>|{m.value}⟩</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── QasmPreview ──────────────────────────────────────────────────────────────

function QasmPreview({ circuit }) {
  const lines = ['OPENQASM 2.0;', 'include "qelib1.inc";', `qreg q[${NUM_QUBITS}];`, `creg c[${NUM_QUBITS}];`, '']

  for (let step = 0; step < MAX_STEPS; step++) {
    for (let q = 0; q < NUM_QUBITS; q++) {
      const gate = circuit[q][step]
      if (gate === 'H') lines.push(`h q[${q}];`)
      if (gate === 'X') lines.push(`x q[${q}];`)
      if (gate === 'M') lines.push(`measure q[${q}] -> c[${q}];`)
    }
  }

  const hasGates = circuit.some(row => row.some(g => g !== null))

  return (
    <div style={{
      background: '#0A0F1A',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '16px 20px',
      fontFamily: "'Space Mono', monospace",
      fontSize: 12, lineHeight: 1.8,
      color: hasGates ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)',
    }}>
      <div style={{
        fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.25)', marginBottom: 10,
      }}>
        OpenQASM 2.0 preview
      </div>
      {lines.map((l, i) => {
        let color = 'rgba(255,255,255,0.45)'
        if (l.startsWith('OPENQASM') || l.startsWith('include')) color = 'rgba(255,255,255,0.2)'
        if (l.startsWith('qreg') || l.startsWith('creg'))        color = '#A78BFA99'
        if (l.startsWith('h '))                                   color = '#6EE7D0cc'
        if (l.startsWith('x '))                                   color = '#FCA5A5cc'
        if (l.startsWith('measure'))                              color = '#FCD34Dcc'
        return <div key={i} style={{ color }}>{l || '\u00A0'}</div>
      })}
    </div>
  )
}

// ─── CircuitSequencePanel ────────────────────────────────────────────────────

function CircuitSequencePanel({
  gateSequence,
  selectedOperationId,
  lastAddedOperationId,
  onSelectOperation,
}) {
  const timelineScrollRef = useRef(null)

  useEffect(() => {
    if (!lastAddedOperationId) return
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

      container.scrollTo({
        left: Math.min(targetLeft, maxLeft),
        behavior: 'smooth',
      })
    }
  }, [lastAddedOperationId, gateSequence.length])

  if (gateSequence.length === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        padding: '18px 22px',
      }}>
        <div style={{
          fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase', marginBottom: 10,
        }}>
          Circuit sequence
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.05em',
        }}>
          No gates added.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '18px 22px',
    }}>
      <div style={{
        fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)',
        textTransform: 'uppercase', marginBottom: 12,
      }}>
        Circuit sequence (timeline)
      </div>

      {(() => {
        const groupedByStep = gateSequence.reduce((acc, op) => {
          if (!acc[op.step]) acc[op.step] = []
          acc[op.step].push(op)
          return acc
        }, {})
        const steps = Object.keys(groupedByStep).map(Number).sort((a, b) => a - b)

        return (
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}>
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
                t{step} · {groupedByStep[step].length}
              </div>
            ))}
          </div>
        )
      })()}

      <div style={{
        overflowX: 'auto',
        paddingBottom: 6,
      }} ref={timelineScrollRef}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0,
          minWidth: 'max-content',
          padding: '6px 2px',
        }}>
          {gateSequence.map((op, idx) => {
            const gateMeta = GATES[op.gate]
            const isLast = idx === gateSequence.length - 1
            const isNewlyAdded = op.id === lastAddedOperationId
            const isSelected = op.id === selectedOperationId

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
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `1.5px solid ${gateMeta.border}`,
                    background: gateMeta.bg,
                    color: gateMeta.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    boxShadow: isNewlyAdded ? `0 0 16px ${gateMeta.color}88` : 'none',
                  }}>
                    {op.gate}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: `1px solid ${gateMeta.border}`,
                    background: gateMeta.bg,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.03em',
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
                    width: 34,
                    height: 1,
                    margin: '0 6px',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))',
                    position: 'relative',
                  }}>
                    <span style={{
                      position: 'absolute',
                      right: -2,
                      top: -4,
                      color: 'rgba(255,255,255,0.25)',
                      fontSize: 9,
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
    </div>
  )
}

// ─── CircuitBuilderPage ───────────────────────────────────────────────────────

export default function CircuitBuilderPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [circuit,        setCircuit]        = useState(emptyCircuit)
  const [gateSequence,   setGateSequence]   = useState([])
  const [selectedGate,   setSelectedGate]   = useState(null)
  const [focusedCell,    setFocusedCell]    = useState(null)
  const [selectedOpId,   setSelectedOpId]   = useState(null)
  const [lastAddedOpId,  setLastAddedOpId]  = useState(null)
  const [liveState,      setLiveState]      = useState(initialLiveState)
  const [animatingCells, setAnimatingCells] = useState(() => new Set())
  const [measurementLog, setMeasurementLog] = useState([])
  const {
    selectedShots,
    setSelectedShots,
    lastExecutedShots,
    runStatus,
    results,
    runCircuitWithSelectedShots,
    resetMultiRun,
  } = useFeatureAMultiRun()

  const liveStateRef  = useRef(liveState)
  const measureIdRef  = useRef(0)
  const appliedTemplateRef = useRef(null)
  useEffect(() => { liveStateRef.current = liveState }, [liveState])

  const applyTemplateCircuit = useCallback((incomingCircuit) => {
    const normalizedCircuit = normalizeTemplateCircuit(incomingCircuit)

    setCircuit(normalizedCircuit)
    setGateSequence(buildGateSequenceFromCircuit(normalizedCircuit))
    setSelectedGate(null)
    setFocusedCell(null)
    setSelectedOpId(null)
    setLastAddedOpId(null)
    setLiveState(initialLiveState())
    setMeasurementLog([])
    resetMultiRun()
  }, [resetMultiRun])

  useEffect(() => {
    const template = location.state?.templateToApply
    if (!template?.circuit) return

    const templateKey = template._id ?? template.id ?? JSON.stringify(template.circuit)
    if (appliedTemplateRef.current === templateKey) return

    const hasCurrentCircuit = circuit.some(row => row.some(gate => gate !== null))
    const confirmed = !hasCurrentCircuit || window.confirm('Replace current circuit with selected template? Unsaved edits will be lost.')

    if (confirmed) {
      queueMicrotask(() => {
        applyTemplateCircuit(template.circuit)
      })
    }

    appliedTemplateRef.current = templateKey
    navigate('/circuit-builder', { replace: true, state: null })
  }, [applyTemplateCircuit, circuit, location.state, navigate])

  const handleGateSelect = (type) =>
    setSelectedGate(prev => prev === type ? null : type)

  const handleCellClick = useCallback(async (qubitIdx, stepIdx) => {
    if (!selectedGate) return

    setCircuit(prev => {
      const next = prev.map(row => [...row])
      next[qubitIdx][stepIdx] = selectedGate
      return next
    })

    // Save insertion order to drive the operation timeline.
    const opId = `${Date.now()}-${Math.random().toString(16).slice(2)}-${qubitIdx}-${stepIdx}-${selectedGate}`
    setGateSequence(prev => [
      ...prev,
      {
        id: opId,
        gate: selectedGate,
        qubit: qubitIdx,
        step: stepIdx,
      },
    ])
    setLastAddedOpId(opId)
    setSelectedOpId(opId)
    setFocusedCell({ qubit: qubitIdx, step: stepIdx })

    const key = `${qubitIdx}-${stepIdx}`
    setAnimatingCells(prev => new Set(prev).add(key))
    setTimeout(() => setAnimatingCells(prev => {
      const s = new Set(prev); s.delete(key); return s
    }), 400)

    try {
      const { qubitStates, measurement } = await apiApplyGate(liveStateRef.current, selectedGate, qubitIdx)
      setLiveState(qubitStates)
      if (measurement !== null) {
        setMeasurementLog(prev => [
          { qubit: qubitIdx, value: measurement, id: ++measureIdRef.current },
          ...prev.slice(0, 4),
        ])
      }
    } catch (err) {
      console.error('[applyGate]', err)
    }
  }, [selectedGate])

  const handleCellClear = useCallback((qubitIdx, stepIdx) => {
    let removedGate = null

    setCircuit(prev => {
      const next = prev.map(row => [...row])
      removedGate = next[qubitIdx][stepIdx]
      next[qubitIdx][stepIdx] = null
      return next
    })

    if (removedGate) {
      // Remove the latest matching operation for the cleared cell.
      setGateSequence(prev => {
        const idx = prev.map(op => op.gate === removedGate && op.qubit === qubitIdx && op.step === stepIdx).lastIndexOf(true)
        if (idx < 0) return prev
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
      })
    }

    setFocusedCell({ qubit: qubitIdx, step: stepIdx })
    setSelectedOpId(null)

    setLiveState(initialLiveState())
    setMeasurementLog([])
  }, [])

  const handleClear = () => {
    setCircuit(emptyCircuit())
    setGateSequence([])
    setFocusedCell(null)
    setSelectedOpId(null)
    setLastAddedOpId(null)
    setLiveState(initialLiveState())
    setMeasurementLog([])
    resetMultiRun()
  }

  const handleSelectOperation = (op) => {
    setSelectedOpId(op.id)
    setFocusedCell({ qubit: op.qubit, step: op.step })
  }

  const handleRun = async () => {
    await runCircuitWithSelectedShots(circuit)
  }

  const openTemplatesLibrary = () => {
    navigate('/templates', {
      state: {
        circuitDraft: circuit.map((row) => [...row]),
      },
    })
  }

  const totalGates = circuit.flat().filter(Boolean).length
  const hasGates   = totalGates > 0

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Lora&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body, #root { background: #080C14; min-height: 100vh; }

        /* gate push-in on insert */
        @keyframes gateInsert {
          0%   { opacity: 0; transform: scale(0.45) translateY(-10px); }
          70%  { opacity: 1; transform: scale(1.08) translateY(2px); }
          100% { opacity: 1; transform: scale(1)    translateY(0); }
        }

        /* superposition shimmer */
        @keyframes superPulse {
          0%, 100% { opacity: 0.65; }
          50%       { opacity: 1; }
        }

        /* measurement flash */
        @keyframes measureFlash {
          0%   { transform: scale(1.4); opacity: 0.5; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }

        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to   { transform:rotate(360deg); } }
        @keyframes barGrow { from { width:0; } to { width:var(--w); } }
        @keyframes pulse   { 0%,100%{opacity:.6;} 50%{opacity:1;} }

        .run-btn { transition: all 0.22s ease; }
        .run-btn:not(:disabled):hover  { transform:translateY(-1px); box-shadow:0 0 20px rgba(110,231,208,0.3); }
        .run-btn:not(:disabled):active { transform:translateY(0); }

        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
      `}</style>

      <div style={{
        background: '#080C14', minHeight: '100vh', color: '#F1EDE4',
        fontFamily: "'Space Mono', monospace",
        padding: '32px 24px',
        display: 'flex', flexDirection: 'column', gap: 20,
        maxWidth: 980, margin: '0 auto',
      }}>

        {/* ── header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#6EE7D0', textTransform: 'uppercase', marginBottom: 6 }}>
              mern-quantum · Circuit Builder
            </div>
            <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: '#F1EDE4', letterSpacing: '-0.02em' }}>
              Build Your Circuit
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {hasGates && (
              <div style={{
                fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase', padding: '6px 12px',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
              }}>
                {totalGates} gate{totalGates !== 1 ? 's' : ''}
              </div>
            )}
            {gateSequence.length > 0 && (
              <div style={{
                fontSize: 10, letterSpacing: '0.1em', color: 'rgba(110,231,208,0.7)',
                textTransform: 'uppercase', padding: '6px 12px',
                border: '1px solid rgba(110,231,208,0.25)', borderRadius: 6,
              }}>
                {gateSequence.length} {gateSequence.length === 1 ? 'operation' : 'operations'}
              </div>
            )}
            <Button
              onClick={openTemplatesLibrary}
              variant="outline-info"
              style={{
                ...BUILDER_BUTTON_STYLE_TOKENS.headerBase,
                ...BUILDER_BUTTON_STYLE_TOKENS.headerTemplates,
              }}
            >
              Templates
            </Button>
            <Button
              onClick={handleClear}
              variant="outline-secondary"
              style={{
                ...BUILDER_BUTTON_STYLE_TOKENS.headerBase,
                ...BUILDER_BUTTON_STYLE_TOKENS.headerReset,
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* ── gate palette ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '18px 22px',
        }}>
          <div style={{
            fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', marginBottom: 14,
          }}>
            Gate palette - select, then click a wire
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {Object.keys(GATES).map(type => (
              <GatePaletteButton
                key={type}
                type={type}
                selected={selectedGate === type}
                onClick={handleGateSelect}
              />
            ))}
          </div>
          <InfoTooltip gate={selectedGate} />
        </div>

        {/* ── circuit canvas ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '22px 24px',
          overflowX: 'auto',
        }}>
          <div style={{
            fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', marginBottom: 18,
          }}>
            Circuit - {NUM_QUBITS} qubits · {MAX_STEPS} steps
          </div>

          {/* step indices */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, paddingLeft: 80 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: MAX_STEPS }, (_, i) => (
                <div key={i} style={{
                  width: 44, textAlign: 'center',
                  fontSize: 9, color: 'rgba(255,255,255,0.18)',
                  letterSpacing: '0.05em',
                }}>
                  t{i}
                </div>
              ))}
            </div>
          </div>

          {/* qubit wires */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {circuit.map((row, qi) => (
              <QubitWire
                key={qi}
                qubitIndex={qi}
                steps={row}
                selectedGate={selectedGate}
                onCellClick={handleCellClick}
                onCellClear={handleCellClear}
                animatingCells={animatingCells}
                liveQ={liveState[qi]}
                focusedCell={focusedCell}
              />
            ))}
          </div>

          {/* step activity bar */}
          <div style={{ marginTop: 14, paddingLeft: 80, display: 'flex', gap: 6 }}>
            {Array.from({ length: MAX_STEPS }, (_, i) => {
              const active = circuit.some(row => row[i] !== null)
              return (
                <div key={i} style={{
                  width: 44, height: 3, borderRadius: 2,
                  background: active ? 'rgba(110,231,208,0.3)' : 'rgba(255,255,255,0.04)',
                  transition: 'background 0.3s',
                }} />
              )
            })}
          </div>
        </div>

        {/* ── live state panel ── */}
        <LiveStatePanel liveState={liveState} measurementLog={measurementLog} />

        {/* ── circuit sequence panel ── */}
        <CircuitSequencePanel
          gateSequence={gateSequence}
          selectedOperationId={selectedOpId}
          lastAddedOperationId={lastAddedOpId}
          onSelectOperation={handleSelectOperation}
        />

        {/* ── QASM + Run ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
          <QasmPreview circuit={circuit} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                fontSize: 9,
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}>
                Shots
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {SHOT_PRESETS.map((preset) => {
                  const isActive = selectedShots === preset
                  return (
                    <Button
                      key={preset}
                      disabled={runStatus === 'running'}
                      onClick={() => setSelectedShots(preset)}
                      variant={isActive ? 'outline-info' : 'outline-secondary'}
                      style={buildShotPresetStyle(isActive, runStatus === 'running')}
                    >
                      {preset}
                    </Button>
                  )
                })}
              </div>
            </div>

            <Button
              className="run-btn"
              disabled={!hasGates || runStatus === 'running'}
              onClick={handleRun}
              variant="outline-info"
              style={buildRunButtonStyle(hasGates)}
            >
              {runStatus === 'running' ? (
                <>
                  <Spinner size="sm" animation="border" />
                  Running…
                </>
              ) : `▶ Run ${selectedShots}×`}
            </Button>

            {runStatus === 'done' && (
              <div style={{
                fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#6EE7D0', textAlign: 'center', animation: 'pulse 2s ease-in-out infinite',
              }}>
                ✓ completed
              </div>
            )}
            {runStatus === 'error' && (
              <div style={{
                fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#FCA5A5', textAlign: 'center',
              }}>
                ✕ error
              </div>
            )}
          </div>
        </div>

        {/* ── shot results ── */}
        {results && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(110,231,208,0.2)',
            borderRadius: 14, padding: '24px',
            animation: 'fadeIn 0.5s ease both',
          }}>
            <div style={{
              fontSize: 10, letterSpacing: '0.15em', color: '#6EE7D0',
              textTransform: 'uppercase', marginBottom: 20,
            }}>
              Results - {lastExecutedShots} shots
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(results)
                .sort((a, b) => b[1] - a[1])
                .map(([state, count]) => {
                  const pct = calculatePercentage(count, lastExecutedShots)
                  return (
                    <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 13, fontWeight: 700, color: '#6EE7D0', width: 52, flexShrink: 0,
                      }}>
                        |{state}⟩
                      </div>
                      <div style={{ flex: 1, height: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: 'linear-gradient(90deg, rgba(110,231,208,0.6), rgba(110,231,208,0.3))',
                          borderRadius: 4,
                          animation: 'barGrow 0.6s ease both',
                          '--w': `${pct}%`,
                        }} />
                      </div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 52, textAlign: 'right', flexShrink: 0 }}>
                        {pct}%
                      </div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.25)', width: 44, textAlign: 'right', flexShrink: 0 }}>
                        {count}
                      </div>
                    </div>
                  )
                })}
            </div>
            <div style={{
              marginTop: 16, paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              fontSize: 10, letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
            }}>
              Local simulation - backend: /api/circuits/run
            </div>
          </div>
        )}

      </div>
    </>
  )
}
