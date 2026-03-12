'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'

export async function updateApplication(applicationId: string, fields: Record<string, string | null>) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await createAdminClient()
    .schema('parent_app')
    .from('applications')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'updateApplication – DB Update', error: error.message, details: { applicationId, userId: user.id } })).catch(() => {})
    return { error: error.message }
  }
  return { data }
}
