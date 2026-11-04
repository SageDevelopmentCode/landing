import { createAdminClient, createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function assertSuperAdmin():
  | Promise<{ ok: true }>
  | Promise<{ ok: false; error: string }> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'super_admin') {
    return { ok: false, error: 'Unauthorized' }
  }

  return { ok: true }
}
