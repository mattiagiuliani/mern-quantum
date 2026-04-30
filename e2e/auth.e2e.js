import { expect, test } from '@playwright/test'

const AUTH_REDIRECT_TIMEOUT_MS = 15_000

function isAuthResponse(response, path) {
  return response.request().method() === 'POST' && response.url().includes(`/api/v1/auth/${path}`)
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Unauthenticated' }),
    })
  })
})

test('register flow redirects to builder on success', async ({ page }) => {
  await page.route('**/api/v1/auth/register', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: { id: 'u1', username: 'e2e-user', email: 'e2e@example.com' },
      }),
    })
  })

  await page.goto('/register')
  await page.getByTestId('register-username').fill('e2e-user')
  await page.getByTestId('register-email').fill('e2e@example.com')
  await page.getByTestId('register-password').fill('Abcdef1!')
  const registerResponsePromise = page.waitForResponse((response) => isAuthResponse(response, 'register'))
  await page.getByTestId('register-submit').click()

  const registerResponse = await registerResponsePromise
  expect(registerResponse.ok()).toBeTruthy()

  await expect(page).toHaveURL(/\/circuit-builder/, { timeout: AUTH_REDIRECT_TIMEOUT_MS })
  await expect(page.getByText('My Circuits')).toBeVisible({ timeout: AUTH_REDIRECT_TIMEOUT_MS })
})

test('login flow redirects to builder on success', async ({ page }) => {
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: { id: 'u1', username: 'e2e-user', email: 'e2e@example.com' },
      }),
    })
  })

  await page.goto('/login')
  await page.getByTestId('login-email').fill('e2e@example.com')
  await page.getByTestId('login-password').fill('Abcdef1!')
  const loginResponsePromise = page.waitForResponse((response) => isAuthResponse(response, 'login'))
  await page.getByTestId('login-submit').click()

  const loginResponse = await loginResponsePromise
  expect(loginResponse.ok()).toBeTruthy()

  await expect(page).toHaveURL(/\/circuit-builder/, { timeout: AUTH_REDIRECT_TIMEOUT_MS })
  await expect(page.getByTestId('builder-run-panel')).toBeVisible({ timeout: AUTH_REDIRECT_TIMEOUT_MS })
})
