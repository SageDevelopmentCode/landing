'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import { assertStudentBelongsToParent, resolveActingParentId } from '@/app/lib/parent-access'

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

  const actingParentId = await resolveActingParentId(user.id)
  const ownershipError = await assertStudentBelongsToParent(payload.studentId, actingParentId)
  if (ownershipError.error) return { error: ownershipError.error }

  const adminClient = createAdminClient()

  // 1. Upsert the plan row
  const { data, error: planError } = await adminClient
    .schema('parent_app')
    .from('student_authorized_pickup_plan')
    .upsert(
      {
        parent_id: actingParentId,
        student_id: payload.studentId,
        date_of_request: payload.dateOfRequest || null,
        effective_until: payload.effectiveUntil || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'parent_id,student_id' }
    )
    .select()
    .single()

  if (planError) {
    void (async () => {
      let parentName = 'N/A', childName = 'N/A'
      try {
        const [{ data: u }, { data: s }] = await Promise.all([
          adminClient.schema('admin').from('users').select('full_name').eq('id', user.id).single(),
          adminClient.schema('admin').from('students').select('child_legal_name').eq('id', payload.studentId).single(),
        ])
        parentName = u?.full_name ?? 'N/A'
        childName = s?.child_legal_name ?? 'N/A'
      } catch {}
      await sendDiscordNotification(createErrorEmbed({
        context: 'Authorized Pickup – Upsert Plan',
        error: planError.message,
        details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': payload.studentId },
      }))
    })().catch(() => {})
    return { error: planError.message }
  }

  // 2. Delete existing persons for this student
  const { error: deleteError } = await adminClient
    .schema('parent_app')
    .from('student_authorized_pickup_persons')
    .delete()
    .eq('parent_id', actingParentId)
    .eq('student_id', payload.studentId)

  if (deleteError) {
    void (async () => {
      let parentName = 'N/A', childName = 'N/A'
      try {
        const [{ data: u }, { data: s }] = await Promise.all([
          adminClient.schema('admin').from('users').select('full_name').eq('id', user.id).single(),
          adminClient.schema('admin').from('students').select('child_legal_name').eq('id', payload.studentId).single(),
        ])
        parentName = u?.full_name ?? 'N/A'
        childName = s?.child_legal_name ?? 'N/A'
      } catch {}
      await sendDiscordNotification(createErrorEmbed({
        context: 'Authorized Pickup – Delete Old Persons',
        error: deleteError.message,
        details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': payload.studentId },
      }))
    })().catch(() => {})
    return { error: deleteError.message }
  }

  // 3. Insert new persons rows
  if (payload.persons.length > 0) {
    const rows = payload.persons.map((p, i) => ({
      parent_id: actingParentId,
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

    if (insertError) {
      void (async () => {
        let parentName = 'N/A', childName = 'N/A'
        try {
          const [{ data: u }, { data: s }] = await Promise.all([
            adminClient.schema('admin').from('users').select('full_name').eq('id', user.id).single(),
            adminClient.schema('admin').from('students').select('child_legal_name').eq('id', payload.studentId).single(),
          ])
          parentName = u?.full_name ?? 'N/A'
          childName = s?.child_legal_name ?? 'N/A'
        } catch {}
        await sendDiscordNotification(createErrorEmbed({
          context: 'Authorized Pickup – Insert Persons',
          error: insertError.message,
          details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': payload.studentId },
        }))
      })().catch(() => {})
      return { error: insertError.message }
    }
  }

  return { data }
}
