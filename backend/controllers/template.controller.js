import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import Template from '../models/Template.model.js'
import { ok, fail } from '../utils/respond.js'
import logger from '../utils/logger.js'

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

    if (!payload.name) return fail(res, 'Template name is required')

    const template = await Template.create({ ...payload, author: req.user.id })
    return ok(res, { template }, 201)
  } catch (err) {
    if (err.name === 'ValidationError') return fail(res, err.message)
    logger.error({ err }, '[createTemplate]')
    return fail(res, 'Internal server error', 500)
  }
}

export const getMyTemplates = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const skip  = (page - 1) * limit

    const [templates, total] = await Promise.all([
      Template.find({ author: req.user.id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Template.countDocuments({ author: req.user.id }),
    ])

    return ok(res, { templates, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    logger.error({ err }, '[getMyTemplates]')
    return fail(res, 'Internal server error', 500)
  }
}

export const getPublicTemplates = async (req, res) => {
  try {
    const tag   = typeof req.query.tag === 'string' ? req.query.tag.trim() : ''
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    const skip  = (page - 1) * limit
    const filter = { isPublic: true }
    if (tag) filter.tags = tag

    const [templates, total] = await Promise.all([
      Template.find(filter)
        .populate('author', 'username')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Template.countDocuments(filter),
    ])

    return ok(res, { templates, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    logger.error({ err }, '[getPublicTemplates]')
    return fail(res, 'Internal server error', 500)
  }
}

export const getTemplateById = async (req, res) => {
  try {
    if (!isValidTemplateId(req.params.id)) return fail(res, 'Invalid template id')

    const template = await Template.findById(req.params.id)
      .populate('author', 'username')
      .lean()

    if (!template) return fail(res, 'Template not found', 404)

    const requesterId = req.user?.id ?? getRequesterIdFromCookie(req)
    const isOwner = requesterId && String(template.author?._id ?? template.author) === String(requesterId)

    if (!template.isPublic && !isOwner) return fail(res, 'Access denied', 403)

    return ok(res, { template })
  } catch (err) {
    logger.error({ err }, '[getTemplateById]')
    return fail(res, 'Internal server error', 500)
  }
}

export const updateTemplate = async (req, res) => {
  try {
    if (!isValidTemplateId(req.params.id)) return fail(res, 'Invalid template id')

    const template = await Template.findById(req.params.id)
    if (!template) return fail(res, 'Template not found', 404)
    if (String(template.author) !== String(req.user.id)) return fail(res, 'Only owner can update this template', 403)

    const payload = normalizePayload(req.body)
    if (!payload.name) return fail(res, 'Template name is required')

    template.name = payload.name
    template.description = payload.description
    template.circuit = payload.circuit
    template.tags = payload.tags
    template.isPublic = payload.isPublic

    await template.save()
    return ok(res, { template })
  } catch (err) {
    if (err.name === 'ValidationError') return fail(res, err.message)
    logger.error({ err }, '[updateTemplate]')
    return fail(res, 'Internal server error', 500)
  }
}

export const deleteTemplate = async (req, res) => {
  try {
    if (!isValidTemplateId(req.params.id)) return fail(res, 'Invalid template id')

    const template = await Template.findById(req.params.id)
    if (!template) return fail(res, 'Template not found', 404)
    if (String(template.author) !== String(req.user.id)) return fail(res, 'Only owner can delete this template', 403)

    await template.deleteOne()
    return ok(res, { message: 'Template deleted' })
  } catch (err) {
    logger.error({ err }, '[deleteTemplate]')
    return fail(res, 'Internal server error', 500)
  }
}
