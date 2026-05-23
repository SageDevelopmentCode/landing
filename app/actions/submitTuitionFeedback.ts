'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed, createTuitionFeedbackEmbed } from '@/app/lib/discord'

export async function submitTuitionFeedback(data: {
  rating: number
  message: string
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: feedback, error: insertError } = await adminClient
    .schema('admin')
    .from('tuition_feedback')
    .insert({
      parent_id: user.id,
      rating: data.rating,
      message: data.message.trim() || null,
    })
    .select()
    .single()

  if (insertError) {
    void sendDiscordNotification(createErrorEmbed({
      context: 'submitTuitionFeedback – DB Insert',
      error: insertError.message,
      details: { parentId: user.id },
    })).catch(() => {})
    return { error: insertError.message }
  }

  const { data: parentProfile } = await adminClient
    .schema('admin')
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  void sendDiscordNotification(createTuitionFeedbackEmbed({
    parentName: parentProfile?.full_name ?? 'Unknown',
    parentEmail: parentProfile?.email ?? user.email ?? 'Unknown',
    rating: data.rating,
    message: data.message || null,
    feedbackId: feedback.id,
  })).catch(() => {})

  return { success: true }
}
