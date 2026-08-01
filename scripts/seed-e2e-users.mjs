import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const E2E_PASSWORD = 'E2eTestPassword123!'

const USERS = [
  {
    email: 'parent-apply@e2e.sagefield.test',
    role: 'parent',
    full_name: 'E2E Parent Apply',
    applications: [
      {
        id: '33333333-3333-3333-3333-333333333001',
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
    student: {
      id: '22222222-2222-2222-2222-222222222001',
      child_legal_name: 'E2E Test Child',
      dob_month: '06',
      dob_day: '15',
      dob_year: '2018',
      child_grade: '1',
    },
    applications: [
      {
        id: '33333333-3333-3333-3333-333333333002',
        status: 'enrolled',
        program: 'summer_26',
        child_legal_name: 'E2E Test Child',
        approved: true,
        student_id: '22222222-2222-2222-2222-222222222001',
      },
    ],
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

  if (user.student) {
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
}

async function main() {
  for (const user of USERS) {
    await seedUser(user)
  }
  console.log('E2E seed complete (local Supabase only)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
