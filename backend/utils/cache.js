const DEFAULT_TTL_MS  = 15 * 60 * 1000  // 15 minutes
const DEFAULT_MAX_SIZE = 1_000

/**
 * Simple in-process TTL cache backed by a Map.
 * Designed for single-instance deployments; not shared across replicas.
 */
class TtlCache {
  /** @type {Map<string, {value: unknown, expiresAt: number}>} */
  #store = new Map()
  #maxSize

  /**
   * @param {object} [opts]
   * @param {number} [opts.maxSize=1000] Maximum number of live entries. Oldest-inserted
   *   entry is evicted (FIFO) when the limit is reached.
   */
  constructor({ maxSize = DEFAULT_MAX_SIZE } = {}) {
    this.#maxSize = maxSize
  }

  /**
   * @param {string} key
   * @returns {unknown} Cached value, or undefined if absent / expired
   */
  get(key) {
    const entry = this.#store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.#store.delete(key)
      return undefined
    }
    return entry.value
  }

  /**
   * @param {string} key
   * @param {unknown} value
   * @param {number} [ttlMs]
   */
  set(key, value, ttlMs = DEFAULT_TTL_MS) {
    if (this.#store.size >= this.#maxSize) {
      // Evict oldest (first inserted) — FIFO
      this.#store.delete(this.#store.keys().next().value)
    }
    this.#store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  /**
   * Delete all keys that begin with `prefix`.
   * @param {string} prefix
   */
  invalidate(prefix) {
    for (const key of this.#store.keys()) {
      if (key.startsWith(prefix)) this.#store.delete(key)
    }
  }

  clear() { this.#store.clear() }

  get size() { return this.#store.size }
}

/** Shared cache instance for GET /api/v1/templates/public */
export const publicTemplatesCache = new TtlCache()
