import { GATES } from '../circuitBuilder.constants'

export function GateChip({ type, size = 'md', onClick, isNew = false }) {
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
