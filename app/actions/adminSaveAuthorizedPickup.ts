'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { persistAuthorizedPickup } from '@/app/lib/persistAuthorizedPickup'
import type { AuthorizedPickupPayload } from '@/app/actions/saveAuthorizedPickup'
import { validatePickupPersonEntry } from '@/app/lib/authorizedPickupValidation'

async function assertSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not authenticated' }

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'super_admin') {
    return { ok: false as const, error: 'Forbidden' }
  }

  return { ok: true as const, adminClient, user }
}

export async function adminSaveAuthorizedPickup(
  parentId: string,
  payload: AuthorizedPickupPayload
): Promise<{ data?: unknown; error?: string }> {
  const auth = await assertSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  if (!parentId?.trim()) return { error: 'Missing parent ID' }
  if (!payload.studentId?.trim()) return { error: 'Missing student ID' }

  for (const person of payload.persons) {
    const err = validatePickupPersonEntry(person)
    if (err) return { error: err }
  }

  const { adminClient, user } = auth

  const { data: student } = await adminClient
    .schema('admin')
    .from('students')
    .select('id')
    .eq('id', payload.studentId)
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (!student) return { error: 'Student not found' }

  return persistAuthorizedPickup(adminClient, parentId, payload, {
    context: 'Admin Authorized Pickup',
    userId: user.id,
    userEmail: user.email,
  })
}
