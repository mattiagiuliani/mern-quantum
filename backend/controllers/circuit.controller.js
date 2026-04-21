import { simulate, applyGateStep } from '../services/quantum.service.js'

const ALLOWED_GATES = new Set(['H', 'X', 'M'])

function isValidCircuit(circuit) {
  if (!Array.isArray(circuit) || circuit.length === 0) return false
  if (!Array.isArray(circuit[0])) return false

  const stepCount = circuit[0].length
  for (const row of circuit) {
    if (!Array.isArray(row) || row.length !== stepCount) return false
    for (const gate of row) {
      if (gate !== null && !ALLOWED_GATES.has(gate)) return false
    }
  }

  return true
}

function isValidQubitState(q) {
  if (!q || typeof q !== 'object') return false
  if (q.value !== 0 && q.value !== 1) return false
  if (typeof q.superposition !== 'boolean') return false
  return true
}

/**
 * POST /api/circuits/run
 * Body: { circuit: string[][], shots?: number }
 */
export const runCircuit = (req, res) => {
  try {
    const { circuit, shots: rawShots = 1024 } = req.body

    if (!isValidCircuit(circuit)) {
      return res.status(400).json({ success: false, message: 'Invalid circuit' })
    }

    const parsedShots = Number(rawShots)
    const normalizedShots = Number.isFinite(parsedShots) ? Math.trunc(parsedShots) : 1024
    const shots = Math.max(1, Math.min(10_000, normalizedShots || 1024))
    const result = simulate(circuit, shots)
    res.status(200).json({ success: true, ...result })
  } catch (err) {
    console.error('[runCircuit]', err)
    res.status(500).json({ success: false, message: 'Simulation error' })
  }
}

/**
 * POST /api/circuits/applyGate
 * Body: { qubitStates: {value:0|1, superposition:bool}[], gate: 'H'|'X'|'M', qubitIndex: number }
 * Returns the updated qubitStates array and, for M gates, the measurement value.
 */
export const applyGate = (req, res) => {
  try {
    const { qubitStates, gate, qubitIndex } = req.body

    if (!Array.isArray(qubitStates) || qubitStates.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid qubitStates' })
    }
    if (!qubitStates.every(isValidQubitState)) {
      return res.status(400).json({ success: false, message: 'Invalid qubitStates' })
    }
    if (!ALLOWED_GATES.has(gate)) {
      return res.status(400).json({ success: false, message: 'Unknown gate' })
    }
    if (!Number.isInteger(qubitIndex)) {
      return res.status(400).json({ success: false, message: 'qubitIndex out of range' })
    }
    if (qubitIndex < 0 || qubitIndex >= qubitStates.length) {
      return res.status(400).json({ success: false, message: 'qubitIndex out of range' })
    }

    const next = qubitStates.map(q => ({ ...q }))
    const q = next[qubitIndex]
    const [nv, ns, measurement] = applyGateStep(q.value, q.superposition, gate)
    q.value = nv
    q.superposition = ns

    res.status(200).json({ success: true, qubitStates: next, measurement })
  } catch (err) {
    console.error('[applyGate]', err)
    res.status(500).json({ success: false, message: 'Gate error' })
  }
}
