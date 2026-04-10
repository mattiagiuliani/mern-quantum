import mongoose from 'mongoose'

const circuitSchema = new mongoose.Schema({
  owner:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:   { type: String, default: 'Circuit without name' },
  qubits: { type: Number, default: 2 },
  gates:  { type: Array, default: [] },       // [{type:'H', qubit:0}, ...]
  lastResult: { type: Object, default: null }, // risposta IBM
}, { timestamps: true })

export default mongoose.model('Circuit', circuitSchema)