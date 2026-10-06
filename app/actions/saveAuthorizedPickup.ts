'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { assertStudentBelongsToParent, resolveActingParentId } from '@/app/lib/parent-access'
import { persistAuthorizedPickup } from '@/app/lib/persistAuthorizedPickup'

export interface PickupPersonEntry {
  fullName: string
  relationship: string
  phone: string
  email: string
  dlStateIdNumber: string
  vehicleInfo: string
  licensePlateState: string
}

export interface AuthorizedPickupPayload {
  studentId: string
  dateOfRequest: string
  effectiveUntil: string
  persons: PickupPersonEntry[]
}

import type { Database } from '@/app/types/database.types'

type AuthorizedPickupPlanRow =
  Database['parent_app']['Tables']['student_authorized_pickup_plan']['Row']

export async function saveAuthorizedPickup(payload: AuthorizedPickupPayload) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!payload.studentId?.trim()) return { error: 'Missing student ID' }

  const actingParentId = await resolveActingParentId(user.id)
  const ownershipError = await assertStudentBelongsToParent(payload.studentId, actingParentId)
  if (ownershipError.error) return { error: ownershipError.error }

  const adminClient = createAdminClient()

  return persistAuthorizedPickup(adminClient, actingParentId, payload, {
    context: 'Authorized Pickup',
    userId: user.id,
    userEmail: user.email,
  }) as Promise<{ data?: AuthorizedPickupPlanRow; error?: string }>
}
