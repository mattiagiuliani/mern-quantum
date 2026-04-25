import mongoose from 'mongoose'

const VALID_SINGLE_GATES = new Set(['H', 'X', 'M'])
const MAX_QUBITS         = 10
const MAX_STEPS          = 16

function isValidCnotCell(cell, qubitIdx, numQubits) {
  if (typeof cell !== 'object' || cell === null) return false
  if (cell.gate !== 'CNOT') return false
  if (cell.role !== 'ctrl' && cell.role !== 'tgt') return false
  if (!Number.isInteger(cell.partner)) return false
  if (cell.partner < 0 || cell.partner >= numQubits) return false
  if (cell.partner === qubitIdx) return false
  return true
}

function isValidCircuitMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return false
  if (matrix.length > MAX_QUBITS) return false
  if (!Array.isArray(matrix[0])) return false

  const numQubits = matrix.length
  const stepCount = matrix[0].length
  if (stepCount > MAX_STEPS) return false

  for (let q = 0; q < numQubits; q++) {
    const row = matrix[q]
    if (!Array.isArray(row) || row.length !== stepCount) return false

    for (let s = 0; s < stepCount; s++) {
      const cell = row[s]
      if (cell === null) continue

      if (typeof cell === 'string') {
        if (!VALID_SINGLE_GATES.has(cell)) return false
        continue
      }

      if (typeof cell === 'object') {
        if (!isValidCnotCell(cell, q, numQubits)) return false
        const partner = matrix[cell.partner]?.[s]
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

const circuitSchema = new mongoose.Schema({
  owner:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, default: 'Unnamed circuit', trim: true, maxlength: 80 },
  qubits:        { type: Number, default: 2 },
  circuitMatrix: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
    validate: {
      validator: isValidCircuitMatrix,
      message: 'circuitMatrix contains invalid gate values or structure',
    },
  },
  lastResult:    { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true })

circuitSchema.index({ owner: 1, updatedAt: -1 })

export default mongoose.model('Circuit', circuitSchema)
