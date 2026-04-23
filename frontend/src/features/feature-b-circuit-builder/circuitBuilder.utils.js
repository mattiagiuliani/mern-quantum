import { NUM_QUBITS, MAX_STEPS } from './circuitBuilder.constants'

export const emptyCircuit     = () => Array.from({ length: NUM_QUBITS }, () => Array(MAX_STEPS).fill(null))
export const initialLiveState = () => Array.from({ length: NUM_QUBITS }, () => ({ value: 0, superposition: false }))

export const isValidGate = (gate) => gate === null || gate === 'H' || gate === 'X' || gate === 'M'

export function normalizeTemplateCircuit(circuit) {
  const next = emptyCircuit()

  for (let qubit = 0; qubit < Math.min(NUM_QUBITS, circuit?.length ?? 0); qubit++) {
    const row = circuit[qubit]
    if (!Array.isArray(row)) continue

    for (let step = 0; step < Math.min(MAX_STEPS, row.length); step++) {
      const gate = row[step]
      if (isValidGate(gate)) {
        next[qubit][step] = gate
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
  color: q.superposition ? '#A78BFA' : q.value === 1 ? '#6EE7D0' : 'rgba(255,255,255,0.25)',
  bg:    q.superposition ? 'rgba(167,139,250,0.1)' : q.value === 1 ? 'rgba(110,231,208,0.1)' : 'rgba(255,255,255,0.03)',
})
