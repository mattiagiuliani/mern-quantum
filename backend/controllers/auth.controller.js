import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'
import { ok, fail } from '../utils/respond.js'
import logger from '../utils/logger.js'

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Crea e firma un JWT con l'id utente.
 * @param {string} userId
 * @returns {string} token firmato
 */
const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  })

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET + '_refresh', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  })

/**
 * Imposta il cookie HttpOnly con il token e risponde con i dati utente.
 * @param {object} user  - documento Mongoose
 * @param {number} statusCode
 * @param {object} res
 */
const sendTokenResponse = (user, statusCode, res) => {
  const accessToken  = signAccessToken(user._id)
  const refreshToken = signRefreshToken(user._id)

  const secure = process.env.NODE_ENV === 'production'

  res
    .status(statusCode)
    .cookie('token', accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 min
    })
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })
    .json({ success: true, user: user.toSafeObject() })
}

// ─── controller ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { username, email, password }
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return fail(res, 'Username, email and password are required')
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() })
    if (existingEmail) return fail(res, 'Email already in use', 409)

    const existingUsername = await User.findOne({ username })
    if (existingUsername) return fail(res, 'Username already in use', 409)

    const user = await User.create({ username, email, password })
    sendTokenResponse(user, 201, res)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message)
      return fail(res, messages.join('. '))
    }
    logger.error({ err }, '[register]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return fail(res, 'Email and password are required')
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) return fail(res, 'Invalid credentials', 401)

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return fail(res, 'Invalid credentials', 401)

    sendTokenResponse(user, 200, res)
  } catch (err) {
    logger.error({ err }, '[login]')
    return fail(res, 'Internal server error', 500)
  }
}

/**
 * POST /api/auth/logout
 * Clears both access and refresh token cookies.
 */
export const logout = async (req, res) => {
  const secure = process.env.NODE_ENV === 'production'
  res
    .status(200)
    .clearCookie('token', { httpOnly: true, secure, sameSite: 'strict' })
    .clearCookie('refreshToken', { httpOnly: true, secure, sameSite: 'strict' })
    .json({ success: true, message: 'Logout successful' })
}

/**
 * POST /api/auth/refresh
 * Issues a new access token using the refreshToken cookie.
 */
export const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) return fail(res, 'No refresh token', 401)

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET + '_refresh',
    )
    const user = await User.findById(decoded.id)
    if (!user) return fail(res, 'User not found', 401)

    const accessToken = signAccessToken(user._id)
    res
      .status(200)
      .cookie('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      })
      .json({ success: true })
  } catch {
    return fail(res, 'Invalid or expired refresh token', 401)
  }
}

/**
 * GET /api/auth/me
 * Richiede il middleware protect — req.user.id è già verificato.
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return fail(res, 'User not found', 404)
    return ok(res, { user: user.toSafeObject() })
  } catch (err) {
    logger.error({ err }, '[getMe]')
    return fail(res, 'Internal server error', 500)
  }
}