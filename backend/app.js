/**
 * Express app factory — separated from startup so integration tests
 * can import it without triggering connectDB() or process.exit().
 */
import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import pinoHttp from 'pino-http'
import openApiSpec from './openapi.json' with { type: 'json' }
import logger from './utils/logger.js'
import { initSentry, sentryRequestContext } from './config/sentry.js'
import { perfLogger } from './middleware/perf.js'
import authRoutes from './routes/auth.routes.js'
import circuitRoutes from './routes/circuit.routes.js'
import templateRoutes from './routes/template.routes.js'

/**
 * Extract user ID from the access cookie for per-user rate limit keying.
 * Falls back to IP for unauthenticated requests.
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
function userAwareKey(req) {
  try {
    const token = req.cookies?.token
    if (token) {
      const { id } = jwt.verify(token, process.env.JWT_SECRET)
      if (id) return String(id)
    }
  } catch {}
  return ipKeyGenerator(req)
}

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
  keyGenerator: userAwareKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many simulation requests. Slow down.' },
})

export function createApp() {
  const app = express()

  // Required for express-rate-limit to read the real client IP when behind nginx/proxy
  app.set('trust proxy', 1)

  initSentry()

  app.use(pinoHttp({ logger }))
  app.use(perfLogger)
  app.use(sentryRequestContext)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc:     ["'self'"],
          scriptSrc:      ["'self'", 'https://unpkg.com'],
          styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
          fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
          imgSrc:         ["'self'", 'data:', 'https://unpkg.com'],
          connectSrc:     ["'self'"],
          objectSrc:      ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  )
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174').split(',').map(o => o.trim())
  app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)), credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  // Chrome DevTools automatically probes this endpoint; return an empty JSON
  // so the browser doesn't log a 404 or a CSP violation.
  app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => res.json([]))

  // Machine-readable OpenAPI 3.1 spec
  app.get('/api/v1/openapi.json', (_req, res) => res.json(openApiSpec))

  // Interactive Swagger UI — available in all environments at /api/v1/docs
  app.get('/api/v1/docs', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>mern-quantum · API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #080C14; }
    .swagger-ui .topbar { background: #0f172a; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/v1/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      tryItOutEnabled: true,
      withCredentials: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
    })
  </script>
</body>
</html>`)
  })

  app.use('/api/v1/auth', authLimiter, authRoutes)
  app.use('/api/v1/circuits/run', simulationLimiter)
  app.use('/api/v1/circuits/applyGate', simulationLimiter)
  app.use('/api/v1/circuits', circuitRoutes)
  app.use('/api/v1/templates', templateRoutes)

  return app
}
