/**
 * Unit tests for the axios interceptor in apiClient.js.
 *
 * What we verify:
 *  - Auth-probe and already-retried requests bypass the interceptor
 *  - A 401 triggers exactly one refresh and retries the original request
 *  - Concurrent 401s are queued; all retry after a single refresh
 *  - A failed refresh rejects every queued request and redirects to /login
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// vi.hoisted: these run before any import so the mock factory can reference them
const mocks = vi.hoisted(() => {
  const interceptorFn = { current: null }
  const instance = Object.assign(vi.fn(), {
    interceptors: {
      response: {
        use: vi.fn((_, fn) => { interceptorFn.current = fn }),
      },
    },
    post:   vi.fn(),
    get:    vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  })
  return { instance, interceptorFn }
})

vi.mock('axios', () => ({
  default: { create: vi.fn(() => mocks.instance) },
}))

// Import triggers module evaluation → axios.create() → interceptor registration
import './apiClient'

// ─── helpers ──────────────────────────────────────────────────────────────────

function make401(url = '/circuits/run', isRetry = false) {
  return { response: { status: 401 }, config: { url, _retry: isRetry } }
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('apiClient refresh interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('passes through 401s from /auth/me without refreshing', async () => {
    const err = make401('/auth/me')
    await expect(mocks.interceptorFn.current(err)).rejects.toBe(err)
    expect(mocks.instance.post).not.toHaveBeenCalled()
  })

  it('passes through 401s from /auth/refresh without refreshing', async () => {
    const err = make401('/auth/refresh')
    await expect(mocks.interceptorFn.current(err)).rejects.toBe(err)
    expect(mocks.instance.post).not.toHaveBeenCalled()
  })

  it('passes through already-retried requests without refreshing', async () => {
    const err = make401('/circuits/run', true)
    await expect(mocks.interceptorFn.current(err)).rejects.toBe(err)
    expect(mocks.instance.post).not.toHaveBeenCalled()
  })

  it('calls /auth/refresh once then retries the original request', async () => {
    mocks.instance.post.mockResolvedValueOnce({})                        // refresh ok
    mocks.instance.mockResolvedValueOnce({ data: { counts: {}, shots: 1 } }) // retry ok

    const result = await mocks.interceptorFn.current(make401())

    expect(mocks.instance.post).toHaveBeenCalledWith('/auth/refresh')
    expect(mocks.instance.post).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ data: { counts: {}, shots: 1 } })
  })

  it('queues concurrent 401s and retries all after a single refresh', async () => {
    let resolveRefresh
    mocks.instance.post.mockReturnValueOnce(new Promise(r => { resolveRefresh = r }))
    mocks.instance
      .mockResolvedValueOnce({ data: 'retry-1' })
      .mockResolvedValueOnce({ data: 'retry-2' })

    const p1 = mocks.interceptorFn.current(make401('/circuits/run'))
    const p2 = mocks.interceptorFn.current(make401('/templates'))

    // Only one refresh in flight despite two 401s
    expect(mocks.instance.post).toHaveBeenCalledTimes(1)

    resolveRefresh({})
    const [r1, r2] = await Promise.all([p1, p2])

    expect(r1).toEqual({ data: 'retry-1' })
    expect(r2).toEqual({ data: 'retry-2' })
  })

  it('rejects all queued requests and redirects to /login on refresh failure', async () => {
    vi.stubGlobal('location', { href: '' })

    const refreshError = new Error('refresh failed')
    let rejectRefresh
    mocks.instance.post.mockReturnValueOnce(new Promise((_, r) => { rejectRefresh = r }))

    const p1 = mocks.interceptorFn.current(make401('/circuits/run'))
    const p2 = mocks.interceptorFn.current(make401('/templates'))

    rejectRefresh(refreshError)

    await expect(p1).rejects.toBe(refreshError)
    await expect(p2).rejects.toBe(refreshError)
    expect(window.location.href).toBe('/login')
  })
})
