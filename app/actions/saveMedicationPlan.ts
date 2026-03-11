'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

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

  const adminClient = createAdminClient()

  // 1. Upsert the plan row
  const { data, error: planError } = await adminClient
    .schema('parent_app')
    .from('student_medication_plan')
    .upsert(
      {
        parent_id: user.id,
        student_id: payload.studentId,
        emergency_procedure: payload.emergencyProcedure || null,
        special_instructions: payload.specialInstructions || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'parent_id,student_id' }
    )
    .select()
    .single()

  if (planError) return { error: planError.message }

  // 2. Delete existing medication rows for this student
  const { error: deleteError } = await adminClient
    .schema('parent_app')
    .from('student_medications')
    .delete()
    .eq('parent_id', user.id)
    .eq('student_id', payload.studentId)

  if (deleteError) return { error: deleteError.message }

  // 3. Insert new medication rows
  if (payload.medications.length > 0) {
    const rows = payload.medications.map((m, i) => ({
      parent_id: user.id,
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

    if (insertError) return { error: insertError.message }
  }

  return { data }
}
