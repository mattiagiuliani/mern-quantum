/**
 * Real end-to-end circuit builder tests.
 *
 * These tests do NOT use page.route() mocks. Every request reaches the actual
 * backend (MongoMemoryServer-backed when started via playwright.config.js).
 *
 * Run in isolation:
 *   npx playwright test circuit-builder.real.e2e.js --project=chromium
 */
import { test, expect } from '@playwright/test'

const API_BASE = process.env.PW_API_BASE_URL ?? 'http://localhost:3001/api/v1'
const AUTH_REDIRECT_TIMEOUT_MS = 15_000
const uid = Date.now().toString(36)

function isAuthResponse(response, path) {
  return response.request().method() === 'POST' && response.url().includes(`/api/v1/auth/${path}`)
}

function makeUser(testId) {
  const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const prefix = `cb_${testId}`.slice(0, 30 - 1 - suffix.length)
  const id = `${prefix}_${suffix}`
  return {
    username: id,
    email: `${id}@example.com`,
    password: 'Abcdef1!',
  }
}

async function clickGridCell(page, qubit, step) {
  const target = page.getByTestId(`circuit-cell-${qubit}-${step}`)
  if (await target.count()) {
    await target.first().click({ timeout: 8_000 })
    return
  }

  // Fallback for CI/prod-bundle: empty gate slots expose an inline "cursor: cell" style.
  const candidateCells = page.locator('div[style*="cursor: cell"]')
  const count = await candidateCells.count()
  if (!count) throw new Error('No interactive circuit cell found')
  const index = Math.max(0, Math.min(step, count - 1))
  await candidateCells.nth(index).click({ timeout: 8_000 })
}

// ─── Shared setup: per-test user registration + login ────────────────────────

test.beforeEach(async ({ page }, testInfo) => {
  const user = makeUser(testInfo.title.replace(/\W+/g, '_').toLowerCase())

  const res = await page.request.post(`${API_BASE}/auth/register`, {
    data: { username: user.username, email: user.email, password: user.password },
  })
  if (!res.ok()) throw new Error(`Registration failed: ${res.status()} ${await res.text()}`)

  // Login via the UI to populate the auth cookie.
  await page.goto('/login')
  await page.getByTestId('login-email').fill(user.email)
  await page.getByTestId('login-password').fill(user.password)
  const loginResponsePromise = page.waitForResponse((response) => isAuthResponse(response, 'login'))
  await page.getByTestId('login-submit').click()

  const loginResponse = await loginResponsePromise
  expect(loginResponse.ok()).toBeTruthy()
  await expect(page).toHaveURL(/\/circuit-builder/, { timeout: AUTH_REDIRECT_TIMEOUT_MS })
})

// ─── Gate placement ───────────────────────────────────────────────────────────

test('place a gate and run simulation — results panel appears', async ({ page }) => {
  // Select the Hadamard gate from the palette
  await page.getByText('Hadamard').click()

  // Click the first available circuit slot
  await clickGridCell(page, 0, 0)

  // Run the simulation
  await page.getByTestId('builder-run-button').click()

  // Results panel must become visible with counts
  await expect(page.getByText('Results ·', { exact: false })).toBeVisible({ timeout: 15_000 })
})

// ─── Save & dashboard ─────────────────────────────────────────────────────────

test('save circuit and verify it appears on the dashboard', async ({ page }) => {
  const circuitName = `Test Circuit ${uid}`

  // Place at least one gate so the circuit is non-empty
  await page.getByText('Pauli-X').click()
  await clickGridCell(page, 0, 0)

  // Open the save dialog via the header save button
  await page.getByRole('button', { name: /save/i }).click()

  // Fill in the circuit name and confirm
  const saveDialog = page.getByRole('dialog')
  const nameInput = saveDialog.getByRole('textbox', { name: /circuit name/i })
  await nameInput.fill(circuitName)
  await saveDialog.getByRole('button', { name: /^save$/i }).click()

  // Navigate to the dashboard
  await page.goto('/dashboard')
  await expect(page.getByText(circuitName)).toBeVisible({ timeout: 10_000 })
})
