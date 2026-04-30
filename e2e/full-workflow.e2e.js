import { expect, test } from '@playwright/test'

test('home page allows navigation to auth pages', async ({ page }) => {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false }),
    })
  })

  const authMePromise = page.waitForResponse(
    (r) => r.request().method() === 'GET' && r.url().includes('/api/v1/auth/me'),
  )
  await page.goto('/')
  await authMePromise
  await expect(page.getByText('The qubit')).toBeVisible()

  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/register/)

  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/login/)
})
