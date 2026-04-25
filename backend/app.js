/**
 * Express app factory — separated from startup so integration tests
 * can import it without triggering connectDB() or process.exit().
 */
import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import pinoHttp from 'pino-http'
import logger from './utils/logger.js'
import authRoutes from './routes/auth.routes.js'
import circuitRoutes from './routes/circuit.routes.js'
import templateRoutes from './routes/template.routes.js'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
})

const simulationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many simulation requests. Slow down.' },
})

export function createApp() {
  const app = express()

  app.use(pinoHttp({ logger }))
  app.use(helmet())
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174').split(',').map(o => o.trim())
  app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)), credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  app.use('/api/auth', authLimiter, authRoutes)
  app.use('/api/circuits/run', simulationLimiter)
  app.use('/api/circuits/applyGate', simulationLimiter)
  app.use('/api/circuits', circuitRoutes)
  app.use('/api/templates', templateRoutes)

  return app
}
