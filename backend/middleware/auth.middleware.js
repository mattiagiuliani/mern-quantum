import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'

// ─── in-memory user cache ─────────────────────────────────────────────────────
// Avoids one DB round-trip per authenticated request.
// TTL: 60 s · Max entries: 500 (LRU eviction by insertion order)

const USER_CACHE_TTL_MS = 60_000
const USER_CACHE_MAX    = 500

const _cache = new Map()

function cacheGet(id) {
  const entry = _cache.get(id)
  if (!entry) return null
  if (Date.now() - entry.ts > USER_CACHE_TTL_MS) { _cache.delete(id); return null }
  return entry.user
}

function cacheSet(id, user) {
  if (_cache.size >= USER_CACHE_MAX) {
    // evict oldest (first inserted)
    _cache.delete(_cache.keys().next().value)
  }
  _cache.set(id, { user, ts: Date.now() })
}

/** Exposed for tests only — clears the entire cache. */
export function _clearUserCache() { _cache.clear() }

// ─── middleware ───────────────────────────────────────────────────────────────

/**
 * Express middleware — verifies the JWT stored in the `token` HttpOnly cookie.
 * On success injects `req.user` as `{ id, username, email, createdAt }` and calls `next()`.
 * Re-fetches the user from DB to detect deleted accounts even with a valid token.
 * Responds 401 on missing token, invalid signature, or expired session.
 *
 * @type {import('express').RequestHandler}
 */
export const protect = async (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in.',
    })
  }

  try {
    // Verifica firma e scadenza
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check cache first; fall back to DB (handles deleted accounts)
    let safeUser = cacheGet(decoded.id)
    if (!safeUser) {
      const user = await User.findById(decoded.id)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please log in again.',
        })
      }
      safeUser = user.toSafeObject()
      cacheSet(decoded.id, safeUser)
    }

    req.user = safeUser
    next()
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid token.'

    return res.status(401).json({ success: false, message })
  }
}