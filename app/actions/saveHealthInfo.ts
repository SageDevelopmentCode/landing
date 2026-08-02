'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import { assertStudentBelongsToParent, resolveActingParentId } from '@/app/lib/parent-access'

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

  const actingParentId = await resolveActingParentId(user.id)
  const ownershipError = await assertStudentBelongsToParent(payload.studentId, actingParentId)
  if (ownershipError.error) return ownershipError

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('parent_app')
    .from('student_health_info')
    .upsert(
      {
        parent_id: actingParentId,
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

  if (error) {
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
        context: 'Health Info – DB Save',
        error: error.message,
        details: { 'Parent': parentName, 'Email': user.email ?? 'N/A', 'Child': childName, 'Student ID': payload.studentId },
      }))
    })().catch(() => {})
    return { error: error.message }
  }
  return { data }
}
