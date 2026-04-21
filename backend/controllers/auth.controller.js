import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Crea e firma un JWT con l'id utente.
 * @param {string} userId
 * @returns {string} token firmato
 */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  })

/**
 * Imposta il cookie HttpOnly con il token e risponde con i dati utente.
 * @param {object} user  - documento Mongoose
 * @param {number} statusCode
 * @param {object} res
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id)

  const cookieOptions = {
    httpOnly: true,                         // non accessibile da JS lato client
    secure: process.env.NODE_ENV === 'production', // HTTPS solo in prod
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,       // 7 giorni in ms
  }

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      user: user.toSafeObject(),
    })
}

// ─── controller ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { username, email, password }
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Validazione campi obbligatori
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required',
      })
    }

    // Controlla se l'email è già registrata
    const existingEmail = await User.findOne({ email: email.toLowerCase() })
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use',
      })
    }

    // Controlla se lo username è già preso
    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username already in use',
      })
    }

    // Crea utente — il pre-save hook di Mongoose fa l'hash della password
    const user = await User.create({ username, email, password })

    sendTokenResponse(user, 201, res)
  } catch (err) {
    // Gestisce errori di validazione Mongoose (es. email malformata, pw troppo corta)
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message)
      return res.status(400).json({ success: false, message: messages.join('. ') })
    }
    console.error('[register]', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
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
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    // .select('+password') perché il campo ha select:false nel modello
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

    if (!user) {
      // Messaggio generico: non rivela se l'email esiste o no (sicurezza)
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    sendTokenResponse(user, 200, res)
  } catch (err) {
    console.error('[login]', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * POST /api/auth/logout
 * Pulisce il cookie del token.
 * Non servono dati nel body — il middleware JWT ha già verificato il token.
 */
export const logout = async (req, res) => {
  res
    .status(200)
    .clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })
    .json({ success: true, message: 'Logout successful' })
}

/**
 * GET /api/auth/me
 * Richiede il middleware protect — req.user.id è già verificato.
 */
export const getMe = async (req, res) => {
  try {
    // req.user viene iniettato dal middleware auth dopo la verifica JWT
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    res.status(200).json({ success: true, user: user.toSafeObject() })
  } catch (err) {
    console.error('[getMe]', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}