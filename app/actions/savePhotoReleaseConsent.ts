'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

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

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .schema('parent_app')
    .from('student_photo_release_consent')
    .upsert(
      {
        parent_id: user.id,
        student_id: studentId,
        consent_level: consentLevel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'parent_id,student_id' }
    )
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}
