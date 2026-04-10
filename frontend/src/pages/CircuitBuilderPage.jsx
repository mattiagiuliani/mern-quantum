import { useState, useCallback } from 'react'

// ─── costanti ────────────────────────────────────────────────────────────────

const NUM_QUBITS = 3
const MAX_STEPS  = 8   // colonne del circuito

const GATES = {
  H: {
    label: 'H',
    name: 'Hadamard',
    desc: 'Mette il qubit in sovrapposizione: né 0 né 1, ma entrambi.',
    color: '#6EE7D0',
    bg: 'rgba(110,231,208,0.12)',
    border: 'rgba(110,231,208,0.5)',
  },
  X: {
    label: 'X',
    name: 'Pauli-X',
    desc: 'Capovolge il qubit: trasforma |0⟩ in |1⟩ e viceversa. È il NOT quantistico.',
    color: '#FCA5A5',
    bg: 'rgba(252,165,165,0.12)',
    border: 'rgba(252,165,165,0.5)',
  },
  M: {
    label: '⊕',
    name: 'Measure',
    desc: 'Misura il qubit: "collassa" la sovrapposizione e restituisce 0 oppure 1.',
    color: '#FCD34D',
    bg: 'rgba(252,211,77,0.12)',
    border: 'rgba(252,211,77,0.5)',
  },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const emptyCircuit = () =>
  Array.from({ length: NUM_QUBITS }, () => Array(MAX_STEPS).fill(null))

// ─── sotto-componenti ─────────────────────────────────────────────────────────

function GateChip({ type, size = 'md', dimmed = false, onClick, dragging = false }) {
  const g = GATES[type]
  const sz = size === 'sm' ? 36 : 42

  return (
    <div
      onClick={onClick}
      style={{
        width: sz, height: sz,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: dimmed ? 'rgba(255,255,255,0.04)' : g.bg,
        border: `1.5px solid ${dimmed ? 'rgba(255,255,255,0.12)' : g.border}`,
        borderRadius: 8,
        fontFamily: "'Space Mono', monospace",
        fontSize: size === 'sm' ? 13 : 15,
        fontWeight: 700,
        color: dimmed ? 'rgba(255,255,255,0.25)' : g.color,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s ease',
        transform: dragging ? 'scale(1.1)' : 'scale(1)',
        boxShadow: dragging ? `0 0 16px ${g.color}44` : 'none',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {g.label}
    </div>
  )
}

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
        background: selected
          ? g.bg
          : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: `1.5px solid ${selected ? g.border : hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12,
        cursor: 'pointer',
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
        fontSize: 18,
        fontWeight: 700,
        color: selected ? g.color : 'rgba(255,255,255,0.5)',
        transition: 'all 0.2s',
        boxShadow: selected ? `0 0 12px ${g.color}33` : 'none',
      }}>
        {g.label}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: selected ? g.color : 'rgba(255,255,255,0.5)',
          letterSpacing: '0.08em',
          marginBottom: 2,
        }}>
          {g.name}
        </div>
      </div>
    </button>
  )
}

function QubitWire({ qubitIndex, steps, selectedGate, onCellClick, onCellClear }) {
  const qubitLabel = `q[${qubitIndex}]`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 64 }}>
      {/* label qubit */}
      <div style={{
        width: 52,
        fontFamily: "'Space Mono', monospace",
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'right',
        paddingRight: 12,
        flexShrink: 0,
      }}>
        {qubitLabel}
      </div>

      {/* filo + celle */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        {/* linea orizzontale */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 1,
          background: 'rgba(255,255,255,0.15)',
        }} />

        {/* celle */}
        <div style={{ display: 'flex', gap: 6, position: 'relative', zIndex: 1 }}>
          {steps.map((gate, stepIdx) => (
            <Cell
              key={stepIdx}
              gate={gate}
              stepIdx={stepIdx}
              selectedGate={selectedGate}
              onClick={() => gate ? onCellClear(qubitIndex, stepIdx) : onCellClick(qubitIndex, stepIdx)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Cell({ gate, stepIdx, selectedGate, onClick }) {
  const [hovered, setHovered] = useState(false)
  const isEmpty = !gate

  const getHoverStyle = () => {
    if (!isEmpty) return {}
    if (!selectedGate) return {}
    const g = GATES[selectedGate]
    return {
      background: g.bg,
      borderColor: g.border,
    }
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isEmpty
          ? hovered && selectedGate
            ? GATES[selectedGate].bg
            : 'rgba(255,255,255,0.03)'
          : 'transparent',
        border: `1.5px solid ${isEmpty
          ? hovered && selectedGate
            ? GATES[selectedGate].border
            : 'rgba(255,255,255,0.08)'
          : 'transparent'}`,
        borderRadius: 8,
        cursor: isEmpty ? (selectedGate ? 'cell' : 'default') : 'pointer',
        transition: 'all 0.15s ease',
        flexShrink: 0,
        ...getHoverStyle(),
      }}
    >
      {gate && (
        <div title="Click per rimuovere">
          <GateChip type={gate} size="sm" />
        </div>
      )}
      {isEmpty && hovered && selectedGate && (
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 16,
          color: GATES[selectedGate].color,
          opacity: 0.5,
        }}>
          {GATES[selectedGate].label}
        </div>
      )}
    </div>
  )
}

function InfoTooltip({ gate }) {
  if (!gate) return (
    <div style={{
      padding: '12px 16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      fontFamily: "'Space Mono', monospace",
      fontSize: 11,
      color: 'rgba(255,255,255,0.25)',
      letterSpacing: '0.05em',
    }}>
      ← seleziona un gate per piazzarlo sul filo
    </div>
  )
  const g = GATES[gate]
  return (
    <div style={{
      padding: '12px 16px',
      background: g.bg,
      border: `1px solid ${g.border}`,
      borderRadius: 10,
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 18, fontWeight: 700,
        color: g.color, flexShrink: 0, marginTop: 2,
      }}>
        {g.label}
      </div>
      <div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11, fontWeight: 700,
          color: g.color, letterSpacing: '0.08em',
          marginBottom: 4,
        }}>
          {g.name}
        </div>
        <div style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
        }}>
          {g.desc}
        </div>
      </div>
    </div>
  )
}

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
      borderRadius: 12,
      padding: '16px 20px',
      fontFamily: "'Space Mono', monospace",
      fontSize: 12,
      lineHeight: 1.8,
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
        if (l.startsWith('qreg') || l.startsWith('creg')) color = '#A78BFA99'
        if (l.startsWith('h ')) color = '#6EE7D0cc'
        if (l.startsWith('x ')) color = '#FCA5A5cc'
        if (l.startsWith('measure')) color = '#FCD34Dcc'
        return <div key={i} style={{ color }}>{l || '\u00A0'}</div>
      })}
    </div>
  )
}

// ─── componente principale ───────────────────────────────────────────────────

export default function CircuitBuilderPage() {
  const [circuit, setCircuit]           = useState(emptyCircuit)
  const [selectedGate, setSelectedGate] = useState(null)
  const [runStatus, setRunStatus]       = useState('idle') // idle | running | done | error
  const [results, setResults]           = useState(null)

  const handleGateSelect = (type) =>
    setSelectedGate(prev => prev === type ? null : type)

  const handleCellClick = useCallback((qubitIdx, stepIdx) => {
    if (!selectedGate) return
    setCircuit(prev => {
      const next = prev.map(row => [...row])
      next[qubitIdx][stepIdx] = selectedGate
      return next
    })
  }, [selectedGate])

  const handleCellClear = useCallback((qubitIdx, stepIdx) => {
    setCircuit(prev => {
      const next = prev.map(row => [...row])
      next[qubitIdx][stepIdx] = null
      return next
    })
  }, [])

  const handleClear = () => {
    setCircuit(emptyCircuit())
    setResults(null)
    setRunStatus('idle')
  }

  const handleRun = async () => {
    const hasGates = circuit.some(row => row.some(g => g !== null))
    if (!hasGates) return

    setRunStatus('running')
    setResults(null)

    // simula round-trip IBM Quantum (in prod: POST /api/circuits/:id/run)
    await new Promise(r => setTimeout(r, 1800))

    // risultati simulati plausibili
    const shots = 1024
    const hasMeasure = circuit.some(row => row.includes('M'))
    const hasH       = circuit.some(row => row.includes('H'))

    let counts = {}
    if (!hasMeasure) {
      counts = { '(no measure)': shots }
    } else if (hasH) {
      // sovrapposizione → distribuzione ~50/50 per ogni qubit misurato
      const keys = ['000', '001', '010', '011', '100', '101', '110', '111']
      let remaining = shots
      keys.forEach((k, i) => {
        const v = i === keys.length - 1 ? remaining : Math.floor(Math.random() * (remaining * 0.35) + remaining * 0.05)
        if (v > 0) counts[k] = v
        remaining -= v
      })
    } else {
      counts = { '000': shots }
    }

    setResults(counts)
    setRunStatus('done')
  }

  const totalGates = circuit.flat().filter(Boolean).length
  const hasGates = totalGates > 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Lora&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, #root { background: #080C14; min-height: 100vh; }

        @keyframes fadeIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes barGrow { from{width:0;} to{width:var(--w);} }
        @keyframes pulse { 0%,100%{opacity:.6;} 50%{opacity:1;} }

        .run-btn { transition: all 0.22s ease; }
        .run-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(110,231,208,0.3);
        }
        .run-btn:not(:disabled):active { transform: translateY(0); }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <div style={{
        background: '#080C14', minHeight: '100vh', color: '#F1EDE4',
        fontFamily: "'Space Mono', monospace",
        padding: '32px 24px',
        display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, margin: '0 auto',
      }}>

        {/* ── header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#6EE7D0', textTransform: 'uppercase', marginBottom: 6 }}>
              IBM Quantum · Circuit Builder
            </div>
            <h1 style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 22, fontWeight: 700, color: '#F1EDE4', letterSpacing: '-0.02em',
            }}>
              Costruisci il tuo circuito
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
            <button onClick={handleClear} style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.35)',
              fontFamily: "'Space Mono', monospace",
              fontSize: 11, letterSpacing: '0.08em',
              padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
            }}
              onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.color = 'rgba(255,255,255,0.6)' }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = 'rgba(255,255,255,0.35)' }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* ── palette gate ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          padding: '20px 24px',
        }}>
          <div style={{
            fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', marginBottom: 16,
          }}>
            Gate palette — seleziona poi clicca su un filo
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
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

        {/* ── canvas circuito ── */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          padding: '24px',
          overflowX: 'auto',
        }}>
          <div style={{
            fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', marginBottom: 20,
          }}>
            Circuito — {NUM_QUBITS} qubit · {MAX_STEPS} step
          </div>

          {/* step indices */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 6, paddingLeft: 52 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: MAX_STEPS }, (_, i) => (
                <div key={i} style={{
                  width: 44, textAlign: 'center',
                  fontSize: 9, color: 'rgba(255,255,255,0.18)',
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: '0.05em',
                }}>
                  t{i}
                </div>
              ))}
            </div>
          </div>

          {/* fili qubit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {circuit.map((row, qi) => (
              <QubitWire
                key={qi}
                qubitIndex={qi}
                steps={row}
                selectedGate={selectedGate}
                onCellClick={handleCellClick}
                onCellClear={handleCellClear}
              />
            ))}
          </div>

          {/* linea terminale */}
          <div style={{
            marginTop: 16, paddingLeft: 52,
            display: 'flex', gap: 6,
          }}>
            {Array.from({ length: MAX_STEPS }, (_, i) => {
              const colHasGate = circuit.some(row => row[i] !== null)
              return (
                <div key={i} style={{
                  width: 44, height: 3, borderRadius: 2,
                  background: colHasGate ? 'rgba(110,231,208,0.25)' : 'rgba(255,255,255,0.04)',
                  transition: 'background 0.3s',
                }} />
              )
            })}
          </div>
        </div>

        {/* ── QASM + Run ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
          <QasmPreview circuit={circuit} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
            <button
              className="run-btn"
              disabled={!hasGates || runStatus === 'running'}
              onClick={handleRun}
              style={{
                background: hasGates && runStatus !== 'running'
                  ? 'transparent' : 'transparent',
                border: `1.5px solid ${hasGates ? '#6EE7D0' : 'rgba(255,255,255,0.1)'}`,
                color: hasGates ? '#6EE7D0' : 'rgba(255,255,255,0.2)',
                fontFamily: "'Space Mono', monospace",
                fontSize: 12, fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '14px 20px',
                borderRadius: 8, cursor: hasGates ? 'pointer' : 'default',
                textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {runStatus === 'running' ? (
                <>
                  <div style={{
                    width: 12, height: 12, border: '2px solid #6EE7D0',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Running…
                </>
              ) : (
                <>▶ Esegui</>
              )}
            </button>

            {runStatus === 'done' && (
              <div style={{
                fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#6EE7D0', textAlign: 'center', animation: 'pulse 2s ease-in-out infinite',
              }}>
                ✓ completato
              </div>
            )}
          </div>
        </div>

        {/* ── risultati ── */}
        {results && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(110,231,208,0.2)',
            borderRadius: 14,
            padding: '24px',
            animation: 'fadeIn 0.5s ease both',
          }}>
            <div style={{
              fontSize: 10, letterSpacing: '0.15em', color: '#6EE7D0',
              textTransform: 'uppercase', marginBottom: 20,
            }}>
              Risultati — 1024 shots
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(results)
                .sort((a, b) => b[1] - a[1])
                .map(([state, count]) => {
                  const pct = (count / 1024 * 100).toFixed(1)
                  return (
                    <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 13, fontWeight: 700,
                        color: '#6EE7D0', width: 48, flexShrink: 0,
                      }}>
                        |{state}⟩
                      </div>
                      <div style={{ flex: 1, height: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, rgba(110,231,208,0.6), rgba(110,231,208,0.3))',
                          borderRadius: 4,
                          animation: 'barGrow 0.6s ease both',
                          '--w': `${pct}%`,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                      <div style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 11, color: 'rgba(255,255,255,0.4)',
                        width: 52, textAlign: 'right', flexShrink: 0,
                      }}>
                        {pct}%
                      </div>
                      <div style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 11, color: 'rgba(255,255,255,0.25)',
                        width: 44, textAlign: 'right', flexShrink: 0,
                      }}>
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
              Simulazione locale · in produzione: IBM Quantum ibmq_qasm_simulator
            </div>
          </div>
        )}

      </div>
    </>
  )
}