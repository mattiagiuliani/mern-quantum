import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/*.e2e.js'],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
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
      // Frontend dev server — serves the React SPA with VITE_API_URL → localhost:3001
      command: 'npm run dev:frontend',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Real backend (MongoMemoryServer) for auth.real.e2e.js and any future real tests.
      // Mocked tests (page.route) are unaffected whether this server is running or not.
      command: 'node backend/server.e2e.js',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
