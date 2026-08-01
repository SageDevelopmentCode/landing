import { expect, type Page } from '@playwright/test'

export function trackPageErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

export function assertNoPageErrors(errors: string[]) {
  expect(errors, errors.join('\n')).toEqual([])
}
