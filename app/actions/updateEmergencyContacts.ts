'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import { assertStudentBelongsToParent, resolveActingParentId } from '@/app/lib/parent-access'

export interface UpdateEmergencyContactsPayload {
  studentId: string
  inStateContactName: string
  inStateContactRelation: string
  inStateContactPhone: string
  outOfStateContactName: string
  outOfStateContactRelation: string
  outOfStateContactPhone: string
}

export async function updateEmergencyContacts(payload: UpdateEmergencyContactsPayload) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!payload.studentId?.trim()) return { error: 'Missing student ID' }

  const actingParentId = await resolveActingParentId(user.id)
  const ownershipError = await assertStudentBelongsToParent(payload.studentId, actingParentId)
  if (ownershipError.error) return { error: ownershipError.error }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('parent_app')
    .from('student_health_info')
    .upsert(
      {
        parent_id: actingParentId,
        student_id: payload.studentId,
        in_state_contact_name: payload.inStateContactName || null,
        in_state_contact_relation: payload.inStateContactRelation || null,
        in_state_contact_phone: payload.inStateContactPhone || null,
        out_of_state_contact_name: payload.outOfStateContactName || null,
        out_of_state_contact_relation: payload.outOfStateContactRelation || null,
        out_of_state_contact_phone: payload.outOfStateContactPhone || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'parent_id,student_id' }
    )
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
        context: 'Emergency Contacts – DB Save',
        error: error.message,
        details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': payload.studentId },
      }))
    })().catch(() => {})
    return { error: error.message }
  }
  return { data }
}
