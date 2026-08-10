import { test, expect } from '@playwright/test'
import { assertNoPageErrors, trackPageErrors } from './helpers/page'
import {
  E2E_PTC_SLOT,
  E2E_PTC_GRANTEE_SLOT,
  E2E_GRANT_CHILD_FIRST_NAME,
} from './helpers/constants'

/**
 * Parent-teacher conference scheduling (local Supabase only).
 * Tagged tests run on role-specific Playwright projects (see playwright.config.ts).
 */

const CONTENT_TIMEOUT = 15_000

function expectAuthenticated(page: import('@playwright/test').Page) {
  expect(page.url()).not.toMatch(/\/login/)
}

// ─── Parent enrolled: conference UI + booking ───────────────────────────────

test.describe('Parent-teacher conference', () => {
  test('@parent-enrolled parent home shows conference banner', async ({ page }) => {
    const errors = trackPageErrors(page)
    await page.goto('/parent/home')
    expectAuthenticated(page)
    await expect(page).toHaveURL(/\/parent\/home/)
    await expect(
      page.getByText('Schedule your parent-teacher conference', { exact: false }),
    ).toBeVisible({ timeout: CONTENT_TIMEOUT })
    assertNoPageErrors(errors)
  })

  test('@parent-enrolled can open conference drawer', async ({ page }) => {
    const errors = trackPageErrors(page)
    await page.goto('/parent/home')
    expectAuthenticated(page)
    await page
      .getByRole('button', { name: /Schedule your parent-teacher conference/i })
      .click()
    await expect(
      page.getByText('Parent-Teacher Conference', { exact: true }),
    ).toBeVisible({ timeout: CONTENT_TIMEOUT })
    await expect(page.getByText('Choose a time', { exact: false })).toBeVisible({
      timeout: CONTENT_TIMEOUT,
    })
    assertNoPageErrors(errors)
  })

  test('@parent-enrolled can book a conference slot', async ({ page }) => {
    const errors = trackPageErrors(page)
    await page.goto('/parent/home')
    expectAuthenticated(page)

    await page
      .getByRole('button', { name: /Schedule your parent-teacher conference/i })
      .click()

    await expect(
      page.getByText('Parent-Teacher Conference', { exact: true }),
    ).toBeVisible({ timeout: CONTENT_TIMEOUT })

    // Assigned teacher (Zelinda) from seed — ensure selected
    await page.getByRole('button', { name: /Zelinda Melo/i }).click()

    await page.getByRole('button', { name: E2E_PTC_SLOT, exact: true }).click()

    const confirmBtn = page.getByRole('button', {
      name: /Confirm conference for E2E/i,
    })
    await expect(confirmBtn).toBeEnabled({ timeout: CONTENT_TIMEOUT })
    await confirmBtn.click()

    await expect(
      page.getByText(/Conference confirmed for E2E/i).first(),
    ).toBeVisible({ timeout: CONTENT_TIMEOUT })

    assertNoPageErrors(errors)
  })
})

test.describe('Parent-teacher conference (grant access)', () => {
  test('@parent-grantee grantee can book conference for owner child', async ({
    page,
  }) => {
    const errors = trackPageErrors(page)
    await page.goto('/parent/home')
    expectAuthenticated(page)

    await page
      .getByRole('button', { name: /Schedule your parent-teacher conference/i })
      .click()

    await expect(
      page.getByText('Parent-Teacher Conference', { exact: true }),
    ).toBeVisible({ timeout: CONTENT_TIMEOUT })

    await expect(
      page.getByText(`Choose teacher for ${E2E_GRANT_CHILD_FIRST_NAME}`),
    ).toBeVisible({ timeout: CONTENT_TIMEOUT })

    await page
      .getByRole('button', { name: E2E_GRANT_CHILD_FIRST_NAME, exact: true })
      .click()
    await page.getByRole('button', { name: /Zelinda Melo/i }).click()
    await page.getByRole('button', { name: E2E_PTC_GRANTEE_SLOT, exact: true }).click()

    const confirmBtn = page.getByRole('button', {
      name: new RegExp(`Confirm conference for ${E2E_GRANT_CHILD_FIRST_NAME}`, 'i'),
    })
    await expect(confirmBtn).toBeEnabled({ timeout: CONTENT_TIMEOUT })
    await confirmBtn.click()

    await expect(page.getByText('Student not found')).not.toBeVisible()
    await expect(
      page
        .getByText(
          new RegExp(`Conference confirmed for ${E2E_GRANT_CHILD_FIRST_NAME}`, 'i'),
        )
        .first(),
    ).toBeVisible({ timeout: CONTENT_TIMEOUT })

    assertNoPageErrors(errors)
  })
})

// ─── Admin: PTC schedule page ───────────────────────────────────────────────

test('@admin parent-teacher conferences page loads', async ({ page }) => {
  const errors = trackPageErrors(page)
  await page.goto('/admin/parent-teacher-conferences')
  await expect(page).toHaveURL(/\/admin\/parent-teacher-conferences/)
  await expect(
    page.getByRole('heading', { name: 'Parent-Teacher Conferences' }),
  ).toBeVisible({ timeout: CONTENT_TIMEOUT })
  assertNoPageErrors(errors)
})

test('@admin shows booked conference after parent books', async ({ page }) => {
  const errors = trackPageErrors(page)
  await page.goto('/admin/parent-teacher-conferences')
  await expect(
    page.getByRole('heading', { name: 'Parent-Teacher Conferences' }),
  ).toBeVisible({ timeout: CONTENT_TIMEOUT })

  // Parent-enrolled project books before admin project runs (workers: 1 in CI)
  await expect(page.getByText('E2E Test Child').first()).toBeVisible({
    timeout: CONTENT_TIMEOUT,
  })
  await expect(page.getByText(E2E_PTC_SLOT).first()).toBeVisible({
    timeout: CONTENT_TIMEOUT,
  })

  assertNoPageErrors(errors)
})
