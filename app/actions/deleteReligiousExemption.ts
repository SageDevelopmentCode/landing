'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import { assertCanActAsParent } from '@/app/lib/parent-access'

export async function deleteReligiousExemption(path: string, parentId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const authError = await assertCanActAsParent(user.id, parentId)
  if (authError.error) return authError

  if (!path.startsWith(`${parentId}/`)) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.storage
    .from('religious-exemption-affidavits')
    .remove([path])

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'deleteReligiousExemption – Storage Remove', error: error.message, details: { path, parentId } })).catch(() => {})
    return { error: error.message }
  }
  return { success: true }
}
