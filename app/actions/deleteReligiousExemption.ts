'use server'

import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'

export async function deleteReligiousExemption(path: string, parentId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (parentId !== user.id) return { error: 'Unauthorized' }

  if (!path.startsWith(`${parentId}/`)) return { error: 'Unauthorized' }

  const { error } = await supabase.storage
    .from('religious-exemption-affidavits')
    .remove([path])

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'deleteReligiousExemption – Storage Remove', error: error.message, details: { path, parentId } })).catch(() => {})
    return { error: error.message }
  }
  return { success: true }
}
