/**
 * One-off: create a teacher auth user + admin.users row on production.
 * Usage: dotenv -e .env.local -- node scripts/create-teacher-account.mjs
 */
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const EMAIL = 'Meredith.jennifer@outlook.com'
const FULL_NAME = 'Jennifer Meredith'
const ROLE = 'teacher'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function generateTempPassword() {
  const base = randomBytes(12).toString('base64url')
  return `Sf!${base}1`
}

async function main() {
  const { data: existingAuth } = await admin.auth.admin.listUsers()
  const existing = existingAuth?.users?.find(
    (u) => u.email?.toLowerCase() === EMAIL.toLowerCase(),
  )

  let userId = existing?.id
  let tempPassword

  if (!userId) {
    tempPassword = generateTempPassword()
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME },
    })
    if (error) throw new Error(`auth.admin.createUser failed: ${error.message}`)
    userId = data.user.id
    console.log('Created auth user:', userId)
    console.log('Temporary password (share securely with teacher):', tempPassword)
  } else {
    console.log('Auth user already exists:', userId)
  }

  const { error: upsertError } = await admin
    .schema('admin')
    .from('users')
    .upsert({
      id: userId,
      email: EMAIL,
      full_name: FULL_NAME,
      role: ROLE,
      is_deleted: false,
    })

  if (upsertError) {
    throw new Error(`admin.users upsert failed: ${upsertError.message}`)
  }

  const { data: row, error: selectError } = await admin
    .schema('admin')
    .from('users')
    .select('id, email, full_name, role, is_deleted, created_at')
    .eq('id', userId)
    .single()

  if (selectError) throw new Error(`verification select failed: ${selectError.message}`)

  console.log('admin.users row:', row)
  console.log('Done. Teacher can sign in and should land on /teacher/dashboard')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
