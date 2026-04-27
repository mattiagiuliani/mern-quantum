const DEFAULT_TTL_MS = 15 * 60 * 1000  // 15 minutes

/**
 * Simple in-process TTL cache backed by a Map.
 * Designed for single-instance deployments; not shared across replicas.
 */
class TtlCache {
  /** @type {Map<string, {value: unknown, expiresAt: number}>} */
  #store = new Map()

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
