/**
 * Unit tests for the protect middleware.
 * Verifies that:
 * 1. Requests without a token are rejected with 401.
 * 2. Requests with an invalid token are rejected with 401.
 * 3. User is fetched from DB on first call, then served from cache on subsequent calls.
 * 4. Cache entries expire after TTL and trigger a fresh DB lookup.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import jwt from 'jsonwebtoken'

process.env.JWT_SECRET         = 'test-secret-key-aaaaaaaaaaaaaa'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-bbbbbbbbbbb'

// Must import AFTER setting env vars
import { protect, _clearUserCache } from './auth.middleware.js'
import User from '../models/User.model.js'

// ─── helpers ──────────────────────────────────────────────────────────────────

const USER_ID = '507f191e810c19729de860ea'
const SAFE_USER = { id: USER_ID, username: 'alice', email: 'alice@example.com', createdAt: new Date() }

function makeToken(id = USER_ID) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' })
}

function makeReq(token) {
  return { cookies: token ? { token } : {} }
}

function makeRes() {
  return {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this },
    json(body)   { this._body   = body;   return this },
  }
}

// ─── tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _clearUserCache()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('protect middleware — auth', () => {
  it('returns 401 when no token provided', async () => {
    const res  = makeRes()
    const next = vi.fn()
    await protect(makeReq(null), res, next)
    expect(res._status).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for invalid token', async () => {
    const res  = makeRes()
    const next = vi.fn()
    await protect(makeReq('not-a-valid-token'), res, next)
    expect(res._status).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when user is not found in DB', async () => {
    vi.spyOn(User, 'findById').mockResolvedValueOnce(null)
    const res  = makeRes()
    const next = vi.fn()
    await protect(makeReq(makeToken()), res, next)
    expect(res._status).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next and injects req.user on valid token', async () => {
    const fakeUser = { toSafeObject: () => SAFE_USER }
    vi.spyOn(User, 'findById').mockResolvedValueOnce(fakeUser)
    const req  = makeReq(makeToken())
    const res  = makeRes()
    const next = vi.fn()
    await protect(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(req.user).toEqual(SAFE_USER)
  })
})

describe('protect middleware — cache', () => {
  it('hits DB only once for two requests with the same token within TTL', async () => {
    const fakeUser = { toSafeObject: () => SAFE_USER }
    const findById = vi.spyOn(User, 'findById').mockResolvedValue(fakeUser)

    const token = makeToken()
    const next  = vi.fn()

    await protect(makeReq(token), makeRes(), next)
    await protect(makeReq(token), makeRes(), next)

    expect(findById).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(2)
  })

  it('re-fetches from DB after cache TTL expires', async () => {
    vi.useFakeTimers()

    const fakeUser = { toSafeObject: () => SAFE_USER }
    const findById = vi.spyOn(User, 'findById').mockResolvedValue(fakeUser)

    const token = makeToken()
    const next  = vi.fn()

    // First call — populates cache
    await protect(makeReq(token), makeRes(), next)
    expect(findById).toHaveBeenCalledTimes(1)

    // Advance past the 60 s TTL
    vi.advanceTimersByTime(61_000)

    // Second call — cache expired, must hit DB again
    await protect(makeReq(token), makeRes(), next)
    expect(findById).toHaveBeenCalledTimes(2)
  })
})
