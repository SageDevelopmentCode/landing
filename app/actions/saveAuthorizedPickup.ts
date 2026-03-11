'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

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

export async function saveAuthorizedPickup(payload: AuthorizedPickupPayload) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!payload.studentId?.trim()) return { error: 'Missing student ID' }

  const adminClient = createAdminClient()

  // 1. Upsert the plan row
  const { data, error: planError } = await adminClient
    .schema('parent_app')
    .from('student_authorized_pickup_plan')
    .upsert(
      {
        parent_id: user.id,
        student_id: payload.studentId,
        date_of_request: payload.dateOfRequest || null,
        effective_until: payload.effectiveUntil || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'parent_id,student_id' }
    )
    .select()
    .single()

  if (planError) return { error: planError.message }

  // 2. Delete existing persons for this student
  const { error: deleteError } = await adminClient
    .schema('parent_app')
    .from('student_authorized_pickup_persons')
    .delete()
    .eq('parent_id', user.id)
    .eq('student_id', payload.studentId)

  if (deleteError) return { error: deleteError.message }

  // 3. Insert new persons rows
  if (payload.persons.length > 0) {
    const rows = payload.persons.map((p, i) => ({
      parent_id: user.id,
      student_id: payload.studentId,
      sort_order: i,
      full_name: p.fullName,
      relationship: p.relationship || null,
      phone: p.phone || null,
      email: p.email || null,
      dl_state_id_number: p.dlStateIdNumber || null,
      vehicle_info: p.vehicleInfo || null,
      license_plate_state: p.licensePlateState || null,
    }))

    const { error: insertError } = await adminClient
      .schema('parent_app')
      .from('student_authorized_pickup_persons')
      .insert(rows)

    if (insertError) return { error: insertError.message }
  }

  return { data }
}
