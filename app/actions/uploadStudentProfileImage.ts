'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export async function uploadStudentProfileImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const studentId = formData.get('studentId') as string
  const file = formData.get('file') as File
  if (!studentId || !file) return { error: 'Missing fields' }

  const adminClient = createAdminClient()

  // Verify this student belongs to the authenticated parent
  const { data: student } = await adminClient
    .schema('admin')
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .single()

  if (!student) return { error: 'Unauthorized' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `students/${studentId}/profile.${ext}`

  const { error: uploadError } = await adminClient.storage
    .from('profile-images')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = adminClient.storage
    .from('profile-images')
    .getPublicUrl(path)

  const { error: dbError } = await adminClient
    .schema('admin')
    .from('students')
    .update({ profile_image_url: publicUrl })
    .eq('id', studentId)

  if (dbError) return { error: dbError.message }

  return { url: publicUrl }
}
