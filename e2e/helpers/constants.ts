export const E2E_PASSWORD = 'E2eTestPassword123!'

export const TEST_USERS = {
  parentApply: {
    email: 'parent-apply@e2e.sagefield.test',
    storageState: 'e2e/.auth/parent-apply.json',
    expectedRedirect: '/apply/dashboard',
  },
  parentEnrolled: {
    email: 'parent-enrolled@e2e.sagefield.test',
    storageState: 'e2e/.auth/parent-enrolled.json',
    expectedRedirect: '/apply/dashboard',
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
