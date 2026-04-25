import { simulate, applyGateStep } from '../services/quantum.service.js'
import mongoose from 'mongoose'
import Circuit from '../models/Circuit.model.js'
import { ok, fail } from '../utils/respond.js'
import logger from '../utils/logger.js'

const ALLOWED_SINGLE_GATES = new Set(['H', 'X', 'M'])
const MAX_QUBITS            = 10
const MAX_STEPS             = 16

/**
 * Validate a CNOT cell object.
 * Must be {gate:'CNOT', role:'ctrl'|'tgt', partner:number} with a valid partner index.
 */
function isValidCnotCell(cell, qubitIdx, numQubits) {
  if (typeof cell !== 'object' || cell === null) return false
  if (cell.gate !== 'CNOT') return false
  if (cell.role !== 'ctrl' && cell.role !== 'tgt') return false
  if (!Number.isInteger(cell.partner)) return false
  if (cell.partner < 0 || cell.partner >= numQubits) return false
  if (cell.partner === qubitIdx) return false
  return true
}

function isValidCircuit(circuit) {
  if (!Array.isArray(circuit) || circuit.length === 0) return false
  if (circuit.length > MAX_QUBITS) return false
  if (!Array.isArray(circuit[0])) return false

  const numQubits = circuit.length
  const stepCount = circuit[0].length
  if (stepCount > MAX_STEPS) return false

  for (let q = 0; q < numQubits; q++) {
    const row = circuit[q]
    if (!Array.isArray(row) || row.length !== stepCount) return false

    for (let s = 0; s < stepCount; s++) {
      const cell = row[s]
      if (cell === null) continue

      if (typeof cell === 'string') {
        if (!ALLOWED_SINGLE_GATES.has(cell)) return false
        continue
      }

      if (typeof cell === 'object') {
        if (!isValidCnotCell(cell, q, numQubits)) return false
        // Verify the partner has a matching CNOT cell at the same step
        const partner = circuit[cell.partner]?.[s]
        if (!partner || typeof partner !== 'object') return false
        if (partner.gate !== 'CNOT' || partner.partner !== q) return false
        const expectedRole = cell.role === 'ctrl' ? 'tgt' : 'ctrl'
        if (partner.role !== expectedRole) return false
        continue
      }

      return false
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
      return fail(res, 'Invalid circuit')
    }

    const parsedShots = Number(rawShots)
    const normalizedShots = Number.isFinite(parsedShots) ? Math.trunc(parsedShots) : 1024
    const shots = Math.max(1, Math.min(10_000, normalizedShots || 1024))
    const result = simulate(circuit, shots)
    return ok(res, result)
  } catch (err) {
    logger.error({ err }, '[runCircuit]')
    return fail(res, 'Simulation error', 500)
  }
}

/**
 * POST /api/circuits/applyGate
 *
 * Single-qubit gate:
 *   Body: { qubitStates, gate: 'H'|'X'|'M', qubitIndex: number }
 *
 * Two-qubit CNOT gate:
 *   Body: { qubitStates, gate: 'CNOT', controlIndex: number, targetIndex: number }
 *
 * Returns the updated qubitStates array and, for M gates, the measurement value.
 */
