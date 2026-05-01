import { describe, it, afterEach, expect } from 'vitest'
import { register, login, getMe } from './auth.controller.js'
import User from '../models/User.model.js'

// JWT env vars must be set before any call to signToken
process.env.JWT_SECRET         = 'test-secret-key-aaaaaaaaaaaaaa'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-bbbbbbbbbbb'
process.env.JWT_EXPIRES_IN     = '15m'

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
  loginAttempts: 0,
  toSafeObject() {
    return { id: this._id, username: this.username, email: this.email }
  },
  comparePassword: async (pw) => pw === 'correct-password',
  isLocked: () => false,
  incrementLoginAttempts: async () => {},
  updateOne: async () => {},
}

// ─── register ────────────────────────────────────────────────────────────────

describe('register', () => {
  it('rejects missing username', async () => {
    const req = { body: { email: 'a@b.com', password: '123456' } }
    const res = createRes()
    await register(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects missing email', async () => {
    const req = { body: { username: 'alice', password: '123456' } }
    const res = createRes()
    await register(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects missing password', async () => {
    const req = { body: { username: 'alice', email: 'a@b.com' } }
    const res = createRes()
    await register(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects duplicate field via E11000 with 409', async () => {
    const original = User.create
    const e11000 = Object.assign(new Error('E11000'), { code: 11000, keyPattern: { email: 1 } })
    User.create = async () => { throw e11000 }
    try {
      const req = { body: { username: 'newuser', email: 'test@example.com', password: 'secret123' } }
      const res = createRes()
      await register(req, res)
      expect(res.statusCode).toBe(409)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/email/)
    } finally {
      User.create = original
    }
  })

  it('creates user, sets cookie and returns safe user on success', async () => {
    const originalCreate            = User.create
    const originalFindByIdAndUpdate = User.findByIdAndUpdate
    User.create            = async () => FAKE_USER
    User.findByIdAndUpdate = async () => {}
    try {
      const req = { body: { username: 'testuser', email: 'test@example.com', password: 'secret123' } }
      const res = createRes()
      await register(req, res)
      expect(res.statusCode).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.user.username).toBe('testuser')
      expect(res._cookies.token).toBeTruthy()
      expect(res.body.user.password).toBeUndefined()
    } finally {
      User.create            = originalCreate
      User.findByIdAndUpdate = originalFindByIdAndUpdate
    }
  })
})

// ─── login ───────────────────────────────────────────────────────────────────

describe('login', () => {
  it('rejects missing email', async () => {
    const req = { body: { password: 'secret' } }
    const res = createRes()
    await login(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects missing password', async () => {
    const req = { body: { email: 'test@example.com' } }
    const res = createRes()
    await login(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 401 when user not found', async () => {
    const original = User.findOne
    User.findOne = () => ({ select: async () => null })
    try {
      const req = { body: { email: 'nobody@example.com', password: 'whatever' } }
      const res = createRes()
      await login(req, res)
      expect(res.statusCode).toBe(401)
      expect(res.body.success).toBe(false)
    } finally {
      User.findOne = original
    }
  })

  it('sets cookie and returns safe user on success', async () => {
    const originalFindOne           = User.findOne
    const originalFindByIdAndUpdate = User.findByIdAndUpdate
    User.findOne           = () => ({ select: async () => FAKE_USER })
    User.findByIdAndUpdate = async () => {}
    try {
      const req = { body: { email: 'test@example.com', password: 'correct-password' } }
      const res = createRes()
      await login(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res._cookies.token).toBeTruthy()
      expect(res.body.user.username).toBe('testuser')
      expect(res.body.user.password).toBeUndefined()
    } finally {
      User.findOne           = originalFindOne
      User.findByIdAndUpdate = originalFindByIdAndUpdate
    }
  })
})

// ─── getMe ───────────────────────────────────────────────────────────────────

describe('getMe', () => {
  it('returns req.user directly without a DB round-trip', () => {
    const safeUser = { id: '507f191e810c19729de860ea', username: 'testuser', email: 'test@example.com' }
    const req = { user: safeUser }
    const res = createRes()
    getMe(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.user).toBe(safeUser)
  })
})

