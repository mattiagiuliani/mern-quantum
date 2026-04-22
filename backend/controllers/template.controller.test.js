import test from 'node:test'
import assert from 'node:assert/strict'
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

test('createTemplate rejects empty name', async () => {
  const req = {
    body: { name: '', circuit: [[null]] },
    user: { id: '507f191e810c19729de860ea' },
  }
  const res = createRes()

  await createTemplate(req, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('getPublicTemplates returns 500 on model error', async (t) => {
  const originalFind = Template.find
  const originalConsoleError = console.error

  console.error = () => {}
  Template.find = () => {
    throw new Error('boom')
  }

  t.after(() => {
    Template.find = originalFind
    console.error = originalConsoleError
  })

  const req = { query: {} }
  const res = createRes()

  await getPublicTemplates(req, res)

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

test('getTemplateById blocks private template for non-owner', async (t) => {
  const originalFindById = Template.findById

  Template.findById = () => ({
    populate() {
      return this
    },
    lean: async () => ({
      _id: '507f191e810c19729de860ff',
      isPublic: false,
      author: { _id: '507f191e810c19729de860aa', username: 'alice' },
      circuit: [[null]],
    }),
  })

  t.after(() => {
    Template.findById = originalFindById
  })

  const req = {
    params: { id: '507f191e810c19729de860ff' },
    cookies: {},
  }
  const res = createRes()

  await getTemplateById(req, res)

  assert.equal(res.statusCode, 403)
  assert.equal(res.body.success, false)
})

test('getTemplateById rejects invalid template id', async () => {
  const req = {
    params: { id: 'invalid-id' },
    cookies: {},
  }
  const res = createRes()

  await getTemplateById(req, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('updateTemplate returns 404 if template not found', async (t) => {
  const originalFindById = Template.findById
  Template.findById = async () => null

  t.after(() => {
    Template.findById = originalFindById
  })

  const req = {
    params: { id: '507f191e810c19729de860ea' },
    body: { name: 'N', description: '', circuit: [[null]], tags: [], isPublic: false },
    user: { id: '507f191e810c19729de860ea' },
  }
  const res = createRes()

  await updateTemplate(req, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.success, false)
})

test('updateTemplate rejects invalid template id', async () => {
  const req = {
    params: { id: 'invalid-id' },
    body: { name: 'N', description: '', circuit: [[null]], tags: [], isPublic: false },
    user: { id: '507f191e810c19729de860ea' },
  }
  const res = createRes()

  await updateTemplate(req, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('deleteTemplate returns 404 if template not found', async (t) => {
  const originalFindById = Template.findById
  Template.findById = async () => null

  t.after(() => {
    Template.findById = originalFindById
  })

  const req = {
    params: { id: '507f191e810c19729de860ea' },
    user: { id: '507f191e810c19729de860ea' },
  }
  const res = createRes()

  await deleteTemplate(req, res)

  assert.equal(res.statusCode, 404)
  assert.equal(res.body.success, false)
})

test('deleteTemplate rejects invalid template id', async () => {
  const req = {
    params: { id: 'invalid-id' },
    user: { id: '507f191e810c19729de860ea' },
  }
  const res = createRes()

  await deleteTemplate(req, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('updateTemplate rejects non-owner', async (t) => {
  const originalFindById = Template.findById
  Template.findById = async () => ({
    author: '507f191e810c19729de860ab',
  })

  t.after(() => {
    Template.findById = originalFindById
  })

  const req = {
    params: { id: '507f191e810c19729de860ea' },
    body: { name: 'Updated', description: '', circuit: [[null]], tags: [], isPublic: false },
    user: { id: '507f191e810c19729de860aa' },
  }
  const res = createRes()

  await updateTemplate(req, res)

  assert.equal(res.statusCode, 403)
  assert.equal(res.body.success, false)
})

test('deleteTemplate rejects non-owner', async (t) => {
  const originalFindById = Template.findById
  Template.findById = async () => ({
    author: '507f191e810c19729de860ab',
  })

  t.after(() => {
    Template.findById = originalFindById
  })

  const req = {
    params: { id: '507f191e810c19729de860ea' },
    user: { id: '507f191e810c19729de860aa' },
  }
  const res = createRes()

  await deleteTemplate(req, res)

  assert.equal(res.statusCode, 403)
  assert.equal(res.body.success, false)
})
