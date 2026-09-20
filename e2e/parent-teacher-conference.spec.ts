import { test, expect } from '@playwright/test'
import { assertNoPageErrors, trackPageErrors } from './helpers/page'
import { E2E_PTC_SLOT } from './helpers/constants'

/**
 * Parent-teacher conference scheduling (local Supabase only).
 * Tagged tests run on role-specific Playwright projects (see playwright.config.ts).
 *
 * Parent home scheduling tests were removed — the Action Needed PTC entry point
 * was removed from /parent/home. Admin page tests use a pre-seeded booking.
 */

const CONTENT_TIMEOUT = 15_000

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

test('@admin shows seeded conference booking', async ({ page }) => {
  const errors = trackPageErrors(page)
  await page.goto('/admin/parent-teacher-conferences')
  await expect(
    page.getByRole('heading', { name: 'Parent-Teacher Conferences' }),
  ).toBeVisible({ timeout: CONTENT_TIMEOUT })

  await expect(page.getByText('E2E Test Child').first()).toBeVisible({
    timeout: CONTENT_TIMEOUT,
  })
  await expect(page.getByText(E2E_PTC_SLOT).first()).toBeVisible({
    timeout: CONTENT_TIMEOUT,
  })

  assertNoPageErrors(errors)
})
