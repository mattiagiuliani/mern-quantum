import { GATES } from '../circuitBuilder.constants'

const KBD_HINTS = [
  { label: 'H', desc: 'Pick Hadamard gate' },
  { label: 'X', desc: 'Pick Pauli-X gate' },
  { label: 'M', desc: 'Pick Measure gate' },
  { label: 'ESC', desc: 'Clear current gate selection' },
  { label: '\u2303Z', desc: 'Undo last placed gate' },
]

export function InfoTooltip({ gate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {!gate ? (
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
          {'Step 1: choose a gate, then click any cell on a wire'}
        </div>
      ) : (
        <div style={{
          padding: '10px 14px',
          background: GATES[gate].bg,
          border: `1px solid ${GATES[gate].border}`,
          borderRadius: 10,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: GATES[gate].color }}>{GATES[gate].label}</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: GATES[gate].color, letterSpacing: '0.08em' }}>{GATES[gate].name}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>·</span>
          <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{GATES[gate].desc}</span>
        </div>
      )}

      <div className="builder-kbd-hint">
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Shortcuts
        </span>
        {KBD_HINTS.map(({ label, desc }) => (
          <span key={label} className="builder-kbd" title={desc}>{label}</span>
        ))}
      </div>
    </div>
  )
}
