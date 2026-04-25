import { useState } from 'react'
import { NUM_QUBITS, MAX_STEPS } from '../circuitBuilder.constants'

export function QasmPreview({ circuit }) {
  const [expanded, setExpanded] = useState(false)

  const lines = ['OPENQASM 2.0;', 'include "qelib1.inc";', `qreg q[${NUM_QUBITS}];`, `creg c[${NUM_QUBITS}];`, '']

  for (let step = 0; step < MAX_STEPS; step++) {
    for (let q = 0; q < NUM_QUBITS; q++) {
      const gate = circuit[q][step]
      if (!gate) continue

      if (typeof gate === 'object' && gate.gate === 'CNOT') {
        // Emit cx only once, from the ctrl cell; skip tgt cells
        if (gate.role === 'ctrl') {
          lines.push(`cx q[${q}], q[${gate.partner}];`)
        }
        continue
      }

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
      <div
        className="builder-collapsible-header"
        onClick={() => setExpanded(e => !e)}
        style={{ marginBottom: expanded ? 10 : 0 }}
      >
        <div style={{
          fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
        }}>
          Advanced · Technical details (OpenQASM)
        </div>
        <span
          className="builder-chevron"
          style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          ▾
        </span>
      </div>

      {expanded && lines.map((l, i) => {
        let color = 'rgba(255,255,255,0.45)'
        if (l.startsWith('OPENQASM') || l.startsWith('include')) color = 'rgba(255,255,255,0.2)'
        if (l.startsWith('qreg') || l.startsWith('creg'))        color = '#A78BFA99'
        if (l.startsWith('h '))                                   color = '#6EE7D0cc'
        if (l.startsWith('x '))                                   color = '#FCA5A5cc'
        if (l.startsWith('measure'))                              color = '#FCD34Dcc'
        if (l.startsWith('cx '))                                  color = '#C4B5FDcc'
        return <div key={i} style={{ color }}>{l || '\u00A0'}</div>
      })}
    </div>
  )
}
