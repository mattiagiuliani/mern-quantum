import { describe, it, expect, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import {
  createTemplate,
  deleteTemplate,
  getMyTemplates,
  getTemplateById,
  getPublicTemplates,
  updateTemplate,
} from './template.controller.js'
import Template from '../models/Template.model.js'
import { publicTemplatesCache } from '../utils/cache.js'

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

  it('returns 201 with the created template on success', async () => {
    const original = Template.create
    Template.create = async (data) => ({ ...data, _id: 'abc123' })
    try {
      const req = {
        body: { name: 'Bell State', circuit: [[null]], tags: ['bell'], isPublic: false },
        user: { id: '507f191e810c19729de860ea' },
      }
      const res = createRes()
      await createTemplate(req, res)
      expect(res.statusCode).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.template.name).toBe('Bell State')
    } finally {
      Template.create = original
    }
  })

  it('returns 400 on ValidationError from Template.create', async () => {
    const original = Template.create
    const err = new Error('circuit is required')
    err.name = 'ValidationError'
    Template.create = async () => { throw err }
    try {
      const req = {
        body: { name: 'Bad', circuit: null, tags: [], isPublic: false },
        user: { id: '507f191e810c19729de860ea' },
      }
      const res = createRes()
      await createTemplate(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
    } finally {
      Template.create = original
    }
  })

  it('returns 500 on unexpected error from Template.create', async () => {
    const original = Template.create
    Template.create = async () => { throw new Error('DB connection lost') }
    try {
      const req = {
        body: { name: 'Valid', circuit: [[null]], tags: [], isPublic: false },
        user: { id: '507f191e810c19729de860ea' },
      }
      const res = createRes()
      await createTemplate(req, res)
      expect(res.statusCode).toBe(500)
      expect(res.body.success).toBe(false)
    } finally {
      Template.create = original
    }
  })
})

