import { qubitDisplay } from '../circuitBuilder.utils'
import { Cell } from './Cell'

export function QubitWire({ qubitIndex, steps, selectedGate, onCellClick, onCellClear, animatingCells, liveQ, focusedCell }) {
  const { label: stateLabel, color: stateColor } = qubitDisplay(liveQ)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 64 }}>
      {/* qubit label + live state badge */}
      <div style={{
        width: 80, flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        paddingRight: 12, gap: 2,
      }}>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.02em',
        }}>
          q[{qubitIndex}]
        </span>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10, fontWeight: 700,
          color: stateColor,
          transition: 'color 0.3s ease',
          animation: liveQ.superposition ? 'superPulse 2s ease-in-out infinite' : 'none',
          letterSpacing: '0.04em',
        }}>
          {stateLabel}
        </span>
      </div>

      {/* wire + cells */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        {/* qubit wire line — glows during superposition */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          height: liveQ.superposition ? 2 : 1,
          background: liveQ.superposition
            ? `linear-gradient(90deg, ${stateColor}90, ${stateColor}40)`
            : `linear-gradient(90deg, ${stateColor}60, ${stateColor}20)`,
          boxShadow: liveQ.superposition ? `0 0 8px ${stateColor}55` : 'none',
          transition: 'background 0.4s ease, height 0.3s ease, box-shadow 0.4s ease',
        }} />
        <div style={{ display: 'flex', gap: 6, position: 'relative', zIndex: 1 }}>
          {steps.map((gate, stepIdx) => (
            <Cell
              key={stepIdx}
              gate={gate}
              selectedGate={selectedGate}
              isNew={animatingCells.has(`${qubitIndex}-${stepIdx}`)}
              isFocused={focusedCell?.qubit === qubitIndex && focusedCell?.step === stepIdx}
              onClick={() => gate
                ? onCellClear(qubitIndex, stepIdx)
                : onCellClick(qubitIndex, stepIdx)
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
