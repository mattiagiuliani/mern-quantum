import test from 'node:test'
import assert from 'node:assert/strict'
import { register, login, getMe } from './auth.controller.js'
import User from '../models/User.model.js'

// JWT_SECRET must be set before any call to signToken
process.env.JWT_SECRET = 'test-secret-key'
process.env.JWT_EXPIRES_IN = '7d'

// ─── helpers ─────────────────────────────────────────────────────────────────

function createRes() {
  return {
    statusCode: 200,
    body: null,
    _cookies: {},
    status(code) {
      this.statusCode = code
      return this
    },
    cookie(name, value) {
      this._cookies[name] = value
      return this
    },
    clearCookie(name) {
      delete this._cookies[name]
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

const FAKE_USER = {
  _id: '507f191e810c19729de860ea',
  username: 'testuser',
  email: 'test@example.com',
  toSafeObject() {
    return { id: this._id, username: this.username, email: this.email }
  },
  comparePassword: async (pw) => pw === 'correct-password',
}

// ─── register ────────────────────────────────────────────────────────────────

test('register rejects missing username', async () => {
  const req = { body: { email: 'a@b.com', password: '123456' } }
  const res = createRes()
  await register(req, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('register rejects missing email', async () => {
  const req = { body: { username: 'alice', password: '123456' } }
  const res = createRes()
  await register(req, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('register rejects missing password', async () => {
  const req = { body: { username: 'alice', email: 'a@b.com' } }
  const res = createRes()
  await register(req, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('register rejects duplicate email', async (t) => {
  const original = User.findOne
  // first call checks email → returns existing user
  User.findOne = async ({ email }) => (email ? FAKE_USER : null)
  t.after(() => { User.findOne = original })

  const req = { body: { username: 'newuser', email: 'test@example.com', password: 'secret123' } }
  const res = createRes()
  await register(req, res)
  assert.equal(res.statusCode, 409)
  assert.equal(res.body.success, false)
})

test('register rejects duplicate username', async (t) => {
  const original = User.findOne
  let callCount = 0
  // first call (email check) → null, second call (username check) → found
  User.findOne = async () => (++callCount === 1 ? null : FAKE_USER)
  t.after(() => { User.findOne = original })

  const req = { body: { username: 'testuser', email: 'new@example.com', password: 'secret123' } }
  const res = createRes()
  await register(req, res)
  assert.equal(res.statusCode, 409)
  assert.equal(res.body.success, false)
})

test('register creates user, sets cookie and returns safe user on success', async (t) => {
  const originalFindOne = User.findOne
  const originalCreate = User.create
  User.findOne = async () => null
  User.create = async () => FAKE_USER
  t.after(() => {
    User.findOne = originalFindOne
    User.create = originalCreate
  })

  const req = { body: { username: 'testuser', email: 'test@example.com', password: 'secret123' } }
  const res = createRes()
  await register(req, res)
  assert.equal(res.statusCode, 201)
  assert.equal(res.body.success, true)
  assert.equal(res.body.user.username, 'testuser')
  assert.ok(res._cookies.token, 'JWT cookie should be set')
  assert.equal(res.body.user.password, undefined, 'password must not be in response')
})

// ─── login ───────────────────────────────────────────────────────────────────

test('login rejects missing email', async () => {
  const req = { body: { password: 'secret' } }
  const res = createRes()
  await login(req, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('login rejects missing password', async () => {
  const req = { body: { email: 'test@example.com' } }
  const res = createRes()
  await login(req, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('login returns 401 when user not found', async (t) => {
  const original = User.findOne
  User.findOne = () => ({ select: async () => null })
  t.after(() => { User.findOne = original })

  const req = { body: { email: 'nobody@example.com', password: 'whatever' } }
  const res = createRes()
  await login(req, res)
  assert.equal(res.statusCode, 401)
  assert.equal(res.body.success, false)
})

test('login returns 401 on wrong password', async (t) => {
  const original = User.findOne
  User.findOne = () => ({ select: async () => FAKE_USER })
  t.after(() => { User.findOne = original })

  const req = { body: { email: 'test@example.com', password: 'wrong-password' } }
  const res = createRes()
  await login(req, res)
  assert.equal(res.statusCode, 401)
  assert.equal(res.body.success, false)
})

test('login sets cookie and returns safe user on success', async (t) => {
  const original = User.findOne
  User.findOne = () => ({ select: async () => FAKE_USER })
  t.after(() => { User.findOne = original })

  const req = { body: { email: 'test@example.com', password: 'correct-password' } }
  const res = createRes()
  await login(req, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
  assert.ok(res._cookies.token, 'JWT cookie should be set')
  assert.equal(res.body.user.username, 'testuser')
  assert.equal(res.body.user.password, undefined, 'password must not be in response')
})

// ─── getMe ───────────────────────────────────────────────────────────────────

test('getMe returns 404 when user no longer exists', async (t) => {
  const original = User.findById
  const originalConsoleError = console.error
  console.error = () => {}
  User.findById = async () => null
  t.after(() => {
    User.findById = original
    console.error = originalConsoleError
  })

  const req = { user: { id: '507f191e810c19729de860ea' } }
  const res = createRes()
  await getMe(req, res)
  assert.equal(res.statusCode, 404)
  assert.equal(res.body.success, false)
})

test('getMe returns safe user when authenticated', async (t) => {
  const original = User.findById
  User.findById = async () => FAKE_USER
  t.after(() => { User.findById = original })

  const req = { user: { id: '507f191e810c19729de860ea' } }
  const res = createRes()
  await getMe(req, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.user.username, 'testuser')
  assert.equal(res.body.user.password, undefined, 'password must not be in response')
})

test('getMe returns 500 on unexpected error', async (t) => {
  const original = User.findById
  const originalConsoleError = console.error
  console.error = () => {}
  User.findById = async () => { throw new Error('db failure') }
  t.after(() => {
    User.findById = original
    console.error = originalConsoleError
  })

  const req = { user: { id: '507f191e810c19729de860ea' } }
  const res = createRes()
  await getMe(req, res)
  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})
