'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export async function deleteHealthInfoForm(path: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient.schema('admin').from('users').select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'super_admin') return { error: 'Forbidden' }

  const { error } = await adminClient.storage
    .from('health-info-forms')
    .remove([path])

  if (error) return { error: error.message }
  return { success: true }
}
