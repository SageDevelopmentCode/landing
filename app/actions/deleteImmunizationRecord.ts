'use server'

import { createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function deleteImmunizationRecord(path: string, parentId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (parentId !== user.id) return { error: 'Unauthorized' }

  // Ensure the path belongs to this parent
  if (!path.startsWith(`${parentId}/`)) return { error: 'Unauthorized' }

  const { error } = await supabase.storage
    .from('immunization-records')
    .remove([path])

  if (error) return { error: error.message }
  return { success: true }
}
