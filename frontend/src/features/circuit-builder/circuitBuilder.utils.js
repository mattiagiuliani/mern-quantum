import { NUM_QUBITS, MAX_STEPS } from './circuitBuilder.constants'
import { TOKENS } from '../../styles/tokens'

const { colors: C } = TOKENS

export const emptyCircuit     = () => Array.from({ length: NUM_QUBITS }, () => Array(MAX_STEPS).fill(null))
export const initialLiveState = () => Array.from({ length: NUM_QUBITS }, () => ({ value: 0, superposition: false }))

/** Returns true for any valid gate cell value (string gate, CNOT object, or null) */
export const isValidGate = (gate) => {
  if (gate === null) return true
  if (gate === 'H' || gate === 'X' || gate === 'M' || gate === 'S') return true
  if (gate && typeof gate === 'object' && gate.gate === 'CNOT'
      && (gate.role === 'ctrl' || gate.role === 'tgt')
      && typeof gate.partner === 'number') return true
  return false
}

export function normalizeTemplateCircuit(circuit) {
  const next = emptyCircuit()

  for (let qubit = 0; qubit < Math.min(NUM_QUBITS, circuit?.length ?? 0); qubit++) {
    const row = circuit[qubit]
    if (!Array.isArray(row)) continue

    for (let step = 0; step < Math.min(MAX_STEPS, row.length); step++) {
      const gate = row[step]
      if (isValidGate(gate)) {
        // Copy CNOT objects by value to avoid shared references
        next[qubit][step] = (gate && typeof gate === 'object') ? { ...gate } : gate
      }
    }
  }

  return next
}

export function buildGateSequenceFromCircuit(circuit) {
  const operations = []
  let opCounter = 0

  for (let step = 0; step < MAX_STEPS; step++) {
    for (let qubit = 0; qubit < NUM_QUBITS; qubit++) {
      const gate = circuit[qubit][step]
      if (!gate) continue

      // For CNOT: emit one operation from the ctrl cell, skip the tgt
      if (typeof gate === 'object' && gate.gate === 'CNOT') {
        if (gate.role === 'ctrl') {
          operations.push({
            id: `tpl-${Date.now()}-${opCounter++}-${qubit}-${step}`,
            gate: 'CNOT',
            qubit,
            targetQubit: gate.partner,
            step,
          })
        }
        // tgt cells are intentionally skipped here
        continue
      }

      operations.push({
        id: `tpl-${Date.now()}-${opCounter++}-${qubit}-${step}`,
        gate,
        qubit,
        step,
      })
    }
  }

  return operations
}

export const qubitDisplay = (q) => ({
  label: q.superposition ? '|\u03c8\u27e9' : q.value === 1 ? '|1\u27e9' : '|0\u27e9',
  color: q.superposition ? C.purple : q.value === 1 ? C.teal : 'rgba(255,255,255,0.25)',
  bg:    q.superposition ? C.purpleFaint : q.value === 1 ? C.tealSubtle : 'rgba(255,255,255,0.03)',
})
