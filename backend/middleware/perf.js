import logger from '../utils/logger.js'

export function perfLogger(req, res, next) {
  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - startedAt
    const durationMs = Number(durationNs) / 1_000_000
    const roundedMs = Math.round(durationMs * 100) / 100

    const payload = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: roundedMs,
    }

    if (roundedMs >= 500) {
      logger.warn(payload, 'Slow request')
    } else {
      logger.info(payload, 'Request completed')
    }
  })

  next()
}
