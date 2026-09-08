import { test, expect, type Page } from '@playwright/test'
import path from 'path'
import {
  E2E_STUDENT_IDS,
  E2E_CONFERENCE_TEACHER_ID,
} from './helpers/constants'

const AUTH_DIR = path.join(__dirname, '.auth')

const householdMessageUrl = `/parent/messages?studentId=${E2E_STUDENT_IDS.parentEnrolledGrantChild}&recipientId=${E2E_CONFERENCE_TEACHER_ID}&recipientName=${encodeURIComponent('Zelinda Melo')}`

test('household teacher group thread is shared between owner and grantee', async ({
  browser,
}) => {
  const uniqueBody = `household-e2e-${Date.now()}`
  const messageInChat = (page: Page) =>
    page.locator('p.break-words', { hasText: uniqueBody })

  const ownerContext = await browser.newContext({
    storageState: path.join(AUTH_DIR, 'parent-enrolled.json'),
  })
  const granteeContext = await browser.newContext({
    storageState: path.join(AUTH_DIR, 'parent-grantee.json'),
  })

  const ownerPage = await ownerContext.newPage()
  await ownerPage.goto(householdMessageUrl)
  await expect(ownerPage.getByPlaceholder('Type a message...')).toBeVisible({
    timeout: 30_000,
  })

  const messageInput = ownerPage.getByPlaceholder('Type a message...')
  await messageInput.fill(uniqueBody)
  await messageInput.press('Enter')

  await expect(messageInChat(ownerPage)).toBeVisible({ timeout: 15_000 })

  const granteePage = await granteeContext.newPage()
  await granteePage.goto(householdMessageUrl)
  await expect(granteePage.getByPlaceholder('Type a message...')).toBeVisible({
    timeout: 30_000,
  })
  await expect(messageInChat(granteePage)).toBeVisible({
    timeout: 15_000,
  })

  await ownerContext.close()
  await granteeContext.close()
})
