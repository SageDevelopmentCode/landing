import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const AUTH_DIR = path.join(__dirname, 'e2e/.auth')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    // scripts/start-e2e.sh loads local Supabase keys (never .env.local production)
    command: 'bash scripts/start-e2e.sh',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
      testMatch: /(smoke|login|auth-boundaries)\.spec\.ts/,
      grepInvert: /@parent-apply|@teacher|@admin/,
    },
    {
      name: 'parent-apply',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'parent-apply.json'),
      },
      dependencies: ['setup'],
      testMatch: /apply-flow\.spec\.ts/,
    },
    {
      name: 'parent-apply-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'parent-apply.json'),
      },
      dependencies: ['setup'],
      testMatch: /auth-boundaries\.spec\.ts/,
      grep: /@parent-apply/,
    },
    {
      name: 'parent-enrolled',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'parent-enrolled.json'),
      },
      dependencies: ['setup'],
      testMatch: /parent-dashboard\.spec\.ts/,
    },
    {
      name: 'teacher',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'teacher.json'),
      },
      dependencies: ['setup'],
      testMatch: /auth-boundaries\.spec\.ts/,
      grep: /@teacher/,
    },
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'admin.json'),
      },
      dependencies: ['setup'],
      testMatch: /auth-boundaries\.spec\.ts/,
      grep: /@admin/,
    },
  ],
})
