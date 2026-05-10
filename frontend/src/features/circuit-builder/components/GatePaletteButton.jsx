import { useState } from 'react'
import { GATES } from '../circuitBuilder.constants'

export function GatePaletteButton({ type, selected, onClick }) {
  const g = GATES[type]
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={() => onClick(type)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={selected}
      aria-label={`${g.name} gate`}
      type="button"
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
