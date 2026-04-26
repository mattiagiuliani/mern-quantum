import { simulate, applyGateStep } from '../services/quantum.service.js'
import mongoose from 'mongoose'
import Circuit from '../models/Circuit.model.js'
import { ok, fail } from '../utils/respond.js'
import logger from '../utils/logger.js'
import { isValidCircuitMatrix } from '../utils/circuitValidation.js'
import { captureBackendError } from '../config/sentry.js'

const ALLOWED_SINGLE_GATES = new Set(['H', 'X', 'M'])



function isValidQubitState(q) {
  if (!q || typeof q !== 'object') return false
  if (q.value !== 0 && q.value !== 1) return false
  if (typeof q.superposition !== 'boolean') return false
  return true
}

/**
 * POST /api/circuits/run
 * Body: { circuit: string[][], shots?: number }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {import('express').Response}
 */
export const runCircuit = (req, res) => {
  try {
    const { circuit, shots: rawShots = 1024 } = req.body

    if (!isValidCircuitMatrix(circuit)) {
      return fail(res, 'Invalid circuit')
    }

    const parsedShots = Number(rawShots)
    const normalizedShots = Number.isFinite(parsedShots) ? Math.trunc(parsedShots) : 1024
    const shots = Math.max(1, Math.min(10_000, normalizedShots || 1024))
    const result = simulate(circuit, shots)
    return ok(res, result)
  } catch (err) {
    captureBackendError(err, { handler: 'runCircuit' })
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
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {import('express').Response}
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
    captureBackendError(err, { handler: 'applyGate' })
    logger.error({ err }, '[applyGate]')
    return fail(res, 'Gate error', 500)
  }
}

// ─── circuit CRUD (authenticated) ────────────────────────────────────────────

/**
 * POST /api/circuits
 * Body: { name?, circuitMatrix: string[][] }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
export const saveCircuit = async (req, res) => {
  try {
    const { name, circuitMatrix } = req.body

    if (!Array.isArray(circuitMatrix) || circuitMatrix.length === 0) {
      return fail(res, 'circuitMatrix is required')
    }
    if (!isValidCircuitMatrix(circuitMatrix)) {
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
    captureBackendError(err, { handler: 'saveCircuit' })
    logger.error({ err }, '[saveCircuit]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * GET /api/circuits/mine?page=1&limit=20
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
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
    captureBackendError(err, { handler: 'getMineCircuits' })
    logger.error({ err }, '[getMineCircuits]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * GET /api/circuits/:id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
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
    captureBackendError(err, { handler: 'getCircuitById' })
    logger.error({ err }, '[getCircuitById]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * PUT /api/circuits/:id
 * Body: { name?, circuitMatrix?, lastResult? }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
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
      if (!isValidCircuitMatrix(circuitMatrix)) {
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
    captureBackendError(err, { handler: 'updateCircuit' })
    logger.error({ err }, '[updateCircuit]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * DELETE /api/circuits/:id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
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
    captureBackendError(err, { handler: 'deleteCircuit' })
    logger.error({ err }, '[deleteCircuit]')
    return fail(res, 'Internal server error', 500)
  }
}
