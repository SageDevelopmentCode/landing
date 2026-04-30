'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createDropOffTimeEmbed } from '@/app/lib/discord'

export async function saveDropOffTime(slot: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  // Check if a row already exists to know if this is an update
  const { data: existing } = await adminClient
    .schema('parent_app')
    .from('dropoff_times')
    .select('slot')
    .eq('parent_id', user.id)
    .maybeSingle()

  const { error } = await adminClient
    .schema('parent_app')
    .from('dropoff_times')
    .upsert(
      { parent_id: user.id, slot, updated_at: new Date().toISOString() },
      { onConflict: 'parent_id' }
    )

  if (error) return { error: error.message }

  // Fetch parent name for the notification
  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  sendDiscordNotification(
    createDropOffTimeEmbed({
      parentName: adminUser?.full_name ?? 'Unknown',
      parentEmail: user.email ?? 'Unknown',
      slot,
      isUpdate: existing !== null,
    })
  )

  return { ok: true }
}
