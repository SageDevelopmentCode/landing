'use server'
import { createAdminClient } from '@/app/lib/supabase-server'
import type { StudentSignatureMap } from '@/app/types/enrollment-signatures'
import type { Database } from '@/app/types/database.types'

export type StudentHealthInfo = Database['parent_app']['Tables']['student_health_info']['Row']
export type StudentMedicationPlan = Database['parent_app']['Tables']['student_medication_plan']['Row']
export type StudentMedication = Database['parent_app']['Tables']['student_medications']['Row']
export type StudentAuthorizedPickupPlan = Database['parent_app']['Tables']['student_authorized_pickup_plan']['Row']
export type StudentAuthorizedPickupPerson = Database['parent_app']['Tables']['student_authorized_pickup_persons']['Row']

export type AdminEnrollmentData = {
  signaturesByStudent: StudentSignatureMap
  immunizationFileCountByStudent: Record<string, number>
  religiousExemptionCountByStudent: Record<string, number>
  healthInfoByStudent: Record<string, StudentHealthInfo | null>
  medicationPlanByStudent: Record<string, { plan: StudentMedicationPlan | null; medications: StudentMedication[] }>
  photoConsentByStudent: Record<string, string | null>
  authorizedPickupByStudent: Record<string, { plan: StudentAuthorizedPickupPlan | null; persons: StudentAuthorizedPickupPerson[] }>
  healthStatementByStudent: Record<string, { option_type: string } | null>
}

export async function getAdminEnrollmentData(
  parentId: string,
  studentIds: string[]
): Promise<AdminEnrollmentData> {
  const adminClient = createAdminClient()

  const [
    sigsResult,
    healthStatementResult,
    immunizationCounts,
    religiousExemptionCounts,
    healthInfoResult,
    medicationPlanResult,
    medicationsResult,
    photoConsentResult,
    pickupPlanResult,
    pickupPersonsResult,
  ] = await Promise.all([
    adminClient
      .schema('parent_app')
      .from('enrollment_signatures')
      .select('*')
      .eq('parent_id', parentId)
      .in('student_id', studentIds),
    adminClient
      .schema('parent_app')
      .from('student_health_statement')
      .select('student_id, option_type')
      .eq('parent_id', parentId)
      .in('student_id', studentIds),
    Promise.all(
      studentIds.map(async (sid) => {
        const { data } = await adminClient.storage
          .from('immunization-records')
          .list(`${parentId}/${sid}`)
        const count = (data ?? []).filter((f) => f.name !== '.emptyFolderPlaceholder').length
        return { sid, count }
      })
    ),
    Promise.all(
      studentIds.map(async (sid) => {
        const { data } = await adminClient.storage
          .from('religious-exemption-affidavits')
          .list(`${parentId}/${sid}`)
        const count = (data ?? []).filter((f) => f.name !== '.emptyFolderPlaceholder').length
        return { sid, count }
      })
    ),
    adminClient
      .schema('parent_app')
      .from('student_health_info')
      .select('*')
      .eq('parent_id', parentId)
      .in('student_id', studentIds),
    adminClient
      .schema('parent_app')
      .from('student_medication_plan')
      .select('*')
      .eq('parent_id', parentId)
      .in('student_id', studentIds),
    adminClient
      .schema('parent_app')
      .from('student_medications')
      .select('*')
      .eq('parent_id', parentId)
      .in('student_id', studentIds),
    adminClient
      .schema('parent_app')
      .from('student_photo_release_consent')
      .select('student_id, consent_level')
      .eq('parent_id', parentId)
      .in('student_id', studentIds),
    adminClient
      .schema('parent_app')
      .from('student_authorized_pickup_plan')
      .select('*')
      .eq('parent_id', parentId)
      .in('student_id', studentIds),
    adminClient
      .schema('parent_app')
      .from('student_authorized_pickup_persons')
      .select('*')
      .eq('parent_id', parentId)
      .in('student_id', studentIds),
  ])

  const sigs = sigsResult.data ?? []
  const signaturesByStudent: StudentSignatureMap = {}
  for (const sig of sigs) {
    signaturesByStudent[sig.student_id] ??= {}
    signaturesByStudent[sig.student_id][`${sig.contract_id}-${sig.section_id}`] = sig
  }

  const immunizationFileCountByStudent: Record<string, number> = {}
  for (const { sid, count } of immunizationCounts) {
    immunizationFileCountByStudent[sid] = count
  }

  const religiousExemptionCountByStudent: Record<string, number> = {}
  for (const { sid, count } of religiousExemptionCounts) {
    religiousExemptionCountByStudent[sid] = count
  }

  const healthInfoByStudent: Record<string, StudentHealthInfo | null> = {}
  for (const sid of studentIds) healthInfoByStudent[sid] = null
  for (const row of healthInfoResult.data ?? []) {
    healthInfoByStudent[row.student_id] = row
  }

  const medicationPlanByStudent: Record<string, { plan: StudentMedicationPlan | null; medications: StudentMedication[] }> = {}
  for (const sid of studentIds) medicationPlanByStudent[sid] = { plan: null, medications: [] }
  for (const plan of medicationPlanResult.data ?? []) {
    medicationPlanByStudent[plan.student_id] = { plan, medications: [] }
  }
  for (const med of medicationsResult.data ?? []) {
    if (medicationPlanByStudent[med.student_id]) {
      medicationPlanByStudent[med.student_id].medications.push(med)
    }
  }

  const photoConsentByStudent: Record<string, string | null> = {}
  for (const sid of studentIds) photoConsentByStudent[sid] = null
  for (const row of photoConsentResult.data ?? []) {
    photoConsentByStudent[row.student_id] = row.consent_level
  }

  const authorizedPickupByStudent: Record<string, { plan: StudentAuthorizedPickupPlan | null; persons: StudentAuthorizedPickupPerson[] }> = {}
  for (const sid of studentIds) authorizedPickupByStudent[sid] = { plan: null, persons: [] }
  for (const plan of pickupPlanResult.data ?? []) {
    authorizedPickupByStudent[plan.student_id] = { plan, persons: [] }
  }
  for (const person of pickupPersonsResult.data ?? []) {
    if (authorizedPickupByStudent[person.student_id]) {
      authorizedPickupByStudent[person.student_id].persons.push(person)
    }
  }

  const healthStatementByStudent: Record<string, { option_type: string } | null> = {}
  for (const sid of studentIds) healthStatementByStudent[sid] = null
  for (const row of healthStatementResult.data ?? []) {
    healthStatementByStudent[row.student_id] = { option_type: row.option_type }
  }

  return {
    signaturesByStudent,
    immunizationFileCountByStudent,
    religiousExemptionCountByStudent,
    healthInfoByStudent,
    medicationPlanByStudent,
    photoConsentByStudent,
    authorizedPickupByStudent,
    healthStatementByStudent,
  }
}
