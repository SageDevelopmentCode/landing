'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import { assertStudentBelongsToParent, resolveActingParentId } from '@/app/lib/parent-access'

export interface MedicationEntry {
  medicationName: string
  conditionReason: string
  dosageFrequency: string
  physicianName: string
  physicianPhone: string
  expirationDate: string
  isDaily: boolean
  isEmergencyOnly: boolean
}

export interface MedicationPlanPayload {
  studentId: string
  medications: MedicationEntry[]
  emergencyProcedure: string
  specialInstructions: string
}

export async function saveMedicationPlan(payload: MedicationPlanPayload) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!payload.studentId?.trim()) return { error: 'Missing student ID' }

  const actingParentId = await resolveActingParentId(user.id)
  const ownershipError = await assertStudentBelongsToParent(payload.studentId, actingParentId)
  if (ownershipError.error) return ownershipError

  const adminClient = createAdminClient()

  // 1. Upsert the plan row
  const { data, error: planError } = await adminClient
    .schema('parent_app')
    .from('student_medication_plan')
    .upsert(
      {
        parent_id: actingParentId,
        student_id: payload.studentId,
        emergency_procedure: payload.emergencyProcedure || null,
        special_instructions: payload.specialInstructions || null,
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
        context: 'Medication Plan – Upsert Plan',
        error: planError.message,
        details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': payload.studentId },
      }))
    })().catch(() => {})
    return { error: planError.message }
  }

  // 2. Delete existing medication rows for this student
  const { error: deleteError } = await adminClient
    .schema('parent_app')
    .from('student_medications')
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
        context: 'Medication Plan – Delete Old Medications',
        error: deleteError.message,
        details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': payload.studentId },
      }))
    })().catch(() => {})
    return { error: deleteError.message }
  }

  // 3. Insert new medication rows
  if (payload.medications.length > 0) {
    const rows = payload.medications.map((m, i) => ({
      parent_id: actingParentId,
      student_id: payload.studentId,
      medication_name: m.medicationName,
      condition_reason: m.conditionReason || null,
      dosage_frequency: m.dosageFrequency || null,
      physician_name: m.physicianName || null,
      physician_phone: m.physicianPhone || null,
      expiration_date: m.expirationDate || null,
      is_daily: m.isDaily,
      is_emergency_only: m.isEmergencyOnly,
      sort_order: i,
    }))

    const { error: insertError } = await adminClient
      .schema('parent_app')
      .from('student_medications')
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
          context: 'Medication Plan – Insert Medications',
          error: insertError.message,
          details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': payload.studentId },
        }))
      })().catch(() => {})
      return { error: insertError.message }
    }
  }

  return { data }
}
