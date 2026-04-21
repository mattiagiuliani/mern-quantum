import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'

/**
 * Middleware protect — verifica il JWT nel cookie HttpOnly.
 * Se valido, inietta req.user = { id, username, email }.
 * Usato su tutte le route che richiedono autenticazione.
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

    // Recupera l'utente aggiornato dal DB
    // (se l'account è stato eliminato il token rimane valido senza questo check)
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.',
      })
    }

    req.user = user.toSafeObject()
    next()
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid token.'

    return res.status(401).json({ success: false, message })
  }
}