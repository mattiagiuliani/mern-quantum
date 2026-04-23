import { simulate, applyGateStep } from '../services/quantum.service.js'
import mongoose from 'mongoose'
import Circuit from '../models/Circuit.model.js'

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

// ─── circuit CRUD (authenticated) ────────────────────────────────────────────

/**
 * POST /api/circuits
 * Body: { name?, circuitMatrix: string[][] }
 */
export const saveCircuit = async (req, res) => {
  try {
    const { name, circuitMatrix } = req.body

    if (!Array.isArray(circuitMatrix) || circuitMatrix.length === 0) {
      return res.status(400).json({ success: false, message: 'circuitMatrix is required' })
    }

    const circuit = await Circuit.create({
      owner: req.user.id,
      name: typeof name === 'string' && name.trim() ? name.trim() : 'Unnamed circuit',
      circuitMatrix,
      qubits: circuitMatrix.length,
    })

    return res.status(201).json({ success: true, circuit })
  } catch (err) {
    console.error('[saveCircuit]', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * GET /api/circuits/mine
 */
export const getMineCircuits = async (req, res) => {
  try {
    const circuits = await Circuit.find({ owner: req.user.id })
      .sort({ updatedAt: -1 })
      .select('name qubits circuitMatrix lastResult updatedAt createdAt')
      .lean()

    return res.status(200).json({ success: true, circuits })
  } catch (err) {
    console.error('[getMineCircuits]', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * GET /api/circuits/:id
 */
export const getCircuitById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid circuit id' })
    }

    const circuit = await Circuit.findById(req.params.id).lean()
    if (!circuit) return res.status(404).json({ success: false, message: 'Circuit not found' })
    if (circuit.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    return res.status(200).json({ success: true, circuit })
  } catch (err) {
    console.error('[getCircuitById]', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * PUT /api/circuits/:id
 * Body: { name?, circuitMatrix?, lastResult? }
 */
export const updateCircuit = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid circuit id' })
    }

    const circuit = await Circuit.findById(req.params.id)
    if (!circuit) return res.status(404).json({ success: false, message: 'Circuit not found' })
    if (circuit.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const { name, circuitMatrix, lastResult } = req.body
    if (typeof name === 'string' && name.trim()) circuit.name = name.trim()
    if (Array.isArray(circuitMatrix)) {
      circuit.circuitMatrix = circuitMatrix
      circuit.qubits = circuitMatrix.length
    }
    if (lastResult !== undefined) circuit.lastResult = lastResult

    await circuit.save()
    return res.status(200).json({ success: true, circuit })
  } catch (err) {
    console.error('[updateCircuit]', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * DELETE /api/circuits/:id
 */
export const deleteCircuit = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid circuit id' })
    }

    const circuit = await Circuit.findById(req.params.id)
    if (!circuit) return res.status(404).json({ success: false, message: 'Circuit not found' })
    if (circuit.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    await circuit.deleteOne()
    return res.status(200).json({ success: true, message: 'Circuit deleted' })
  } catch (err) {
    console.error('[deleteCircuit]', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
