import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import Template from '../models/Template.model.js'

function normalizePayload(body = {}) {
  return {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    description: typeof body.description === 'string' ? body.description.trim() : '',
    circuit: body.circuit,
    tags: Array.isArray(body.tags) ? body.tags : [],
    isPublic: Boolean(body.isPublic),
  }
}

function getRequesterIdFromCookie(req) {
  try {
    const token = req.cookies?.token
    if (!token) return null
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded.id ?? null
  } catch {
    return null
  }
}

function isValidTemplateId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

export const createTemplate = async (req, res) => {
  try {
    const payload = normalizePayload(req.body)

    if (!payload.name) {
      return res.status(400).json({ success: false, message: 'Template name is required' })
    }

    const template = await Template.create({
      ...payload,
      author: req.user.id,
    })

    return res.status(201).json({ success: true, template })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message })
    }

    console.error('[createTemplate]', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const getMyTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ author: req.user.id })
      .sort({ updatedAt: -1 })
      .lean()

    return res.status(200).json({ success: true, templates })
  } catch (err) {
    console.error('[getMyTemplates]', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const getPublicTemplates = async (req, res) => {
  try {
    const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : ''
    const filter = { isPublic: true }

    if (tag) {
      filter.tags = tag
    }

    const templates = await Template.find(filter)
      .populate('author', 'username')
      .sort({ updatedAt: -1 })
      .lean()

    return res.status(200).json({ success: true, templates })
  } catch (err) {
    console.error('[getPublicTemplates]', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const getTemplateById = async (req, res) => {
  try {
    if (!isValidTemplateId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' })
    }

    const template = await Template.findById(req.params.id)
      .populate('author', 'username')
      .lean()

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    const requesterId = req.user?.id ?? getRequesterIdFromCookie(req)
    const isOwner = requesterId && String(template.author?._id ?? template.author) === String(requesterId)

    if (!template.isPublic && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    return res.status(200).json({ success: true, template })
  } catch (err) {
    console.error('[getTemplateById]', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const updateTemplate = async (req, res) => {
  try {
    if (!isValidTemplateId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' })
    }

    const template = await Template.findById(req.params.id)

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    if (String(template.author) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only owner can update this template' })
    }

    const payload = normalizePayload(req.body)

    if (!payload.name) {
      return res.status(400).json({ success: false, message: 'Template name is required' })
    }

    template.name = payload.name
    template.description = payload.description
    template.circuit = payload.circuit
    template.tags = payload.tags
    template.isPublic = payload.isPublic

    await template.save()

    return res.status(200).json({ success: true, template })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message })
    }

    console.error('[updateTemplate]', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const deleteTemplate = async (req, res) => {
  try {
    if (!isValidTemplateId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid template id' })
    }

    const template = await Template.findById(req.params.id)

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    if (String(template.author) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only owner can delete this template' })
    }

    await template.deleteOne()

    return res.status(200).json({ success: true, message: 'Template deleted' })
  } catch (err) {
    console.error('[deleteTemplate]', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
