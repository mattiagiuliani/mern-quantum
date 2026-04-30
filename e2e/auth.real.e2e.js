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

const API_BASE = process.env.PW_API_BASE_URL ?? 'http://localhost:3001/api/v1'
const AUTH_REDIRECT_TIMEOUT_MS = 15_000

function isAuthResponse(response, path) {
  return response.request().method() === 'POST' && response.url().includes(`/api/v1/auth/${path}`)
}

function makeUser(prefix) {
  const uid = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  return {
    username: uid,
    email: `${uid}@example.com`,
    password: 'Abcdef1!',
  }
}

// ─── Registration ─────────────────────────────────────────────────────────────

test('register → redirects to circuit-builder', async ({ page }) => {
  const user = makeUser('reg')

  await page.goto('/register')

  await page.getByTestId('register-username').fill(user.username)
  await page.getByTestId('register-email').fill(user.email)
  await page.getByTestId('register-password').fill(user.password)
  const registerResponsePromise = page.waitForResponse((response) => isAuthResponse(response, 'register'))
  await page.getByTestId('register-submit').click()

  const registerResponse = await registerResponsePromise
  expect(registerResponse.ok()).toBeTruthy()

  // After successful registration the app navigates to the builder
  await expect(page).toHaveURL(/\/circuit-builder/, { timeout: AUTH_REDIRECT_TIMEOUT_MS })
  await expect(page.getByTestId('builder-run-panel')).toBeVisible({ timeout: AUTH_REDIRECT_TIMEOUT_MS })
})

// ─── Login ────────────────────────────────────────────────────────────────────

test('login with wrong password → shows error, stays on /login', async ({ page }) => {
  const user = makeUser('wrongpwd')

  // Register the account first via the API so the test is independent of order.
  await page.request.post(`${API_BASE}/auth/register`, {
    data: { username: user.username, email: user.email, password: user.password },
  })

  await page.goto('/login')
  await page.getByTestId('login-email').fill(user.email)
  await page.getByTestId('login-password').fill('WrongPassword1!')
  await page.getByTestId('login-submit').click()

  await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8_000 })
  await expect(page).toHaveURL(/\/login/)
})

test('login with correct credentials → redirects to circuit-builder', async ({ page }) => {
  const user = makeUser('loginok')

  // Ensure the account exists.
  await page.request.post(`${API_BASE}/auth/register`, {
    data: { username: user.username, email: user.email, password: user.password },
  })

  await page.goto('/login')
  await page.getByTestId('login-email').fill(user.email)
  await page.getByTestId('login-password').fill(user.password)
  const loginResponsePromise = page.waitForResponse((response) => isAuthResponse(response, 'login'))
  await page.getByTestId('login-submit').click()

  const loginResponse = await loginResponsePromise
  expect(loginResponse.ok()).toBeTruthy()

  await expect(page).toHaveURL(/\/circuit-builder/, { timeout: AUTH_REDIRECT_TIMEOUT_MS })
  await expect(page.getByTestId('builder-run-panel')).toBeVisible({ timeout: AUTH_REDIRECT_TIMEOUT_MS })
})
