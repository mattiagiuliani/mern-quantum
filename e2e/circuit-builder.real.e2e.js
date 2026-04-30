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
const uid = Date.now().toString(36)

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
  await page.getByTestId('login-submit').click()
  await expect(page).toHaveURL(/\/circuit-builder/, { timeout: 10_000 })
})

// ─── Gate placement ───────────────────────────────────────────────────────────

test('place a gate and run simulation — results panel appears', async ({ page }) => {
  // Select the Hadamard gate from the palette
  await page.getByText('Hadamard').click()

  // Click the first cell of the circuit canvas (qubit 0, step 0)
  const firstCell = page.getByTestId('circuit-cell-0-0')
  await firstCell.click()

  // Place a Measure gate on qubit 0, step 1
  await page.getByText('Measure').click()
  await page.getByTestId('circuit-cell-0-1').click()

  // Run the simulation
  await page.getByTestId('builder-run-button').click()

  // Results panel must become visible with counts
  await expect(page.getByTestId('results-panel')).toBeVisible({ timeout: 10_000 })
})

// ─── Save & dashboard ─────────────────────────────────────────────────────────

test('save circuit and verify it appears on the dashboard', async ({ page }) => {
  const circuitName = `Test Circuit ${uid}`

  // Place at least one gate so the circuit is non-empty
  await page.getByText('Pauli-X').click()
  await page.getByTestId('circuit-cell-0-0').click()

  // Open the save dialog via the header save button
  await page.getByTestId('builder-save-button').click()

  // Fill in the circuit name and confirm
  const nameInput = page.getByTestId('save-circuit-name-input')
  await nameInput.fill(circuitName)
  await page.getByTestId('save-circuit-confirm').click()

  // Navigate to the dashboard
  await page.goto('/dashboard')
  await expect(page.getByText(circuitName)).toBeVisible({ timeout: 10_000 })
})
