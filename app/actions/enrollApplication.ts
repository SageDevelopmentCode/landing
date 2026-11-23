'use server'

import { createAdminClient, createServerSupabaseClient } from '@/app/lib/supabase-server'
import { resolveActingParentId } from '@/app/lib/parent-access'
import {
  CONTRACT_1_ID,
  CONTRACT_1_TOTAL_SECTIONS,
  CONTRACT_2_ID,
  CONTRACT_2_TOTAL_SECTIONS,
  CONTRACT_3_ID,
  CONTRACT_3_TOTAL_SECTIONS,
  CONTRACT_5_ID,
  CONTRACT_5_TOTAL_SECTIONS,
  CONTRACT_6_ID,
  CONTRACT_6_TOTAL_SECTIONS,
  CONTRACT_8_ID,
  CONTRACT_8_TOTAL_SECTIONS,
} from '@/app/types/enrollment-signatures'

/** Contracts that must be fully signed before a parent can self-enroll (same as the checklist's required rows). */
const REQUIRED_CONTRACTS: [number, number][] = [
  [CONTRACT_1_ID, CONTRACT_1_TOTAL_SECTIONS],
  [CONTRACT_2_ID, CONTRACT_2_TOTAL_SECTIONS],
  [CONTRACT_3_ID, CONTRACT_3_TOTAL_SECTIONS],
  [CONTRACT_8_ID, CONTRACT_8_TOTAL_SECTIONS],
  [CONTRACT_5_ID, CONTRACT_5_TOTAL_SECTIONS],
  [CONTRACT_6_ID, CONTRACT_6_TOTAL_SECTIONS],
]

/**
 * Marks an application `enrolled`.
 * - Super admins (Applications sidebar) can enroll any application.
 * - Parents (or users with shared dashboard access) can only enroll their own approved
 *   application, and only once every required checklist item is complete on the server.
 */
export async function enrollApplication(applicationId: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!applicationId?.trim()) return { error: 'Missing application ID' }

  const adminClient = createAdminClient()

  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const isSuperAdmin = adminUser?.role === 'super_admin'

  if (!isSuperAdmin) {
    const actingParentId = await resolveActingParentId(user.id)
    const { data: app } = await adminClient
      .schema('parent_app')
      .from('applications')
      .select('id, user_id, student_id, approved, status, registration_fee_paid')
      .eq('id', applicationId)
      .maybeSingle()

    if (!app || app.user_id !== actingParentId || !app.approved || !app.student_id) {
      return { error: 'Unauthorized' }
    }
    if (app.status === 'enrolled') return { success: true }

    const complete = await isChecklistComplete(actingParentId, app.student_id, !!app.registration_fee_paid)
    if (!complete) return { error: 'Enrollment checklist is not complete yet.' }
  }

  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update({ status: 'enrolled' })
    .eq('id', applicationId)
  if (error) return { error: error.message }
  return { success: true }
}

async function isChecklistComplete(parentId: string, studentId: string, feePaid: boolean): Promise<boolean> {
  if (!feePaid) return false

  const adminClient = createAdminClient()
  const [{ data: sigs }, { data: files }] = await Promise.all([
    adminClient
      .schema('parent_app')
      .from('enrollment_signatures')
      .select('contract_id, section_id')
      .eq('parent_id', parentId)
      .eq('student_id', studentId),
    adminClient.storage.from('immunization-records').list(`${parentId}/${studentId}`),
  ])

  const immunizationCount = (files ?? []).filter((f) => f.name !== '.emptyFolderPlaceholder').length
  if (immunizationCount === 0) return false

  const signed = new Set((sigs ?? []).map((s) => `${s.contract_id}-${s.section_id}`))
  return REQUIRED_CONTRACTS.every(([contractId, total]) => {
    for (let i = 1; i <= total; i++) if (!signed.has(`${contractId}-${i}`)) return false
    return true
  })
}
