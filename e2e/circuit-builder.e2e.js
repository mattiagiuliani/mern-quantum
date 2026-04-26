import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, user: { id: 'u1', username: 'e2e-user', email: 'e2e@example.com' } }),
    })
  })

  await page.route('**/api/circuits/applyGate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        qubitStates: [
          { value: 0, superposition: false },
          { value: 0, superposition: false },
        ],
        measurement: null,
      }),
    })
  })

  await page.route('**/api/circuits/run', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, counts: { '00': 512, '11': 512 }, shots: 1024 }),
    })
  })

  await page.goto('/circuit-builder')
})

test('builder page renders gate palette and run controls', async ({ page }) => {
  await expect(page.getByText('Builder')).toBeVisible()
  await expect(page.getByText('Hadamard')).toBeVisible()
  await expect(page.getByText('Measure')).toBeVisible()
  await expect(page.getByTestId('builder-run-panel')).toBeVisible()
  await expect(page.getByTestId('builder-run-button')).toBeVisible()
  await expect(page.getByTestId('shot-preset-1024')).toBeVisible()
})
