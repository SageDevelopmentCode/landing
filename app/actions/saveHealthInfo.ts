'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export interface HealthInfoPayload {
  studentId: string
  inStateContactName: string
  inStateContactRelation: string
  inStateContactPhone: string
  outOfStateContactName: string
  outOfStateContactRelation: string
  outOfStateContactPhone: string
  physicianName: string
  clinicName: string
  physicianPhone: string
  insuranceProvider: string
  policyNumber: string
  groupNumber: string
  preferredHospital: string
  healthConditions: string
  ongoingCare: boolean
  ongoingCareDescription: string
  emergencyMedicationRequired: boolean
  emergencyMedicationDescription: string
  immunizationStatus: 'record' | 'exemption' | null
}

export async function saveHealthInfo(payload: HealthInfoPayload) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!payload.studentId?.trim()) return { error: 'Missing student ID' }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('parent_app')
    .from('student_health_info')
    .upsert(
      {
        parent_id: user.id,
        student_id: payload.studentId,
        in_state_contact_name: payload.inStateContactName || null,
        in_state_contact_relation: payload.inStateContactRelation || null,
        in_state_contact_phone: payload.inStateContactPhone || null,
        out_of_state_contact_name: payload.outOfStateContactName || null,
        out_of_state_contact_relation: payload.outOfStateContactRelation || null,
        out_of_state_contact_phone: payload.outOfStateContactPhone || null,
        physician_name: payload.physicianName || null,
        clinic_name: payload.clinicName || null,
        physician_phone: payload.physicianPhone || null,
        insurance_provider: payload.insuranceProvider || null,
        policy_number: payload.policyNumber || null,
        group_number: payload.groupNumber || null,
        preferred_hospital: payload.preferredHospital || null,
        health_conditions: payload.healthConditions || null,
        ongoing_care: payload.ongoingCare,
        ongoing_care_description: payload.ongoingCareDescription || null,
        emergency_medication_required: payload.emergencyMedicationRequired,
        emergency_medication_description: payload.emergencyMedicationDescription || null,
        immunization_status: payload.immunizationStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'parent_id,student_id' }
    )
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}
