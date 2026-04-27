import { NUM_QUBITS, MAX_STEPS } from '../circuitBuilder.constants'
import { QubitWire } from './QubitWire'

/**
 * Circuit grid: step indices, qubit wires, and step activity bar.
 */
export function CircuitCanvas({
  circuit,
  selectedGate,
  onCellClick,
  onCellClear,
  animatingCells,
  liveState,
  focusedCell,
  cnotPending,
}) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px 24px', overflowX: 'auto' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 18 }}>
        Step 2 · Place gates on the circuit ({NUM_QUBITS} qubits · {MAX_STEPS} time slots)
      </div>

      {/* step indices */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, paddingLeft: 80 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: MAX_STEPS }, (_, i) => (
            <div key={i} style={{ width: 44, textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.05em' }}>
              t{i}
            </div>
          ))}
        </div>
      </div>

      {/* qubit wires */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {circuit.map((row, qi) => (
          <QubitWire
            key={qi}
            qubitIndex={qi}
            steps={row}
            selectedGate={selectedGate}
            onCellClick={onCellClick}
            onCellClear={onCellClear}
            animatingCells={animatingCells}
            liveQ={liveState[qi]}
            focusedCell={focusedCell}
            cnotPending={cnotPending}
          />
        ))}
      </div>

      {/* step activity bar */}
      <div style={{ marginTop: 14, paddingLeft: 80, display: 'flex', gap: 6 }}>
        {Array.from({ length: MAX_STEPS }, (_, i) => {
          const active = circuit.some(row => row[i] !== null)
          return (
            <div key={i} style={{ width: 44, height: 3, borderRadius: 2, background: active ? 'rgba(110,231,208,0.3)' : 'rgba(255,255,255,0.04)', transition: 'background 0.3s' }} />
          )
        })}
      </div>
    </div>
  )
}
