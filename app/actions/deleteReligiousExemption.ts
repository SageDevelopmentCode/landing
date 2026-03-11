'use server'

import { createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function deleteReligiousExemption(path: string, parentId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (parentId !== user.id) return { error: 'Unauthorized' }

  if (!path.startsWith(`${parentId}/`)) return { error: 'Unauthorized' }

  const { error } = await supabase.storage
    .from('religious-exemption-affidavits')
    .remove([path])

  if (error) return { error: error.message }
  return { success: true }
}
