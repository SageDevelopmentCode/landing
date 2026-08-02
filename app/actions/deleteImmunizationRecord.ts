'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { assertCanActAsParent } from '@/app/lib/parent-access'

export async function deleteImmunizationRecord(path: string, parentId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const authError = await assertCanActAsParent(user.id, parentId)
  if (authError.error) return authError

  // Ensure the path belongs to this parent
  if (!path.startsWith(`${parentId}/`)) return { error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.storage
    .from('immunization-records')
    .remove([path])

  if (error) return { error: error.message }
  return { success: true }
}
