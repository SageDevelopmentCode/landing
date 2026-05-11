'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'

export async function uploadProfileImage(formData: FormData): Promise<{ url: string } | { error: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File
  if (!file) return { error: 'Missing file' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/profile.${ext}`

  const adminClient = createAdminClient()

  const { error: uploadError } = await adminClient.storage
    .from('profile-images')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (uploadError) {
    void sendDiscordNotification(createErrorEmbed({ context: 'uploadProfileImage – Storage Upload', error: uploadError.message, details: { userId: user.id, path } })).catch(() => {})
    return { error: uploadError.message }
  }

  const { data: { publicUrl } } = adminClient.storage
    .from('profile-images')
    .getPublicUrl(path)

  const { error: dbError } = await adminClient
    .schema('admin')
    .from('users')
    .update({ profile_image_url: publicUrl })
    .eq('id', user.id)

  if (dbError) {
    void sendDiscordNotification(createErrorEmbed({ context: 'uploadProfileImage – DB Update', error: dbError.message, details: { userId: user.id } })).catch(() => {})
    return { error: dbError.message }
  }

  return { url: publicUrl }
}
