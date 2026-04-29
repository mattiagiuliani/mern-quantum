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

const uid  = Date.now().toString(36)
const USER = {
  username: `cb_${uid}`,
  email:    `cb_${uid}@example.com`,
  password: 'Abcdef1!',
}

// ─── Shared setup: register once, login before each test ─────────────────────

test.beforeAll(async ({ request }) => {
  await request.post('/api/v1/auth/register', {
    data: { username: USER.username, email: USER.email, password: USER.password },
  })
})

test.beforeEach(async ({ page }) => {
  // Login via the UI to populate the auth cookie
  await page.goto('/login')
  await page.getByTestId('login-email').fill(USER.email)
  await page.getByTestId('login-password').fill(USER.password)
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
