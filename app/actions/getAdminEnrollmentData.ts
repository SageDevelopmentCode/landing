'use server'
import { createAdminClient } from '@/app/lib/supabase-server'
import type { StudentSignatureMap } from '@/app/types/enrollment-signatures'

export type AdminEnrollmentData = {
  signaturesByStudent: StudentSignatureMap
  immunizationFileCountByStudent: Record<string, number>
  religiousExemptionCountByStudent: Record<string, number>
}

export async function getAdminEnrollmentData(
  parentId: string,
  studentIds: string[]
): Promise<AdminEnrollmentData> {
  const adminClient = createAdminClient()

  const [sigsResult, healthStatementResult, immunizationCounts, religiousExemptionCounts] =
    await Promise.all([
      adminClient
        .schema('parent_app')
        .from('enrollment_signatures')
        .select('*')
        .eq('parent_id', parentId)
        .in('student_id', studentIds),
      adminClient
        .schema('parent_app')
        .from('student_health_statement')
        .select('*')
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

  return {
    signaturesByStudent,
    immunizationFileCountByStudent,
    religiousExemptionCountByStudent,
  }
}
