import { useState } from 'react'
import { GATES } from '../circuitBuilder.constants'
import { GateChip } from './GateChip'
import styles from '../circuitBuilder.module.css'

/** Resolve preview colors when hovering an empty cell with a gate selected */
function getHoverStyle(selectedGate) {
  if (!selectedGate) return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' }
  const g = GATES[selectedGate]
  if (!g) return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' }
  return { bg: g.bg, border: g.border }
}

export function Cell({ gate, selectedGate, onClick, isNew = false, isFocused = false, isPending = false, testId }) {
  const [hovered, setHovered] = useState(false)
  const isEmpty = !gate

  const hoverStyle = getHoverStyle(selectedGate)
  const showHoverPreview = isEmpty && hovered && selectedGate

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={testId}
      className={`${styles.cell} ${isEmpty ? styles.cellEmpty : ''} ${isFocused ? styles.cellFocused : ''} ${isPending ? styles.cellPending : ''}`}
      style={{
        background: isEmpty
          ? showHoverPreview ? hoverStyle.bg : 'rgba(255,255,255,0.03)'
          : 'transparent',
        border: `1.5px solid ${isEmpty
          ? showHoverPreview ? hoverStyle.border : 'rgba(255,255,255,0.08)'
          : 'transparent'}`,
        cursor: isEmpty ? (selectedGate ? 'cell' : 'default') : 'pointer',
      }}
    >
      {gate && (
        <div title="Click to remove">
          <GateChip type={gate} size="sm" isNew={isNew} />
        </div>
      )}
      {isEmpty && showHoverPreview && (
        <div className={`${styles.cellPreviewText} ${selectedGate === 'CNOT' ? styles.cellPreviewTextCnot : ''}`}
          style={{ color: GATES[selectedGate]?.color ?? 'rgba(255,255,255,0.3)' }}>
          {selectedGate === 'CNOT' ? 'CX' : GATES[selectedGate]?.label}
        </div>
      )}
    </div>
  )
}
