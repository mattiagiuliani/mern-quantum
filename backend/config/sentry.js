import * as Sentry from '@sentry/node'

let initialized = false

export function initSentry() {
  const dsn = process.env.SENTRY_DSN_BACKEND
  if (!dsn || initialized) return false

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  })

  initialized = true
  return true
}

export function captureBackendError(err, context = {}) {
  if (!initialized) return
  Sentry.captureException(err, { extra: context })
}

export function sentryRequestContext(req, _res, next) {
  if (initialized && req.user?.id) {
    Sentry.setUser({ id: String(req.user.id) })
  }
  next()
}
