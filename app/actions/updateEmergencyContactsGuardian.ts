'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import { assertStudentBelongsToParent, resolveActingParentId } from '@/app/lib/parent-access'

export interface UpdateGuardianPayload {
  studentId: string
  guardian: 'g1' | 'g2'
  full_name: string
  email: string
  cell_phone: string
  work_phone: string
  relationship: string
}

export async function updateEmergencyContactsGuardian(payload: UpdateGuardianPayload) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!payload.studentId?.trim()) return { error: 'Missing student ID' }

  const actingParentId = await resolveActingParentId(user.id)
  const ownershipError = await assertStudentBelongsToParent(payload.studentId, actingParentId)
  if (ownershipError.error) return ownershipError

  const adminClient = createAdminClient()

  const { data: appRow, error: fetchError } = await adminClient
    .schema('parent_app')
    .from('applications')
    .select('id')
    .eq('student_id', payload.studentId)
    .eq('user_id', actingParentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!appRow) return { error: 'No application found for this student' }

  const prefix = payload.guardian
  const updateFields = {
    [`${prefix}_full_name`]: payload.full_name || null,
    [`${prefix}_email`]: payload.email || null,
    [`${prefix}_cell_phone`]: payload.cell_phone || null,
    [`${prefix}_work_phone`]: payload.work_phone || null,
    [`${prefix}_relationship`]: payload.relationship || null,
  }

  const { data, error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update(updateFields)
    .eq('id', appRow.id)
    .select()
    .single()

  if (error) {
    void (async () => {
      let parentName = 'N/A', childName = 'N/A'
      try {
        const [{ data: u }, { data: s }] = await Promise.all([
          adminClient.schema('admin').from('users').select('full_name').eq('id', user.id).single(),
          adminClient.schema('admin').from('students').select('child_legal_name').eq('id', payload.studentId).single(),
        ])
        parentName = u?.full_name ?? 'N/A'
        childName = s?.child_legal_name ?? 'N/A'
      } catch {}
      await sendDiscordNotification(createErrorEmbed({
        context: `Guardian ${payload.guardian.toUpperCase()} Update – DB Save`,
        error: error.message,
        details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': payload.studentId },
      }))
    })().catch(() => {})
    return { error: error.message }
  }
  return { data }
}
