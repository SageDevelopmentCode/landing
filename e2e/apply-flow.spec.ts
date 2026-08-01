import { test, expect } from '@playwright/test'

test('apply dashboard shows in-progress application', async ({ page }) => {
  await page.goto('/apply/dashboard')
  await expect(page).toHaveURL(/\/apply\/dashboard/)
  await expect(page.getByText('E2E Apply Child', { exact: false })).toBeVisible()
})

test('can navigate to apply step 1', async ({ page }) => {
  await page.goto('/apply/step/1')
  await expect(page).toHaveURL(/\/apply\/step\/1/)
  await expect(page.locator('body')).not.toBeEmpty()
})

test('apply start page loads for authenticated parent', async ({ page }) => {
  await page.goto('/apply/start')
  await expect(page).not.toHaveURL(/\/login/)
  await expect(page.locator('body')).not.toBeEmpty()
})
