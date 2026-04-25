import mongoose from 'mongoose'

const ALLOWED_GATES = new Set(['H', 'X', 'M'])
const MAX_QUBITS    = 10
const MAX_STEPS     = 16

function isValidCircuitMatrix(circuit) {
  if (!Array.isArray(circuit) || circuit.length === 0) return false
  if (circuit.length > MAX_QUBITS) return false
  if (!Array.isArray(circuit[0]) || circuit[0].length === 0) return false

  const stepCount = circuit[0].length
  if (stepCount > MAX_STEPS) return false

  for (const row of circuit) {
    if (!Array.isArray(row) || row.length !== stepCount) return false

    for (const gate of row) {
      if (gate !== null && !ALLOWED_GATES.has(gate)) return false
    }
  }

  return true
}

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    minlength: [2, 'Template name must be at least 2 characters'],
    maxlength: [120, 'Template name must be at most 120 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be at most 500 characters'],
    default: '',
  },
  circuit: {
    type: [[String]],
    required: [true, 'Circuit is required'],
    validate: {
      validator: isValidCircuitMatrix,
      message: 'Circuit must be a rectangular matrix using H, X, M or null values',
    },
  },
  tags: {
    type: [String],
    default: [],
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, { timestamps: true })

templateSchema.index({ author: 1, updatedAt: -1 })
templateSchema.index({ isPublic: 1, updatedAt: -1 })
templateSchema.index({ tags: 1 })

templateSchema.pre('validate', function () {
  if (Array.isArray(this.tags)) {
    const normalized = this.tags
      .map((tag) => String(tag).trim())
      .filter(Boolean)
    this.tags = [...new Set(normalized)]
  }
})

export default mongoose.model('Template', templateSchema)
