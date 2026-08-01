export const E2E_PASSWORD = 'E2eTestPassword123!'

export const E2E_APPLICATION_IDS = {
  parentApply: '33333333-3333-3333-3333-333333333001',
  parentEnrolled: '33333333-3333-3333-3333-333333333002',
} as const

export const E2E_STUDENT_IDS = {
  parentEnrolled: '22222222-2222-2222-2222-222222222001',
} as const

export const TEST_USERS = {
  parentApply: {
    email: 'parent-apply@e2e.sagefield.test',
    storageState: 'e2e/.auth/parent-apply.json',
    expectedRedirect: '/apply/dashboard',
  },
  parentEnrolled: {
    email: 'parent-enrolled@e2e.sagefield.test',
    storageState: 'e2e/.auth/parent-enrolled.json',
    expectedRedirect: '/parent/home',
  },
  teacher: {
    email: 'teacher@e2e.sagefield.test',
    storageState: 'e2e/.auth/teacher.json',
    expectedRedirect: '/teacher/dashboard',
  },
  admin: {
    email: 'admin@e2e.sagefield.test',
    storageState: 'e2e/.auth/admin.json',
    expectedRedirect: '/admin',
  },
} as const
