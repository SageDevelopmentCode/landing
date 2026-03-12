'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'

export async function listImmunizationRecords(parentId: string, studentId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', files: [] }
  if (parentId !== user.id) return { error: 'Unauthorized', files: [] }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.storage
    .from('immunization-records')
    .list(`${parentId}/${studentId}`, { sortBy: { column: 'created_at', order: 'asc' } })

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'listImmunizationRecords – Storage List', error: error.message, details: { parentId, studentId } })).catch(() => {})
    return { error: error.message, files: [] }
  }
  return { files: data ?? [] }
}
