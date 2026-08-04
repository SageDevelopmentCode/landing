export const E2E_PASSWORD = 'E2eTestPassword123!'

export const E2E_APPLICATION_IDS = {
  parentApply: '33333333-3333-4333-8333-333333333001',
  parentEnrolled: '33333333-3333-4333-8333-333333333002',
} as const

export const E2E_STUDENT_IDS = {
  parentEnrolled: '22222222-2222-4222-8222-222222222001',
} as const

/** Conference teacher used in PTC E2E seed (Zelinda — 1st–2nd grade) */
export const E2E_CONFERENCE_TEACHER_ID =
  'bd562de1-18c2-4b47-91d7-5f0b93fee107' as const

export const E2E_PTC_SLOT = '1:50 – 2:20pm' as const

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
