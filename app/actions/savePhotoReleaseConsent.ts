'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import { assertStudentBelongsToParent, resolveActingParentId } from '@/app/lib/parent-access'

export async function savePhotoReleaseConsent({
  studentId,
  consentLevel,
}: {
  studentId: string
  consentLevel: 'FULL' | 'LIMITED' | 'NO'
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!studentId?.trim()) return { error: 'Missing student ID' }

  const actingParentId = await resolveActingParentId(user.id)
  const ownershipError = await assertStudentBelongsToParent(studentId, actingParentId)
  if (ownershipError.error) return ownershipError

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .schema('parent_app')
    .from('student_photo_release_consent')
    .upsert(
      {
        parent_id: actingParentId,
        student_id: studentId,
        consent_level: consentLevel,
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
          adminClient.schema('admin').from('students').select('child_legal_name').eq('id', studentId).single(),
        ])
        parentName = u?.full_name ?? 'N/A'
        childName = s?.child_legal_name ?? 'N/A'
      } catch {}
      await sendDiscordNotification(createErrorEmbed({
        context: 'Photo Release Consent – DB Save',
        error: error.message,
        details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': studentId },
      }))
    })().catch(() => {})
    return { error: error.message }
  }
  return { data }
}
