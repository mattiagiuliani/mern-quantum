/**
 * Real end-to-end auth tests.
 *
 * These tests do NOT use page.route() mocks.  Every fetch reaches the actual
 * backend (MongoMemoryServer-backed when started via playwright.config.js).
 *
 * Run in isolation:
 *   npx playwright test auth.real.e2e.js --project=chromium
 */
import { test, expect } from '@playwright/test'

// Random suffix so each test run uses a unique account and is idempotent
// whether the backend is a fresh MongoMemoryServer or an existing dev instance.
const uid  = Date.now().toString(36)
const USER = {
  username: `e2e_${uid}`,
  email:    `e2e_${uid}@example.com`,
  password: 'Abcdef1!',
}

// ─── Registration ─────────────────────────────────────────────────────────────

test('register → redirects to circuit-builder', async ({ page }) => {
  await page.goto('/register')

  await page.getByTestId('register-username').fill(USER.username)
  await page.getByTestId('register-email').fill(USER.email)
  await page.getByTestId('register-password').fill(USER.password)
  await page.getByTestId('register-submit').click()

  // After successful registration the app navigates to the builder
  await expect(page).toHaveURL(/\/circuit-builder/, { timeout: 10_000 })
  await expect(page.getByTestId('builder-run-panel')).toBeVisible()
})

// ─── Login ────────────────────────────────────────────────────────────────────

test('login with wrong password → shows error, stays on /login', async ({ page }) => {
  // Register the account first via the API so the test is independent of order
  await page.request.post('/api/v1/auth/register', {
    data: { username: USER.username, email: USER.email, password: USER.password },
  })

  await page.goto('/login')
  await page.getByTestId('login-email').fill(USER.email)
  await page.getByTestId('login-password').fill('WrongPassword1!')
  await page.getByTestId('login-submit').click()

  await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8_000 })
  await expect(page).toHaveURL(/\/login/)
})

test('login with correct credentials → redirects to circuit-builder', async ({ page }) => {
  // Ensure the account exists
  await page.request.post('/api/v1/auth/register', {
    data: { username: USER.username, email: USER.email, password: USER.password },
  })

  await page.goto('/login')
  await page.getByTestId('login-email').fill(USER.email)
  await page.getByTestId('login-password').fill(USER.password)
  await page.getByTestId('login-submit').click()

  await expect(page).toHaveURL(/\/circuit-builder/, { timeout: 10_000 })
  await expect(page.getByTestId('builder-run-panel')).toBeVisible()
})
