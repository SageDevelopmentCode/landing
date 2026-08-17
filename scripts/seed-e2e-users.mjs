import { execSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const E2E_PASSWORD = 'E2eTestPassword123!'

/** Real conference teacher IDs — admin.users rows for FK on PTC bookings */
const CONFERENCE_TEACHERS_SEED = [
  {
    id: '6db16988-f41e-4249-b3fa-7b6720d11ac0',
    email: 'e2e-conference-sabrina@sagefield.test',
    full_name: 'Sabrina Obnamia',
    role: 'teacher',
  },
  {
    id: 'bd562de1-18c2-4b47-91d7-5f0b93fee107',
    email: 'e2e-conference-zelinda@sagefield.test',
    full_name: 'Zelinda Melo',
    role: 'teacher',
  },
  {
    id: '68709384-b054-4f38-a4ee-81554dad2eb8',
    email: 'e2e-conference-joy@sagefield.test',
    full_name: 'Joy Paige',
    role: 'teacher',
  },
]

const TEACHER_ID_CARDS_SEED = [
  {
    user_id: '6db16988-f41e-4249-b3fa-7b6720d11ac0',
    full_name: 'Sabrina Obnamia',
    title: 'Lead Teacher',
    grade_classroom: '3rd – 4th Grade',
    issue_year: 2026,
    sort_order: 1,
  },
  {
    user_id: 'bd562de1-18c2-4b47-91d7-5f0b93fee107',
    full_name: 'Zelinda Melo',
    title: 'Teacher',
    grade_classroom: '1st – 2nd Grade',
    issue_year: 2026,
    sort_order: 2,
  },
  {
    user_id: '68709384-b054-4f38-a4ee-81554dad2eb8',
    full_name: 'Joy Paige',
    title: 'Lead Teacher',
    grade_classroom: 'Pre-K – Kindergarten',
    issue_year: 2026,
    sort_order: 3,
  },
]

const E2E_ENROLLED_STUDENT_ID = '22222222-2222-4222-8222-222222222001'
const E2E_GRANT_CHILD_ID = '22222222-2222-4222-8222-222222222002'
const E2E_CONFERENCE_TEACHER_ID = 'bd562de1-18c2-4b47-91d7-5f0b93fee107'
const E2E_TEACHER_STUDENT_ID = '44444444-4444-4444-8444-444444444001'
const E2E_GRANT_TEACHER_STUDENT_ID = '44444444-4444-4444-8444-444444444002'
const E2E_DASHBOARD_GRANT_ID = '55555555-5555-4555-8555-555555555001'

const USERS = [
  {
    email: 'parent-apply@e2e.sagefield.test',
    role: 'parent',
    full_name: 'E2E Parent Apply',
    applications: [
      {
        id: '33333333-3333-4333-8333-333333333001',
        status: 'in_progress',
        program: 'summer_26',
        child_legal_name: 'E2E Apply Child',
        approved: false,
        student_id: null,
      },
    ],
  },
  {
    email: 'parent-enrolled@e2e.sagefield.test',
    role: 'parent',
    full_name: 'E2E Parent Enrolled',
    students: [
      {
        id: E2E_ENROLLED_STUDENT_ID,
        child_legal_name: 'E2E Test Child',
        dob_month: '06',
        dob_day: '15',
        dob_year: '2018',
        child_grade: '1',
      },
      {
        id: E2E_GRANT_CHILD_ID,
        child_legal_name: 'Grant E2E Child',
        dob_month: '07',
        dob_day: '20',
        dob_year: '2017',
        child_grade: '2',
      },
    ],
    applications: [
      {
        id: '33333333-3333-4333-8333-333333333002',
        status: 'enrolled',
        program: 'summer_26',
        child_legal_name: 'E2E Test Child',
        approved: true,
        student_id: E2E_ENROLLED_STUDENT_ID,
      },
    ],
  },
  {
    email: 'parent-grantee@e2e.sagefield.test',
    role: 'parent',
    full_name: 'E2E Parent Grantee',
  },
  {
    email: 'teacher@e2e.sagefield.test',
    role: 'teacher',
    full_name: 'E2E Teacher',
  },
  {
    email: 'admin@e2e.sagefield.test',
    role: 'super_admin',
    full_name: 'E2E Admin',
  },
]

function parseSupabaseStatusEnv(output) {
  const env = {}
  for (const line of output.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    let value = trimmed.slice(eq + 1)
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

function loadLocalSupabaseEnv() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const output = execSync('supabase status -o env', {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return parseSupabaseStatusEnv(output)
}

const statusEnv = loadLocalSupabaseEnv()
const url = statusEnv.API_URL ?? 'http://127.0.0.1:54321'
const anonKey = statusEnv.ANON_KEY
const secretKey = statusEnv.SECRET_KEY

if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
  throw new Error('Refusing to seed: Supabase URL is not local.')
}
if (!anonKey || !secretKey?.startsWith('sb_secret_')) {
  throw new Error('Local Supabase keys missing. Run: npm run db:start')
}

const db = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const dbUrl = statusEnv.DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

function runPsql(sql) {
  const file = join(tmpdir(), `e2e-seed-${process.pid}.sql`)
  writeFileSync(file, sql)
  try {
    execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1 -f "${file}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
  } finally {
    unlinkSync(file)
  }
}

function seedAuthUserForConference(teacher) {
  const escapedEmail = teacher.email.replace(/'/g, "''")
  runPsql(`
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_sso_user, is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '${teacher.id}',
  'authenticated',
  'authenticated',
  '${escapedEmail}',
  crypt('${E2E_PASSWORD}', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false, false
) ON CONFLICT (id) DO NOTHING;
`)
}

async function signupLocalUser(email) {
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: E2E_PASSWORD,
      data: {},
    }),
  })
  const body = await response.json().catch(() => ({}))
  if (response.ok && body.user?.id) {
    return body.user.id
  }

  const loginResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password: E2E_PASSWORD }),
  })
  const loginBody = await loginResponse.json().catch(() => ({}))
  if (loginResponse.ok && loginBody.user?.id) {
    return loginBody.user.id
  }

  throw new Error(
    `Could not create or resolve user ${email}: ${JSON.stringify(body || loginBody)}`,
  )
}

