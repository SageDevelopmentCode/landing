'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export async function saveOnboardingProgress(completed: string[]) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('parent_app')
    .from('onboarding_checklist')
    .upsert(
      { parent_id: user.id, completed, updated_at: new Date().toISOString() },
      { onConflict: 'parent_id' }
    )

  if (error) return { error: error.message }
  return { ok: true }
}
