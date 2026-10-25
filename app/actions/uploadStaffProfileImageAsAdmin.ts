'use server'

import {
  createServerSupabaseClient,
  createAdminClient,
} from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'

const STAFF_ROLES = new Set(['teacher', 'super_admin', 'teacher_aide'])

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

  return { ok: true as const, adminClient, adminUserId: user.id }
}

export async function uploadStaffProfileImageAsAdmin(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const auth = await assertSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const userId = (formData.get('userId') as string)?.trim()
  const file = formData.get('file') as File
  if (!userId || !file) return { error: 'Missing fields' }

  const { data: targetUser, error: targetError } = await auth.adminClient
    .schema('admin')
    .from('users')
    .select('id, role, is_deleted')
    .eq('id', userId)
    .single()

  if (targetError || !targetUser) {
    return { error: 'User not found' }
  }

  if (targetUser.is_deleted) {
    return { error: 'User is deleted' }
  }

  if (!targetUser.role || !STAFF_ROLES.has(targetUser.role)) {
    return { error: 'User is not staff' }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/profile.${ext}`

  const { error: uploadError } = await auth.adminClient.storage
    .from('profile-images')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (uploadError) {
    void sendDiscordNotification(
      createErrorEmbed({
        context: 'uploadStaffProfileImageAsAdmin – Storage Upload',
        error: uploadError.message,
        details: { adminUserId: auth.adminUserId, userId, path },
      }),
    ).catch(() => {})
    return { error: uploadError.message }
  }

  const {
    data: { publicUrl },
  } = auth.adminClient.storage.from('profile-images').getPublicUrl(path)

  const { error: dbError } = await auth.adminClient
    .schema('admin')
    .from('users')
    .update({ profile_image_url: publicUrl })
    .eq('id', userId)

  if (dbError) {
    void sendDiscordNotification(
      createErrorEmbed({
        context: 'uploadStaffProfileImageAsAdmin – DB Update',
        error: dbError.message,
        details: { adminUserId: auth.adminUserId, userId },
      }),
    ).catch(() => {})
    return { error: dbError.message }
  }

  return { url: publicUrl }
}
