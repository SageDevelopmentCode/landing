'use server'
import { createAdminClient } from '@/app/lib/supabase-server'
import type { AdminEnrollmentData, StudentHealthInfo, StudentMedicationPlan, StudentMedication, StudentAuthorizedPickupPlan, StudentAuthorizedPickupPerson } from './getAdminEnrollmentData'
import type { StudentSignatureMap } from '@/app/types/enrollment-signatures'

/**
 * Bulk version of getAdminEnrollmentData — fetches enrollment data for multiple
 * students across multiple parents in a single pass (one DB query per table).
 * Safe to call without parent_id filters because admin client bypasses RLS.
 */
export async function getAdminEnrollmentDataBulk(
  pairs: Array<{ parentId: string; studentId: string }>
): Promise<AdminEnrollmentData> {
  if (pairs.length === 0) {
    return {
      signaturesByStudent: {},
      immunizationFileCountByStudent: {},
      religiousExemptionCountByStudent: {},
      healthInfoByStudent: {},
      medicationPlanByStudent: {},
      photoConsentByStudent: {},
      authorizedPickupByStudent: {},
      healthStatementByStudent: {},
    }
  }

  const adminClient = createAdminClient()
  const allStudentIds = pairs.map((p) => p.studentId)

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
      .in('student_id', allStudentIds),
    adminClient
      .schema('parent_app')
      .from('student_health_statement')
      .select('student_id, option_type')
      .in('student_id', allStudentIds),
    Promise.all(
      pairs.map(async ({ parentId, studentId }) => {
        const { data } = await adminClient.storage
          .from('immunization-records')
          .list(`${parentId}/${studentId}`)
        const count = (data ?? []).filter((f) => f.name !== '.emptyFolderPlaceholder').length
        return { sid: studentId, count }
      })
    ),
    Promise.all(
      pairs.map(async ({ parentId, studentId }) => {
        const { data } = await adminClient.storage
          .from('religious-exemption-affidavits')
          .list(`${parentId}/${studentId}`)
        const count = (data ?? []).filter((f) => f.name !== '.emptyFolderPlaceholder').length
        return { sid: studentId, count }
      })
    ),
    adminClient
      .schema('parent_app')
      .from('student_health_info')
      .select('*')
      .in('student_id', allStudentIds),
    adminClient
      .schema('parent_app')
      .from('student_medication_plan')
      .select('*')
      .in('student_id', allStudentIds),
    adminClient
      .schema('parent_app')
      .from('student_medications')
      .select('*')
      .in('student_id', allStudentIds),
    adminClient
      .schema('parent_app')
      .from('student_photo_release_consent')
      .select('student_id, consent_level')
      .in('student_id', allStudentIds),
    adminClient
      .schema('parent_app')
      .from('student_authorized_pickup_plan')
      .select('*')
      .in('student_id', allStudentIds),
    adminClient
      .schema('parent_app')
      .from('student_authorized_pickup_persons')
      .select('*')
      .in('student_id', allStudentIds),
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
  for (const sid of allStudentIds) healthInfoByStudent[sid] = null
  for (const row of healthInfoResult.data ?? []) {
    healthInfoByStudent[row.student_id] = row
  }

  const medicationPlanByStudent: Record<string, { plan: StudentMedicationPlan | null; medications: StudentMedication[] }> = {}
  for (const sid of allStudentIds) medicationPlanByStudent[sid] = { plan: null, medications: [] }
  for (const plan of medicationPlanResult.data ?? []) {
    medicationPlanByStudent[plan.student_id] = { plan, medications: [] }
  }
  for (const med of medicationsResult.data ?? []) {
    if (medicationPlanByStudent[med.student_id]) {
      medicationPlanByStudent[med.student_id].medications.push(med)
    }
  }

  const photoConsentByStudent: Record<string, string | null> = {}
  for (const sid of allStudentIds) photoConsentByStudent[sid] = null
  for (const row of photoConsentResult.data ?? []) {
    photoConsentByStudent[row.student_id] = row.consent_level
  }

  const authorizedPickupByStudent: Record<string, { plan: StudentAuthorizedPickupPlan | null; persons: StudentAuthorizedPickupPerson[] }> = {}
  for (const sid of allStudentIds) authorizedPickupByStudent[sid] = { plan: null, persons: [] }
  for (const plan of pickupPlanResult.data ?? []) {
    authorizedPickupByStudent[plan.student_id] = { plan, persons: [] }
  }
  for (const person of pickupPersonsResult.data ?? []) {
    if (authorizedPickupByStudent[person.student_id]) {
      authorizedPickupByStudent[person.student_id].persons.push(person)
    }
  }

  const healthStatementByStudent: Record<string, { option_type: string } | null> = {}
  for (const sid of allStudentIds) healthStatementByStudent[sid] = null
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
