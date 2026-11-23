'use server'

import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { assertCanActAsParent } from '@/app/lib/parent-access'
import { loadEmergencyContacts, type ParentEmergencyContactsRecord } from '@/app/lib/get-emergency-contacts'

export type { ParentEmergencyContactsRecord }

/**
 * Emergency contacts for the signed-in parent, or for the family they have shared access to.
 * A `parentId` other than the caller's own is only honoured with an active access grant.
 */
export async function getParentEmergencyContacts(parentId?: string): Promise<ParentEmergencyContactsRecord[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const effectiveParentId = parentId ?? user.id
  const access = await assertCanActAsParent(user.id, effectiveParentId)
  if (access.error) return []

  return loadEmergencyContacts(effectiveParentId)
}
