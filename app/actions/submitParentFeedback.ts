'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed, createParentFeedbackEmbed } from '@/app/lib/discord'

export async function submitParentFeedback(data: {
  rating: number
  categories: string[]
  message: string
  allowFollowUp: boolean
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { data: feedback, error: insertError } = await adminClient
    .schema('admin')
    .from('parent_feedback')
    .insert({
      parent_id: user.id,
      rating: data.rating,
      categories: data.categories,
      message: data.message.trim() || null,
      allow_follow_up: data.allowFollowUp,
    })
    .select()
    .single()

  if (insertError) {
    void sendDiscordNotification(createErrorEmbed({
      context: 'submitParentFeedback – DB Insert',
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

  void sendDiscordNotification(createParentFeedbackEmbed({
    parentName: parentProfile?.full_name ?? 'Unknown',
    parentEmail: parentProfile?.email ?? user.email ?? 'Unknown',
    rating: data.rating,
    categories: data.categories,
    message: data.message || null,
    allowFollowUp: data.allowFollowUp,
    feedbackId: feedback.id,
  })).catch(() => {})

  return { success: true }
}
