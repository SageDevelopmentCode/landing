import { test as setup } from '@playwright/test'
import path from 'path'
import { loginWithPassword } from './helpers/auth'
import { TEST_USERS } from './helpers/constants'

const authDir = path.join(__dirname, '.auth')

for (const [name, user] of Object.entries(TEST_USERS)) {
  setup(`authenticate ${name}`, async ({ page }) => {
    await loginWithPassword(page, user.email)
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 30_000,
      waitUntil: 'commit',
    })
    await page.context().storageState({
      path: path.join(authDir, path.basename(user.storageState)),
    })
  })
}
