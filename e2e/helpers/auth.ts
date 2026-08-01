import type { Page } from '@playwright/test'
import { E2E_PASSWORD } from './constants'

export async function loginWithPassword(page: Page, email: string) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Sign in with password instead' }).click()
  await page.getByLabel('Email address').fill(email)
  await page.locator('#password').fill(E2E_PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}
