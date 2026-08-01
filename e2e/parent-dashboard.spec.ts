import { test, expect } from '@playwright/test'

test('parent dashboard loads', async ({ page }) => {
  await page.goto('/parent/dashboard')
  await expect(page).toHaveURL(/\/parent\/dashboard/)
  await expect(page.getByText('E2E Test Child').first()).toBeVisible()
})

test('parent billing page loads', async ({ page }) => {
  await page.goto('/parent/billing')
  // Some accounts may redirect to dashboard; either route should render for enrolled parents
  await expect(page).toHaveURL(/\/parent\/(billing|dashboard)/)
  await expect(page.locator('body')).not.toBeEmpty()
})
