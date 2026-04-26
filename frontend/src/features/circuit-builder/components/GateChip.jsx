import { GATES } from '../circuitBuilder.constants'
import styles from '../circuitBuilder.module.css'

/**
 * Renders a gate chip.
 *
 * @param {string | {gate:'CNOT', role:'ctrl'|'tgt', partner:number}} type
 *   - String: 'H' | 'X' | 'M'
 *   - Object: CNOT cell with role 'ctrl' or 'tgt'
 */
export function GateChip({ type, size = 'md', onClick, isNew = false }) {
  const sz = size === 'sm' ? 36 : 42

  // Resolve display properties for CNOT cells
  if (type && typeof type === 'object' && type.gate === 'CNOT') {
    const g = GATES.CNOT
    const label = type.role === 'ctrl' ? '\u25cf' : '\u2295'
    const title = type.role === 'ctrl'
      ? `CNOT control \u2192 q[${type.partner}]`
      : `CNOT target \u2190 q[${type.partner}]`

    return (
      <div
        title={title}
        onClick={onClick}
        className={`${styles.gateChip} ${size === 'sm' ? styles.gateChipSm : styles.gateChipMd} ${isNew ? styles.gateChipNew : ''}`}
        style={{
          width: sz,
          height: sz,
          background: g.bg,
          border: `1.5px solid ${g.border}`,
          color: g.color,
          cursor: onClick ? 'pointer' : 'default',
          fontSize: size === 'sm' ? 15 : 18,
          boxShadow: isNew ? `0 0 18px ${g.color}55` : 'none',
        }}
      >
        {label}
      </div>
    )
  }

  // Single-qubit gates
  const g = GATES[type]

  return (
    <div
      onClick={onClick}
      className={`${styles.gateChip} ${size === 'sm' ? styles.gateChipSm : styles.gateChipMd} ${isNew ? styles.gateChipNew : ''}`}
      style={{
        width: sz,
        height: sz,
        background: g.bg,
        border: `1.5px solid ${g.border}`,
        color: g.color,
        cursor: onClick ? 'pointer' : 'default',
        fontSize: size === 'sm' ? 13 : 15,
        boxShadow: isNew ? `0 0 18px ${g.color}55` : 'none',
      }}
    >
      {g.label}
    </div>
  )
}
