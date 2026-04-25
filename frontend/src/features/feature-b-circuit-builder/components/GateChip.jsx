import { GATES } from '../circuitBuilder.constants'

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
        style={{
          width: sz, height: sz,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: g.bg,
          border: `1.5px solid ${g.border}`,
          borderRadius: 8,
          fontFamily: "'Space Mono', monospace",
          fontSize: size === 'sm' ? 15 : 18,
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
        {label}
      </div>
    )
  }

  // Single-qubit gates
  const g  = GATES[type]
  const sz2 = sz // already defined above

  return (
    <div
      onClick={onClick}
      style={{
        width: sz2, height: sz2,
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
