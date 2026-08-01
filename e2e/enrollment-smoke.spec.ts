import { test, expect } from '@playwright/test'
import { assertNoPageErrors, trackPageErrors } from './helpers/page'
import { E2E_APPLICATION_IDS } from './helpers/constants'

/**
 * Critical enrollment flows — apply, parent tuition/billing, admin applications.
 * Tagged tests run on role-specific Playwright projects (see playwright.config.ts).
 */

const CONTENT_TIMEOUT = 15_000

function expectAuthenticated(page: import('@playwright/test').Page) {
  expect(page.url()).not.toMatch(/\/login/)
}

// ─── Apply (parent with in-progress application) ───────────────────────────

test.describe('Apply flow', () => {
  test('apply dashboard shows in-progress application', async ({ page }) => {
    const errors = trackPageErrors(page)
    await page.goto('/apply/dashboard')
    expectAuthenticated(page)
    await expect(page).toHaveURL(/\/apply\/dashboard/)
    await expect(page.getByText('E2E Apply Child', { exact: false })).toBeVisible({
      timeout: CONTENT_TIMEOUT,
    })
    assertNoPageErrors(errors)
  })

  test('can navigate to apply step 1', async ({ page }) => {
    const errors = trackPageErrors(page)
    const appId = E2E_APPLICATION_IDS.parentApply
    await page.goto(`/apply/step/1?appId=${appId}`)
    expectAuthenticated(page)
    await expect(page).toHaveURL(/\/apply\/step\/1/)
    await expect(page.getByText('Step 1 of 3')).toBeVisible({ timeout: CONTENT_TIMEOUT })
    assertNoPageErrors(errors)
  })

  test('apply step 1 shows child legal name field', async ({ page }) => {
    const errors = trackPageErrors(page)
    const appId = E2E_APPLICATION_IDS.parentApply
    await page.goto(`/apply/step/1?appId=${appId}`)
    expectAuthenticated(page)
    await expect(page.getByText(/Child.*Full Legal Name/i)).toBeVisible({
      timeout: CONTENT_TIMEOUT,
    })
    assertNoPageErrors(errors)
  })

  test('apply start page loads for authenticated parent', async ({ page }) => {
    const errors = trackPageErrors(page)
    await page.goto('/apply/start')
    expectAuthenticated(page)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).not.toBeEmpty()
    assertNoPageErrors(errors)
  })
})

// ─── Parent tuition / enrollment (enrolled parent) ───────────────────────────

test('@parent-enrolled parent dashboard shows enrolled child', async ({ page }) => {
  const errors = trackPageErrors(page)
  await page.goto('/parent/dashboard')
  expectAuthenticated(page)
  await expect(page).toHaveURL(/\/parent\/dashboard/)
  await expect(page.getByText('E2E Test Child').first()).toBeVisible({
    timeout: CONTENT_TIMEOUT,
  })
  assertNoPageErrors(errors)
})

test('@parent-enrolled billing page loads for enrolled child', async ({ page }) => {
  const errors = trackPageErrors(page)
  await page.goto('/parent/billing')
  expectAuthenticated(page)
  await expect(page).toHaveURL(/\/parent\/billing/)
  await expect(page.getByText('E2E Test Child').first()).toBeVisible({
    timeout: CONTENT_TIMEOUT,
  })
  await expect(page.getByText(/Tuition|All caught up!/i).first()).toBeVisible({
    timeout: CONTENT_TIMEOUT,
  })
  assertNoPageErrors(errors)
})

test('@parent-enrolled children page lists enrolled student', async ({ page }) => {
  const errors = trackPageErrors(page)
  await page.goto('/parent/children')
  expectAuthenticated(page)
  await expect(page).toHaveURL(/\/parent\/children/)
  await expect(page.getByText('E2E Test Child').first()).toBeVisible({
    timeout: CONTENT_TIMEOUT,
  })
  assertNoPageErrors(errors)
})

// ─── Admin applications / enrollment pipeline ────────────────────────────────

test('@admin applications page loads with seeded data', async ({ page }) => {
  const errors = trackPageErrors(page)
  await page.goto('/admin/applications')
  await expect(page).toHaveURL(/\/admin\/applications/)
  await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()
  await expect(page.getByText('E2E Apply Child').first()).toBeVisible({
    timeout: CONTENT_TIMEOUT,
  })
  await expect(page.getByText('E2E Test Child').first()).toBeVisible({
    timeout: CONTENT_TIMEOUT,
  })
  assertNoPageErrors(errors)
})

test('@admin can switch application views without errors', async ({ page }) => {
  const errors = trackPageErrors(page)
  await page.goto('/admin/applications')
  await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()

  await page.getByRole('button', { name: 'Board', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Board', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Pipeline', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()

  await page.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Table', exact: true })).toBeVisible()

  assertNoPageErrors(errors)
})
