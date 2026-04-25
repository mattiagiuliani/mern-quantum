import { useState } from 'react'
import { GATES } from '../circuitBuilder.constants'
import { GateChip } from './GateChip'

/** Resolve preview colors when hovering an empty cell with a gate selected */
function getHoverStyle(selectedGate) {
  if (!selectedGate) return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' }
  const g = GATES[selectedGate]
  if (!g) return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' }
  return { bg: g.bg, border: g.border }
}

export function Cell({ gate, selectedGate, onClick, isNew = false, isFocused = false, isPending = false }) {
  const [hovered, setHovered] = useState(false)
  const isEmpty = !gate

  const hoverStyle = getHoverStyle(selectedGate)
  const showHoverPreview = isEmpty && hovered && selectedGate

  // Pending CNOT control: highlight the cell waiting for a target
  const pendingStyle = isPending
    ? { boxShadow: '0 0 0 2px rgba(167,139,250,0.7), 0 0 16px rgba(167,139,250,0.35)' }
    : {}

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isEmpty
          ? showHoverPreview ? hoverStyle.bg : 'rgba(255,255,255,0.03)'
          : 'transparent',
        border: `1.5px solid ${isEmpty
          ? showHoverPreview ? hoverStyle.border : 'rgba(255,255,255,0.08)'
          : 'transparent'}`,
        borderRadius: 8,
        cursor: isEmpty ? (selectedGate ? 'cell' : 'default') : 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        flexShrink: 0,
        boxShadow: isFocused
          ? '0 0 0 2px rgba(110,231,208,0.55), 0 0 16px rgba(110,231,208,0.25)'
          : isPending
            ? pendingStyle.boxShadow
            : 'none',
      }}
    >
      {gate && (
        <div title="Click to remove">
          <GateChip type={gate} size="sm" isNew={isNew} />
        </div>
      )}
      {isEmpty && showHoverPreview && (
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: selectedGate === 'CNOT' ? 12 : 16,
          color: GATES[selectedGate]?.color ?? 'rgba(255,255,255,0.3)',
          opacity: 0.45,
          pointerEvents: 'none',
        }}>
          {selectedGate === 'CNOT' ? 'CX' : GATES[selectedGate]?.label}
        </div>
      )}
    </div>
  )
}
