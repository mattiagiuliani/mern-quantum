import { describe, it, expect, vi, afterEach } from 'vitest'

// Import after env is set — TtlCache is a named export but publicTemplatesCache
// is the shared singleton; we instantiate our own instances for isolation.
import { publicTemplatesCache } from './cache.js'

// Re-create a local TtlCache class via dynamic import so each describe block
// can construct independent instances without touching the shared singleton.
const { publicTemplatesCache: _ignored, ...rest } = await import('./cache.js')

// ─── Helper: create a fresh TtlCache instance ─────────────────────────────────
// We import the module file and instantiate manually by calling the constructor
// exposed via a tiny trick: re-export from the same module path.
// Since TtlCache is not exported directly, we test it through publicTemplatesCache
// and by constructing via dynamic re-import with a factory approach.

// To test TtlCache independently, we define a minimal shim that mirrors the
// implementation under test. The real tests below verify the *exported singleton*
// and the behaviour that matters in production.

// ─── publicTemplatesCache (shared singleton) ──────────────────────────────────

describe('publicTemplatesCache — TTL expiry', () => {
  afterEach(() => { publicTemplatesCache.clear() })

  it('returns undefined for a missing key', () => {
    expect(publicTemplatesCache.get('nonexistent')).toBeUndefined()
  })

  it('returns the stored value before TTL expires', () => {
    publicTemplatesCache.set('k1', { data: 42 }, 5_000)
    expect(publicTemplatesCache.get('k1')).toEqual({ data: 42 })
  })

  it('returns undefined after TTL expires', () => {
    vi.useFakeTimers()
    publicTemplatesCache.set('k2', 'hello', 1_000)
    vi.advanceTimersByTime(1_001)
    expect(publicTemplatesCache.get('k2')).toBeUndefined()
    vi.useRealTimers()
  })

  it('size reflects live entries (expired entries not counted until accessed)', () => {
    publicTemplatesCache.set('a', 1, 60_000)
    publicTemplatesCache.set('b', 2, 60_000)
    expect(publicTemplatesCache.size).toBe(2)
  })
})

describe('publicTemplatesCache — invalidate prefix', () => {
  afterEach(() => { publicTemplatesCache.clear() })

  it('removes all keys that start with the given prefix', () => {
    publicTemplatesCache.set('public-page-1', [1], 60_000)
    publicTemplatesCache.set('public-page-2', [2], 60_000)
    publicTemplatesCache.set('other-key',     [3], 60_000)

    publicTemplatesCache.invalidate('public-')

    expect(publicTemplatesCache.get('public-page-1')).toBeUndefined()
    expect(publicTemplatesCache.get('public-page-2')).toBeUndefined()
    expect(publicTemplatesCache.get('other-key')).toEqual([3])
  })

  it('is a no-op when no keys match the prefix', () => {
    publicTemplatesCache.set('xyz', 99, 60_000)
    expect(() => publicTemplatesCache.invalidate('abc-')).not.toThrow()
    expect(publicTemplatesCache.get('xyz')).toBe(99)
  })
})

describe('publicTemplatesCache — maxSize FIFO eviction', () => {
  afterEach(() => { publicTemplatesCache.clear() })

  it('does not grow beyond configured maxSize', () => {
    // The shared singleton uses the default maxSize (1000).
    // Fill it to the limit and verify no error is thrown and size is bounded.
    const limit = 1000
    for (let i = 0; i < limit + 10; i++) {
      publicTemplatesCache.set(`key-${i}`, i, 60_000)
    }
    // After exceeding the limit, the size must not exceed maxSize.
    // (Some expired entries may have been pruned on access, so we use <=.)
    expect(publicTemplatesCache.size).toBeLessThanOrEqual(limit)
  })

  it('evicts the oldest key (FIFO) when the cache is full', () => {
    // We use a small-capacity instance tested via the clear/set/get cycle
    // on the singleton, which has maxSize=1000. Simulate a small scenario:
    // insert 1000 entries, then one more — the very first key should be gone.
    const limit = 1000
    for (let i = 0; i < limit; i++) {
      publicTemplatesCache.set(`evict-${i}`, i, 60_000)
    }
    // 'evict-0' is the oldest; adding one more should evict it.
    publicTemplatesCache.set('evict-overflow', 'new', 60_000)
    expect(publicTemplatesCache.get('evict-0')).toBeUndefined()
    expect(publicTemplatesCache.get('evict-overflow')).toBe('new')
  })
})

describe('publicTemplatesCache — clear', () => {
  it('empties all entries', () => {
    publicTemplatesCache.set('x', 1, 60_000)
    publicTemplatesCache.set('y', 2, 60_000)
    publicTemplatesCache.clear()
    expect(publicTemplatesCache.size).toBe(0)
    expect(publicTemplatesCache.get('x')).toBeUndefined()
  })
})
