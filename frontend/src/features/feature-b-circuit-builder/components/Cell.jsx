import { useState } from 'react'
import { GATES } from '../circuitBuilder.constants'
import { GateChip } from './GateChip'

export function Cell({ gate, selectedGate, onClick, isNew = false, isFocused = false }) {
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
