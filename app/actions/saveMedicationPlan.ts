'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import { assertStudentBelongsToParent, resolveActingParentId } from '@/app/lib/parent-access'
import type { Database } from '@/app/types/database.types'

type StudentMedicationRow = Database['parent_app']['Tables']['student_medications']['Row']

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
  if (ownershipError.error) return { error: ownershipError.error }

  const adminClient = createAdminClient()

  const notifyError = async (context: string, message: string) => {
    try {
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
        context,
        error: message,
        details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': payload.studentId },
      }))
    } catch {}
  }

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
    void notifyError('Medication Plan – Upsert Plan', planError.message)
    return { error: planError.message }
  }

  // 2. Remember the current medication rows, so they can be removed by id once
  //    the replacements are safely stored (a failed insert must never wipe the plan).
  const { data: oldRows, error: listError } = await adminClient
    .schema('parent_app')
    .from('student_medications')
    .select('id')
    .eq('parent_id', actingParentId)
    .eq('student_id', payload.studentId)

  if (listError) {
    void notifyError('Medication Plan – List Old Medications', listError.message)
    return { error: listError.message }
  }

  // 3. Insert the new medication rows
  let medications: StudentMedicationRow[] = []
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

    const { data: inserted, error: insertError } = await adminClient
      .schema('parent_app')
      .from('student_medications')
      .insert(rows)
      .select()

    if (insertError) {
      void notifyError('Medication Plan – Insert Medications', insertError.message)
      return { error: insertError.message }
    }
    medications = inserted ?? []
  }

  // 4. Delete the old rows by id
  const oldIds = (oldRows ?? []).map((r) => r.id)
  if (oldIds.length > 0) {
    const { error: deleteError } = await adminClient
      .schema('parent_app')
      .from('student_medications')
      .delete()
      .in('id', oldIds)

    if (deleteError) {
      // Roll back the new rows so the plan isn't duplicated; the old rows are untouched.
      if (medications.length > 0) {
        await adminClient
          .schema('parent_app')
          .from('student_medications')
          .delete()
          .in('id', medications.map((m) => m.id))
      }
      void notifyError('Medication Plan – Delete Old Medications', deleteError.message)
      return { error: deleteError.message }
    }
  }

  return { data, medications }
}
