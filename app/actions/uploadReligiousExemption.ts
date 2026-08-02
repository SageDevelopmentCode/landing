'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import { assertCanActAsParent } from '@/app/lib/parent-access'

export async function uploadReligiousExemption(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parentId = formData.get('parentId') as string
  const studentId = formData.get('studentId') as string
  const file = formData.get('file') as File

  if (!parentId || !studentId || !file) return { error: 'Missing required fields' }

  const authError = await assertCanActAsParent(user.id, parentId)
  if (authError.error) return authError

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${parentId}/${studentId}/${timestamp}-${safeName}`

  const adminClient = createAdminClient()
  const { error } = await adminClient.storage
    .from('religious-exemption-affidavits')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'uploadReligiousExemption – Storage Upload', error: error.message, details: { parentId, studentId, path } })).catch(() => {})
    return { error: error.message }
  }
  return { path }
}