async function seedUser(user) {
  const userId = await signupLocalUser(user.email)

  const { error: adminError } = await db
    .schema('admin')
    .from('users')
    .upsert({
      id: userId,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    })

  if (adminError) {
    throw new Error(`admin.users upsert failed for ${user.email}: ${adminError.message}`)
  }

  if (user.students?.length) {
    for (const student of user.students) {
      const { error } = await db
        .schema('admin')
        .from('students')
        .upsert({ ...student, parent_id: userId })
      if (error) throw new Error(`student seed failed: ${error.message}`)
    }
  } else if (user.student) {
    const { error } = await db
      .schema('admin')
      .from('students')
      .upsert({ ...user.student, parent_id: userId })
    if (error) throw new Error(`student seed failed: ${error.message}`)
  }

  if (user.applications?.length) {
    const rows = user.applications.map((app) => ({
      ...app,
      user_id: userId,
    }))
    const { error } = await db.schema('parent_app').from('applications').upsert(rows)
    if (error) throw new Error(`applications seed failed: ${error.message}`)
  }

  return userId
}

async function seedConferenceTeachers() {
  for (const teacher of CONFERENCE_TEACHERS_SEED) {
    seedAuthUserForConference(teacher)
    const { error } = await db.schema('admin').from('users').upsert({
      id: teacher.id,
      email: teacher.email,
      role: teacher.role,
      full_name: teacher.full_name,
    })
    if (error) {
      throw new Error(`conference teacher seed failed for ${teacher.email}: ${error.message}`)
    }
  }
}

async function seedTeacherIdCards() {
  const { count, error: countError } = await db
    .schema('teachers')
    .from('teacher_id_cards')
    .select('*', { count: 'exact', head: true })
  if (countError) {
    throw new Error(`teacher_id_cards count failed: ${countError.message}`)
  }
  if (count > 0) return

  const { error } = await db.schema('teachers').from('teacher_id_cards').insert(TEACHER_ID_CARDS_SEED)
  if (error) {
    throw new Error(`teacher_id_cards seed failed: ${error.message}`)
  }
}

async function seedDashboardGrant(ownerId, granteeId, granteeEmail) {
  const { error } = await db.schema('parent_app').from('dashboard_access_grants').upsert({
    id: E2E_DASHBOARD_GRANT_ID,
    owner_id: ownerId,
    grantee_id: granteeId,
    invited_email: granteeEmail,
    status: 'active',
    accepted_at: new Date().toISOString(),
  })
  if (error) {
    throw new Error(`dashboard_access_grants seed failed: ${error.message}`)
  }
}

async function seedConferenceTeacherAssignment() {
  const { error: clearError } = await db
    .schema('teachers')
    .from('parent_teacher_conference_bookings')
    .delete()
    .in('student_id', [E2E_ENROLLED_STUDENT_ID, E2E_GRANT_CHILD_ID])
  if (clearError) {
    throw new Error(`conference booking clear failed: ${clearError.message}`)
  }

  const { error } = await db.schema('teachers').from('teacher_students').upsert([
    {
      id: E2E_TEACHER_STUDENT_ID,
      teacher_id: E2E_CONFERENCE_TEACHER_ID,
      student_id: E2E_ENROLLED_STUDENT_ID,
      program: 'school_year_26_27',
      is_deleted: false,
    },
    {
      id: E2E_GRANT_TEACHER_STUDENT_ID,
      teacher_id: E2E_CONFERENCE_TEACHER_ID,
      student_id: E2E_GRANT_CHILD_ID,
      program: 'school_year_26_27',
      is_deleted: false,
    },
  ])
  if (error) {
    throw new Error(`teacher_students seed failed: ${error.message}`)
  }
}

async function main() {
  const userIds = {}
  for (const user of USERS) {
    userIds[user.email] = await seedUser(user)
  }
  await seedDashboardGrant(
    userIds['parent-enrolled@e2e.sagefield.test'],
    userIds['parent-grantee@e2e.sagefield.test'],
    'parent-grantee@e2e.sagefield.test',
  )
  await seedConferenceTeachers()
  await seedTeacherIdCards()
  await seedConferenceTeacherAssignment()
  console.log('E2E seed complete (local Supabase only)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
