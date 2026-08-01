import { test, expect } from '@playwright/test'
import { loginWithPassword } from './helpers/auth'
import { TEST_USERS } from './helpers/constants'

const loginCases = [
  { name: 'parent', user: TEST_USERS.parentApply },
  { name: 'teacher', user: TEST_USERS.teacher },
  { name: 'admin', user: TEST_USERS.admin },
]

for (const { name, user } of loginCases) {
  test(`${name} password login redirects correctly`, async ({ page }) => {
    await loginWithPassword(page, user.email)
    await page.waitForURL(
      (url) => url.pathname.startsWith(user.expectedRedirect),
      { timeout: 30_000 },
    )
    await expect(page).toHaveURL(new RegExp(user.expectedRedirect.replace('/', '\\/')))
  })
}
