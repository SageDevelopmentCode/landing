'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function getTransactionRelatedRecords({
  studentId,
  applicationId,
  applicationIds,
  parentId,
}: {
  studentId: string | null
  applicationId: string | null
  applicationIds?: string[]
  parentId: string | null
}) {
  const client = createAdminClient()

  // Combined payments have multiple application IDs but no single student_id
  const multiAppIds = applicationIds && applicationIds.length > 0 ? applicationIds : null

  const [studentRes, applicationRes, multiAppsRes, parentRes] = await Promise.all([
    studentId
      ? client.schema('admin').from('students')
          .select('id, child_legal_name, dob_month, dob_day, dob_year')
          .eq('id', studentId).single()
      : Promise.resolve({ data: null }),
    applicationId
      ? client.schema('parent_app').from('applications')
          .select('id, child_legal_name, g1_full_name, g1_email, program, drop_in_program, status')
          .eq('id', applicationId).single()
      : Promise.resolve({ data: null }),
    multiAppIds
      ? client.schema('parent_app').from('applications')
          .select('id, child_legal_name, g1_full_name, g1_email, program, drop_in_program, status, student_id')
          .in('id', multiAppIds)
      : Promise.resolve({ data: null }),
    parentId
      ? client.schema('admin').from('users')
          .select('id, full_name, email')
          .eq('id', parentId).single()
      : Promise.resolve({ data: null }),
  ])

  // For combined payments, fetch students from their application student_ids
  const multiStudents: { id: string; child_legal_name: string | null; dob_month: string | null; dob_day: string | null; dob_year: string | null }[] = []
  if (multiAppsRes.data && multiAppsRes.data.length > 0) {
    const sids = (multiAppsRes.data as { student_id: string | null }[])
      .map(a => a.student_id)
      .filter((id): id is string => !!id)
    if (sids.length > 0) {
      const { data: studentsData } = await client.schema('admin').from('students')
        .select('id, child_legal_name, dob_month, dob_day, dob_year')
        .in('id', sids)
      if (studentsData) multiStudents.push(...studentsData)
    }
  }

  return {
    student: studentRes.data ?? null,
    application: applicationRes.data ?? null,
    applications: multiAppsRes.data ?? null,
    multiStudents: multiStudents.length > 0 ? multiStudents : null,
    parent: parentRes.data ?? null,
  }
}
