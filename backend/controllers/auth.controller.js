import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'
import { ok, fail } from '../utils/respond.js'
import logger from '../utils/logger.js'
import { captureBackendError } from '../config/sentry.js'

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex')

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Create and sign a JWT access token for the given user ID.
 * @param {string} userId
 * @returns {string} signed token
 */
const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  })

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  })

/**
 * Set HttpOnly cookies with the access/refresh tokens and respond with user data.
 * @param {object} user  - Mongoose document
 * @param {number} statusCode
 * @param {object} res
 */
const sendTokenResponse = async (user, statusCode, res) => {
  const accessToken  = signAccessToken(user._id)
  const refreshToken = signRefreshToken(user._id)

  await User.findByIdAndUpdate(user._id, { refreshTokenHash: hashToken(refreshToken) })

  const secure = process.env.NODE_ENV === 'production'
  res
    .status(statusCode)
    .cookie('token', accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    })
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    .json({ success: true, user: user.toSafeObject() })
}

// ─── controller ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Body: { username, email, password }
 * Validation is handled upstream by the Zod middleware (registerSchema).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response|void>}
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Skip pre-flight uniqueness queries — rely on the unique indexes instead.
    // A concurrent duplicate will produce an E11000 error caught below, avoiding
    // the TOCTOU race that two separate findOne() calls would introduce.
    const user = await User.create({ username, email, password })
    await sendTokenResponse(user, 201, res)
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field'
      return fail(res, `${field} already in use`, 409)
    }
    captureBackendError(err, { handler: 'register' })
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message)
      return fail(res, messages.join('. '))
    }
    logger.error({ err }, '[register]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response|void>}
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Guard prevents TypeError from email.toLowerCase() when Zod middleware is bypassed.
    if (!email || !password) {
      return fail(res, 'Email and password are required')
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) return fail(res, 'Invalid credentials', 401)

    if (user.isLocked()) {
      const retryAfterSecs = Math.ceil((user.lockUntil - Date.now()) / 1000)
      res.set('Retry-After', String(retryAfterSecs))
      return fail(res, 'Account temporarily locked. Too many failed attempts.', 429)
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      await user.incrementLoginAttempts()
      return fail(res, 'Invalid credentials', 401)
    }

    // Reset lockout on successful login
    if (user.loginAttempts > 0) {
      await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } })
    }

    await sendTokenResponse(user, 200, res)
  } catch (err) {
    captureBackendError(err, { handler: 'login' })
    logger.error({ err }, '[login]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * POST /api/v1/auth/logout
 * Clears both access and refresh token cookies.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
 */
export const logout = async (req, res) => {
  const token = req.cookies?.refreshToken
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
      await User.findByIdAndUpdate(decoded.id, { $unset: { refreshTokenHash: 1 } })
    } catch {
      // Token expired or invalid — proceed to clear cookies regardless
    }
  }
  const secure = process.env.NODE_ENV === 'production'
  res
    .status(200)
    .clearCookie('token', { httpOnly: true, secure, sameSite: 'strict' })
    .clearCookie('refreshToken', { httpOnly: true, secure, sameSite: 'strict' })
    .json({ success: true, message: 'Logout successful' })
}

/**
 * POST /api/v1/auth/refresh
 * Issues a new access token using the refreshToken cookie.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response|void>}
 */
export const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) return fail(res, 'No refresh token', 401)

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded.id).select('+refreshTokenHash')
    if (!user) return fail(res, 'User not found', 401)

    // Reject if token was invalidated (e.g. after logout or rotation)
    if (user.refreshTokenHash !== hashToken(token)) {
      return fail(res, 'Invalid or expired refresh token', 401)
    }

    const accessToken = signAccessToken(user._id)
    const newRefreshToken = signRefreshToken(user._id)
    await User.findByIdAndUpdate(user._id, { refreshTokenHash: hashToken(newRefreshToken) })

    const secure = process.env.NODE_ENV === 'production'
    res
      .status(200)
      .cookie('token', accessToken, {
        httpOnly: true,
        secure,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      })
      .cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })
      .json({ success: true })
  } catch {
    return fail(res, 'Invalid or expired refresh token', 401)
  }
}

/**
 * GET /api/v1/auth/me
 * Requires the protect middleware — req.user is already verified and cached.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {import('express').Response}
 */
export const getMe = (req, res) => ok(res, { user: req.user })
