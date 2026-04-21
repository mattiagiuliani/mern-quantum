import mongoose from 'mongoose'

// Separate schema so Mongoose correctly interprets `type` as a field name,
// not as the SchemaType shorthand.
const gateSchema = new mongoose.Schema({
  type:  { type: String, enum: ['H', 'X', 'M'], required: true },
  qubit: { type: Number, min: 0, required: true },
}, { _id: false })

const circuitSchema = new mongoose.Schema({
  owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:       { type: String, default: 'Unnamed circuit' },
  qubits:     { type: Number, default: 2 },
  gates:      { type: [gateSchema], default: [] },
  lastResult: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true })

export default mongoose.model('Circuit', circuitSchema)
