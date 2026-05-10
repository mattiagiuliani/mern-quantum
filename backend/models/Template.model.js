import mongoose from 'mongoose'
import { isValidCircuitMatrix } from '../utils/circuitValidation.js'

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
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Circuit is required'],
    validate: {
      validator: isValidCircuitMatrix,
      message: 'Circuit must be a valid circuit matrix using supported gates',
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
