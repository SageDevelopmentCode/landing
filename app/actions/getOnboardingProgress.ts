'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export async function getOnboardingProgress(): Promise<string[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .schema('parent_app')
    .from('onboarding_checklist')
    .select('completed')
    .eq('parent_id', user.id)
    .single()

  return data?.completed ?? []
}

export async function getOnboardingProgressForParent(parentId: string): Promise<string[]> {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .schema('parent_app')
    .from('onboarding_checklist')
    .select('completed')
    .eq('parent_id', parentId)
    .single()

  return data?.completed ?? []
}
