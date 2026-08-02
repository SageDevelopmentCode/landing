'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import { assertCanActAsParent } from '@/app/lib/parent-access'

export async function listReligiousExemptions(parentId: string, studentId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', files: [] }

  const authError = await assertCanActAsParent(user.id, parentId)
  if (authError.error) return { error: 'Unauthorized', files: [] }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.storage
    .from('religious-exemption-affidavits')
    .list(`${parentId}/${studentId}`, { sortBy: { column: 'created_at', order: 'asc' } })

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'listReligiousExemptions – Storage List', error: error.message, details: { parentId, studentId } })).catch(() => {})
    return { error: error.message, files: [] }
  }
  return { files: data ?? [] }
}