describe('getPublicTemplates', () => {
  beforeEach(() => { publicTemplatesCache.clear() })

  it('returns 500 on model error', async () => {
    const originalFind = Template.find
    Template.find = () => { throw new Error('boom') }
    try {
      const req = { query: {} }
      const res = createRes()
      await getPublicTemplates(req, res)
      expect(res.statusCode).toBe(500)
      expect(res.body.success).toBe(false)
    } finally {
      Template.find = originalFind
    }
  })

  it('returns cached response on second call without hitting the DB', async () => {
    let dbCalls = 0
    const originalFind = Template.find
    Template.find = () => {
      dbCalls++
      return { populate() { return this }, sort() { return this }, skip() { return this }, limit() { return this }, lean: async () => [] }
    }
    const originalCount = Template.countDocuments
    Template.countDocuments = async () => 0

    try {
      const req = { query: {} }
      await getPublicTemplates(req, createRes())  // cold — hits DB
      await getPublicTemplates(req, createRes())  // warm — served from cache
      expect(dbCalls).toBe(1)
    } finally {
      Template.find = originalFind
      Template.countDocuments = originalCount
    }
  })

  it('invalidates cache when a public template is created', async () => {
    publicTemplatesCache.set('public::1:20', { templates: [], total: 0, page: 1, pages: 0 })
    expect(publicTemplatesCache.size).toBe(1)

    const originalCreate = Template.create
    Template.create = async (data) => ({ ...data, _id: 'new-id' })
    try {
      const req = { body: { name: 'Bell', circuit: [[null]], tags: [], isPublic: true }, user: { id: 'u1' } }
      await createTemplate(req, createRes())
      expect(publicTemplatesCache.size).toBe(0)
    } finally {
      Template.create = originalCreate
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

  it('deletes successfully and returns 200', async () => {
    const originalFindById = Template.findById
    Template.findById = async () => ({
      author: '507f191e810c19729de860aa',
      deleteOne: async () => {},
    })
    try {
      const req = {
        params: { id: '507f191e810c19729de860ea' },
        user: { id: '507f191e810c19729de860aa' },
      }
      const res = createRes()
      await deleteTemplate(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    } finally {
      Template.findById = originalFindById
    }
  })

  it('returns 500 on unexpected error', async () => {
    const originalFindById = Template.findById
    Template.findById = async () => { throw new Error('DB error') }
    try {
      const req = {
        params: { id: '507f191e810c19729de860ea' },
        user: { id: '507f191e810c19729de860aa' },
      }
      const res = createRes()
      await deleteTemplate(req, res)
      expect(res.statusCode).toBe(500)
      expect(res.body.success).toBe(false)
    } finally {
      Template.findById = originalFindById
    }
  })
})

describe('getMyTemplates', () => {
  function makeFindChain(results) {
    return {
      sort() { return this },
      skip() { return this },
      limit() { return this },
      lean: async () => results,
    }
  }

  it('returns paginated templates for the authenticated user', async () => {
    const originalFind = Template.find
    const originalCount = Template.countDocuments
    Template.find = () => makeFindChain([{ _id: 'tid1', name: 'My Template' }])
    Template.countDocuments = async () => 1
    try {
      const req = { query: {}, user: { id: '507f191e810c19729de860aa' } }
      const res = createRes()
      await getMyTemplates(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.templates).toHaveLength(1)
      expect(res.body.total).toBe(1)
      expect(res.body.page).toBe(1)
      expect(res.body.pages).toBe(1)
    } finally {
      Template.find = originalFind
      Template.countDocuments = originalCount
    }
  })

  it('applies correct skip for page=2&limit=5', async () => {
    const originalFind = Template.find
    const originalCount = Template.countDocuments
    const calls = []
    Template.find = () => {
      const chain = {
        sort() { return this },
        skip(n) { calls.push({ skip: n }); return this },
        limit() { return this },
        lean: async () => [],
      }
      return chain
    }
    Template.countDocuments = async () => 10
    try {
      const req = { query: { page: '2', limit: '5' }, user: { id: '507f191e810c19729de860aa' } }
      const res = createRes()
      await getMyTemplates(req, res)
      expect(calls[0].skip).toBe(5)
      expect(res.body.page).toBe(2)
      expect(res.body.pages).toBe(2)
    } finally {
      Template.find = originalFind
      Template.countDocuments = originalCount
    }
  })

  it('returns 500 on unexpected error', async () => {
    const originalFind = Template.find
    Template.find = () => { throw new Error('DB error') }
    try {
      const req = { query: {}, user: { id: '507f191e810c19729de860aa' } }
      const res = createRes()
      await getMyTemplates(req, res)
      expect(res.statusCode).toBe(500)
      expect(res.body.success).toBe(false)
    } finally {
      Template.find = originalFind
    }
  })
})

describe('getPublicTemplates — tag filter', () => {
  it('returns templates filtered by tag', async () => {
    const originalFind = Template.find
    const originalCount = Template.countDocuments
    let capturedFilter = null
    Template.find = (filter) => {
      capturedFilter = filter
      return {
        populate() { return this },
        sort() { return this },
        skip() { return this },
        limit() { return this },
        lean: async () => [{ _id: 'tid1', tags: ['bell'] }],
      }
    }
    Template.countDocuments = async () => 1
    try {
      const req = { query: { tag: 'bell' } }
      const res = createRes()
      await getPublicTemplates(req, res)
      expect(res.statusCode).toBe(200)
      expect(capturedFilter.tags).toBe('bell')
    } finally {
      Template.find = originalFind
      Template.countDocuments = originalCount
    }
  })
})

describe('getTemplateById — additional paths', () => {
  it('returns 200 for a public template without auth', async () => {
    const originalFindById = Template.findById
    Template.findById = () => ({
      populate() { return this },
      lean: async () => ({
        _id: '507f191e810c19729de860ff',
        isPublic: true,
        author: { _id: '507f191e810c19729de860aa', username: 'alice' },
        circuit: [[null]],
      }),
    })
    try {
      const req = { params: { id: '507f191e810c19729de860ff' }, cookies: {}, user: undefined }
      const res = createRes()
      await getTemplateById(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    } finally {
      Template.findById = originalFindById
    }
  })

  it('returns 404 when template does not exist', async () => {
    const originalFindById = Template.findById
    Template.findById = () => ({
      populate() { return this },
      lean: async () => null,
    })
    try {
      const req = { params: { id: '507f191e810c19729de860ff' }, cookies: {}, user: undefined }
      const res = createRes()
      await getTemplateById(req, res)
      expect(res.statusCode).toBe(404)
      expect(res.body.success).toBe(false)
    } finally {
      Template.findById = originalFindById
    }
  })

  it('returns 500 on unexpected error', async () => {
    const originalFindById = Template.findById
    Template.findById = () => ({
      populate() { return this },
      lean: async () => { throw new Error('DB error') },
    })
    try {
      const req = { params: { id: '507f191e810c19729de860ff' }, cookies: {}, user: undefined }
      const res = createRes()
      await getTemplateById(req, res)
      expect(res.statusCode).toBe(500)
      expect(res.body.success).toBe(false)
    } finally {
      Template.findById = originalFindById
    }
  })

  it('allows owner to access private template via JWT cookie', async () => {
    const ownerId = '507f191e810c19729de860aa'
    const secret = 'test-secret-for-cookie-auth'
    process.env.JWT_SECRET = secret
    const token = jwt.sign({ id: ownerId }, secret)

    const originalFindById = Template.findById
    Template.findById = () => ({
      populate() { return this },
      lean: async () => ({
        _id: '507f191e810c19729de860ff',
        isPublic: false,
        author: { _id: ownerId, username: 'alice' },
        circuit: [[null]],
      }),
    })
    try {
      const req = { params: { id: '507f191e810c19729de860ff' }, cookies: { token }, user: undefined }
      const res = createRes()
      await getTemplateById(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    } finally {
      Template.findById = originalFindById
    }
  })
})

describe('updateTemplate — additional paths', () => {
  it('updates successfully and returns 200', async () => {
    const originalFindById = Template.findById
    const saved = {}
    Template.findById = async () => ({
      author: '507f191e810c19729de860aa',
      name: '',
      description: '',
      circuit: null,
      tags: [],
      isPublic: false,
      save: async () => { Object.assign(saved, { done: true }) },
    })
    try {
      const req = {
        params: { id: '507f191e810c19729de860ea' },
        body: { name: 'Updated', description: 'desc', circuit: [[null]], tags: ['x'], isPublic: false },
        user: { id: '507f191e810c19729de860aa' },
      }
      const res = createRes()
      await updateTemplate(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(saved.done).toBe(true)
    } finally {
      Template.findById = originalFindById
    }
  })

  it('returns 400 when name is empty in payload', async () => {
    const originalFindById = Template.findById
    Template.findById = async () => ({
      author: '507f191e810c19729de860aa',
    })
    try {
      const req = {
        params: { id: '507f191e810c19729de860ea' },
        body: { name: '   ', description: '', circuit: [[null]], tags: [], isPublic: false },
        user: { id: '507f191e810c19729de860aa' },
      }
      const res = createRes()
      await updateTemplate(req, res)
      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
    } finally {
      Template.findById = originalFindById
    }
  })

  it('returns 400 on ValidationError thrown by save()', async () => {
    const originalFindById = Template.findById
    const err = new Error('circuit path is required')
    err.name = 'ValidationError'
    Template.findById = async () => ({
      author: '507f191e810c19729de860aa',
      name: '', description: '', circuit: null, tags: [], isPublic: false,
      save: async () => { throw err },
    })
    try {
      const req = {
        params: { id: '507f191e810c19729de860ea' },
        body: { name: 'Valid', description: '', circuit: [[null]], tags: [], isPublic: false },
        user: { id: '507f191e810c19729de860aa' },
      }
      const res = createRes()
      await updateTemplate(req, res)
      expect(res.statusCode).toBe(400)
    } finally {
      Template.findById = originalFindById
    }
  })

  it('returns 500 on unexpected error during update', async () => {
    const originalFindById = Template.findById
    Template.findById = async () => { throw new Error('DB crash') }
    try {
      const req = {
        params: { id: '507f191e810c19729de860ea' },
        body: { name: 'Valid', description: '', circuit: [[null]], tags: [], isPublic: false },
        user: { id: '507f191e810c19729de860aa' },
      }
      const res = createRes()
      await updateTemplate(req, res)
      expect(res.statusCode).toBe(500)
      expect(res.body.success).toBe(false)
    } finally {
      Template.findById = originalFindById
    }
  })
})