import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,   // prevent MongoMemoryServer port conflicts between test files
    hookTimeout: 120000, // allow slower MongoMemoryServer startup/download in CI
    testTimeout: 10000,  // 10 seconds for individual tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['**/*.js'],
      exclude: [
        'node_modules/**',
        'vitest.config.js',
        'server.js',       // process entrypoint — covered by E2E
        'server.e2e.js',
        'app.js',          // Express wiring — covered by integration tests
        'config/db.js',    // MongoDB connection — infrastructure, not unit-testable
        'config/sentry.js',// Sentry SDK init — infrastructure, not unit-testable
      ],
      thresholds: {
        lines:     80,
        functions: 80,
        branches:  75,
      },
    },
  },
})
