import * as Sentry from '@sentry/react'

let initialized = false

export function initFrontendSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN_FRONTEND
  if (!dsn || initialized) return false

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  })

  initialized = true
  return true
}

export function captureFrontendError(error, extra = {}) {
  if (!initialized) return
  Sentry.captureException(error, { extra })
}
