import { test, expect } from '@playwright/test'

test.describe('unauthenticated', () => {
  test('redirects /admin to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
    expect(page.url()).toContain('redirectTo')
  })

  test('redirects /teacher/dashboard to login', async ({ page }) => {
    await page.goto('/teacher/dashboard')
    await expect(page).toHaveURL(/\/login/)
    expect(page.url()).toContain('redirectTo')
  })
})

test('@parent-apply parent cannot access admin area', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/apply\/dashboard/)
})

test('@teacher teacher cannot access admin area', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByText('Access Denied')).toBeVisible()
})

test('@admin super admin can access admin area', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin/)
  await expect(page.getByText('Access Denied')).not.toBeVisible()
})
