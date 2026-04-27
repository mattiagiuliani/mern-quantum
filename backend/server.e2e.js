/**
 * E2E test backend entry point.
 *
 * Starts an in-memory MongoDB instance via MongoMemoryServer so that
 * Playwright E2E tests run against a real Express + MongoDB stack without
 * requiring an external database.  The server listens on PORT (default 3001)
 * so the frontend dev-server (VITE_API_URL=http://localhost:3001/api/v1)
 * talks to it without any reconfiguration.
 *
 * Usage (via playwright.config.js webServer):
 *   node backend/server.e2e.js
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { createApp } from './app.js'

// ─── Minimal env for the app (overridable via real env vars) ────────────────

process.env.JWT_SECRET         ??= 'e2e-test-jwt-secret-32-chars-min!!'
process.env.JWT_REFRESH_SECRET ??= 'e2e-test-refresh-secret-32chars!!'
process.env.JWT_EXPIRES_IN     ??= '15m'
process.env.CORS_ORIGIN        ??= 'http://localhost:5173'
process.env.NODE_ENV           ??= 'test'

const PORT = Number(process.env.PORT) || 3001

// ─── Boot sequence ───────────────────────────────────────────────────────────

const mongod = await MongoMemoryServer.create()
await mongoose.connect(mongod.getUri())

const app = createApp()
const server = app.listen(PORT, () => {
  // Playwright webServer waits for this port; also log for debugging.
  console.log(`[e2e-backend] ready on :${PORT}`)
})

// ─── Graceful shutdown ───────────────────────────────────────────────────────

async function shutdown() {
  server.close(async () => {
    await mongoose.disconnect()
    await mongod.stop()
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT',  shutdown)
