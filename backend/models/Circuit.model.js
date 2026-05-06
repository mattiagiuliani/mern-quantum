import mongoose from 'mongoose'
import { isValidCircuitMatrix } from '../utils/circuitValidation.js'

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
