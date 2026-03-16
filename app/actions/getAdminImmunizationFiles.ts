'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export async function getAdminImmunizationFiles(parentId: string, studentId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', files: [] }

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient.schema('admin').from('users').select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'super_admin') return { error: 'Forbidden', files: [] }

  const { data, error } = await adminClient.storage
    .from('immunization-records')
    .list(`${parentId}/${studentId}`, { sortBy: { column: 'created_at', order: 'asc' } })

  if (error) return { error: error.message, files: [] }
  return { files: (data ?? []).filter((f) => f.name !== '.emptyFolderPlaceholder') }
}
