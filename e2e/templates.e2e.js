import { expect, test } from '@playwright/test'

const templatePayload = {
  success: true,
  templates: [
    {
      _id: 't1',
      name: 'Bell Demo',
      description: 'Entanglement sample',
      circuit: [[ 'H', null, 'M' ], [ null, 'X', 'M' ]],
      tags: ['education', 'entanglement'],
      isPublic: true,
      author: { _id: 'u2', username: 'teacher' },
    },
  ],
  total: 1,
  page: 1,
  pages: 1,
}

test('templates page loads public templates list', async ({ page }) => {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Unauthenticated' }),
    })
  })

  await page.route('**/api/v1/templates/public**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(templatePayload),
    })
  })

  await page.goto('/templates')
  await expect(page.getByTestId('templates-page')).toBeVisible()
  await expect(page.getByTestId('templates-filter-input')).toBeVisible()
  await expect(page.getByText('Bell Demo')).toBeVisible()
})
