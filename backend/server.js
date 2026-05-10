import 'dotenv/config'
import { connectDB } from './config/db.js'
import { createApp } from './app.js'
import logger from './utils/logger.js'

// ─── env validation ──────────────────────────────────────────────────────────

const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI', 'CORS_ORIGIN']
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k])
if (missingEnv.length > 0) {
  logger.fatal({ missingEnv }, 'Missing required env vars')
  process.exit(1)
}

const PORT = Number(process.env.PORT) || 3001

const startServer = async () => {
  try {
    await connectDB()
    const app = createApp()
    app.listen(PORT, () => logger.info({ port: PORT }, 'Server started'))
  } catch (error) {
    logger.fatal({ err: error }, 'Server failed to start')
    process.exit(1)
  }
}

startServer()
