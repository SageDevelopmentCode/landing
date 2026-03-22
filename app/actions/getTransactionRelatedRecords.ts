'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function getTransactionRelatedRecords({
  studentId,
  applicationId,
  parentId,
}: {
  studentId: string | null
  applicationId: string | null
  parentId: string | null
}) {
  const client = createAdminClient()

  const [studentRes, applicationRes, parentRes] = await Promise.all([
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
    parentId
      ? client.schema('admin').from('users')
          .select('id, full_name, email')
          .eq('id', parentId).single()
      : Promise.resolve({ data: null }),
  ])

  return {
    student: studentRes.data ?? null,
    application: applicationRes.data ?? null,
    parent: parentRes.data ?? null,
  }
}
