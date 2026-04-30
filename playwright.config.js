import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/*.e2e.js'],
  timeout: isCI ? 90_000 : 30_000,
  expect: { timeout: isCI ? 15_000 : 5_000 },
  fullyParallel: !isCI,
  workers: isCI ? 1 : undefined,
  retries: isCI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      // In CI: serve the already-built production bundle (no on-demand Vite compilation).
      // Locally: use the dev server with HMR.
      command: isCI
        ? 'cd frontend && npx vite preview --port 5173 --host'
        : 'npm run dev:frontend',
      port: 5173,
      reuseExistingServer: !isCI,
      timeout: isCI ? 180_000 : 120_000,
    },
    {
      // Real backend (MongoMemoryServer) for auth.real.e2e.js and any future real tests.
      // Mocked tests (page.route) are unaffected whether this server is running or not.
      command: 'node backend/server.e2e.js',
      port: 3001,
      reuseExistingServer: !isCI,
      timeout: isCI ? 180_000 : 120_000,
    },
  ],
})