export const applyGate = (req, res) => {
  try {
    const { qubitStates, gate, qubitIndex, controlIndex, targetIndex } = req.body

    if (!Array.isArray(qubitStates) || qubitStates.length === 0) {
      return fail(res, 'Invalid qubitStates')
    }
    if (!qubitStates.every(isValidQubitState)) {
      return fail(res, 'Invalid qubitStates')
    }

    const next = qubitStates.map(q => ({ ...q }))

    if (gate === 'CNOT') {
      if (!Number.isInteger(controlIndex) || !Number.isInteger(targetIndex)) {
        return fail(res, 'controlIndex and targetIndex are required for CNOT')
      }
      if (controlIndex < 0 || controlIndex >= next.length) {
        return fail(res, 'controlIndex out of range')
      }
      if (targetIndex < 0 || targetIndex >= next.length) {
        return fail(res, 'targetIndex out of range')
      }
      if (controlIndex === targetIndex) {
        return fail(res, 'controlIndex and targetIndex must differ')
      }

      const ctrl = next[controlIndex]
      // Collapse control if in superposition
      if (ctrl.superposition) {
        ctrl.value = Math.random() < 0.5 ? 0 : 1
        ctrl.superposition = false
      }
      // Apply NOT to target iff control is |1⟩
      if (ctrl.value === 1) {
        next[targetIndex].value = 1 - next[targetIndex].value
        next[targetIndex].superposition = false
      }
      return ok(res, { qubitStates: next, measurement: null })
    }

    // Single-qubit gates
    if (!ALLOWED_SINGLE_GATES.has(gate)) {
      return fail(res, 'Unknown gate')
    }
    if (!Number.isInteger(qubitIndex)) {
      return fail(res, 'qubitIndex out of range')
    }
    if (qubitIndex < 0 || qubitIndex >= next.length) {
      return fail(res, 'qubitIndex out of range')
    }

    const q = next[qubitIndex]
    const [nv, ns, measurement] = applyGateStep(q.value, q.superposition, gate)
    q.value = nv
    q.superposition = ns

    return ok(res, { qubitStates: next, measurement })
  } catch (err) {
    logger.error({ err }, '[applyGate]')
    return fail(res, 'Gate error', 500)
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
      return fail(res, 'circuitMatrix is required')
    }
    if (!isValidCircuit(circuitMatrix)) {
      return fail(res, 'circuitMatrix exceeds allowed dimensions or contains invalid gates')
    }

    const circuit = await Circuit.create({
      owner: req.user.id,
      name: typeof name === 'string' && name.trim() ? name.trim() : 'Unnamed circuit',
      circuitMatrix,
      qubits: circuitMatrix.length,
    })

    return ok(res, { circuit }, 201)
  } catch (err) {
    logger.error({ err }, '[saveCircuit]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * GET /api/circuits/mine?page=1&limit=20
 */
export const getMineCircuits = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const skip  = (page - 1) * limit

    const [circuits, total] = await Promise.all([
      Circuit.find({ owner: req.user.id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name qubits circuitMatrix lastResult updatedAt createdAt')
        .lean(),
      Circuit.countDocuments({ owner: req.user.id }),
    ])

    return ok(res, { circuits, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    logger.error({ err }, '[getMineCircuits]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * GET /api/circuits/:id
 */
export const getCircuitById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return fail(res, 'Invalid circuit id')
    }

    const circuit = await Circuit.findById(req.params.id).lean()
    if (!circuit) return fail(res, 'Circuit not found', 404)
    if (circuit.owner.toString() !== req.user.id) {
      return fail(res, 'Forbidden', 403)
    }

    return ok(res, { circuit })
  } catch (err) {
    logger.error({ err }, '[getCircuitById]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * PUT /api/circuits/:id
 * Body: { name?, circuitMatrix?, lastResult? }
 */
export const updateCircuit = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return fail(res, 'Invalid circuit id')
    }

    const circuit = await Circuit.findById(req.params.id)
    if (!circuit) return fail(res, 'Circuit not found', 404)
    if (circuit.owner.toString() !== req.user.id) {
      return fail(res, 'Forbidden', 403)
    }

    const { name, circuitMatrix, lastResult } = req.body
    if (typeof name === 'string' && name.trim()) circuit.name = name.trim()
    if (Array.isArray(circuitMatrix)) {
      if (!isValidCircuit(circuitMatrix)) {
        return fail(res, 'circuitMatrix exceeds allowed dimensions or contains invalid gates')
      }
      circuit.circuitMatrix = circuitMatrix
      circuit.markModified('circuitMatrix')
      circuit.qubits = circuitMatrix.length
    }
    if (lastResult !== undefined) circuit.lastResult = lastResult

    await circuit.save()
    return ok(res, { circuit })
  } catch (err) {
    logger.error({ err }, '[updateCircuit]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * DELETE /api/circuits/:id
 */
export const deleteCircuit = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return fail(res, 'Invalid circuit id')
    }

    const circuit = await Circuit.findById(req.params.id)
    if (!circuit) return fail(res, 'Circuit not found', 404)
    if (circuit.owner.toString() !== req.user.id) {
      return fail(res, 'Forbidden', 403)
    }

    await circuit.deleteOne()
    return ok(res, { message: 'Circuit deleted' })
  } catch (err) {
    logger.error({ err }, '[deleteCircuit]')
    return fail(res, 'Internal server error', 500)
  }
}
