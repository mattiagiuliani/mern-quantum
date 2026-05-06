export function MiniCircuitPreview({ circuit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {circuit.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: 'flex', gap: 4 }}>
          {row.map((cell, stepIdx) => {
            const label = cell && typeof cell === 'object' ? cell.gate : cell
            return (
              <div
                key={`${rowIdx}-${stepIdx}`}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.09)',
                  background: label ? 'rgba(110,231,208,0.15)' : 'rgba(255,255,255,0.03)',
                  color: label ? '#6EE7D0' : 'rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {label ?? '·'}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
