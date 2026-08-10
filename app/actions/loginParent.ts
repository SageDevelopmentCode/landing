'use server'
import { createAdminClient, createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function loginParent(email: string, password: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  const adminClient = createAdminClient()
  const { data: grant } = await adminClient
    .schema('parent_app')
    .from('dashboard_access_grants')
    .select('id')
    .eq('grantee_id', data.user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (grant) return { redirectTo: '/parent/home' }

  return { redirectTo: '/apply/dashboard' }
}
