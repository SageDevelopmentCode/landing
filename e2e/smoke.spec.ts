import { test, expect } from '@playwright/test'

const publicPages = [
  { path: '/', name: 'home' },
  { path: '/programs', heading: 'Our Programs' },
  { path: '/contact', heading: 'Contact' },
  { path: '/apply', name: 'apply' },
]

for (const pageInfo of publicPages) {
  test(`${pageInfo.path} loads`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto(pageInfo.path)
    await expect(page).not.toHaveURL(/\/login/)

    if (pageInfo.heading) {
      await expect(page.getByText(pageInfo.heading, { exact: false }).first()).toBeVisible()
    } else {
      await expect(page.locator('body')).not.toBeEmpty()
    }

    expect(errors).toEqual([])
  })
}
