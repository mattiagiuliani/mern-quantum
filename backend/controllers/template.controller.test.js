import { describe, it, expect } from 'vitest'
import {
  createTemplate,
  deleteTemplate,
  getTemplateById,
  getPublicTemplates,
  updateTemplate,
} from './template.controller.js'
import Template from '../models/Template.model.js'

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

describe('createTemplate', () => {
  it('rejects empty name', async () => {
    const req = {
      body: { name: '', circuit: [[null]] },
      user: { id: '507f191e810c19729de860ea' },
    }
    const res = createRes()
    await createTemplate(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe('getPublicTemplates', () => {
  it('returns 500 on model error', async () => {
    const originalFind        = Template.find
    const originalConsoleError = console.error
    console.error = () => {}
    Template.find = () => { throw new Error('boom') }
    try {
      const req = { query: {} }
      const res = createRes()
      await getPublicTemplates(req, res)
      expect(res.statusCode).toBe(500)
      expect(res.body.success).toBe(false)
    } finally {
      Template.find = originalFind
      console.error = originalConsoleError
    }
  })
})

describe('getTemplateById', () => {
  it('blocks private template for non-owner', async () => {
    const originalFindById = Template.findById
    Template.findById = () => ({
      populate() { return this },
      lean: async () => ({
        _id: '507f191e810c19729de860ff',
        isPublic: false,
        author: { _id: '507f191e810c19729de860aa', username: 'alice' },
        circuit: [[null]],
      }),
    })
    try {
      const req = { params: { id: '507f191e810c19729de860ff' }, cookies: {} }
      const res = createRes()
      await getTemplateById(req, res)
      expect(res.statusCode).toBe(403)
      expect(res.body.success).toBe(false)
    } finally {
      Template.findById = originalFindById
    }
  })

  it('rejects invalid template id', async () => {
    const req = { params: { id: 'invalid-id' }, cookies: {} }
    const res = createRes()
    await getTemplateById(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe('updateTemplate', () => {
  it('returns 404 if template not found', async () => {
    const originalFindById = Template.findById
    Template.findById = async () => null
    try {
      const req = {
        params: { id: '507f191e810c19729de860ea' },
        body: { name: 'N', description: '', circuit: [[null]], tags: [], isPublic: false },
        user: { id: '507f191e810c19729de860ea' },
      }
      const res = createRes()
      await updateTemplate(req, res)
      expect(res.statusCode).toBe(404)
      expect(res.body.success).toBe(false)
    } finally {
      Template.findById = originalFindById
    }
  })

  it('rejects invalid template id', async () => {
    const req = {
      params: { id: 'invalid-id' },
      body: { name: 'N', description: '', circuit: [[null]], tags: [], isPublic: false },
      user: { id: '507f191e810c19729de860ea' },
    }
    const res = createRes()
    await updateTemplate(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects non-owner', async () => {
    const originalFindById = Template.findById
    Template.findById = async () => ({ author: '507f191e810c19729de860ab' })
    try {
      const req = {
        params: { id: '507f191e810c19729de860ea' },
        body: { name: 'Updated', description: '', circuit: [[null]], tags: [], isPublic: false },
        user: { id: '507f191e810c19729de860aa' },
      }
      const res = createRes()
      await updateTemplate(req, res)
      expect(res.statusCode).toBe(403)
      expect(res.body.success).toBe(false)
    } finally {
      Template.findById = originalFindById
    }
  })
})

describe('deleteTemplate', () => {
  it('returns 404 if template not found', async () => {
    const originalFindById = Template.findById
    Template.findById = async () => null
    try {
      const req = {
        params: { id: '507f191e810c19729de860ea' },
        user: { id: '507f191e810c19729de860ea' },
      }
      const res = createRes()
      await deleteTemplate(req, res)
      expect(res.statusCode).toBe(404)
      expect(res.body.success).toBe(false)
    } finally {
      Template.findById = originalFindById
    }
  })

  it('rejects invalid template id', async () => {
    const req = {
      params: { id: 'invalid-id' },
      user: { id: '507f191e810c19729de860ea' },
    }
    const res = createRes()
    await deleteTemplate(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects non-owner', async () => {
    const originalFindById = Template.findById
    Template.findById = async () => ({ author: '507f191e810c19729de860ab' })
    try {
      const req = {
        params: { id: '507f191e810c19729de860ea' },
        user: { id: '507f191e810c19729de860aa' },
      }
      const res = createRes()
      await deleteTemplate(req, res)
      expect(res.statusCode).toBe(403)
      expect(res.body.success).toBe(false)
    } finally {
      Template.findById = originalFindById
    }
  })
})