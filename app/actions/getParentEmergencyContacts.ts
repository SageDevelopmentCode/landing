'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export type ParentEmergencyContactsRecord = {
  studentId: string
  studentName: string | null
  g1_full_name: string | null
  g1_email: string | null
  g1_cell_phone: string | null
  g1_work_phone: string | null
  g1_relationship: string | null
  g2_full_name: string | null
  g2_email: string | null
  g2_cell_phone: string | null
  g2_work_phone: string | null
  g2_relationship: string | null
  in_state_contact_name: string | null
  in_state_contact_relation: string | null
  in_state_contact_phone: string | null
  out_of_state_contact_name: string | null
  out_of_state_contact_relation: string | null
  out_of_state_contact_phone: string | null
}

export async function getParentEmergencyContacts(parentId?: string): Promise<ParentEmergencyContactsRecord[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('[getParentEmergencyContacts] user:', user?.id ?? null, 'authError:', authError)
  if (!user) return []

  const effectiveParentId = parentId ?? user.id

  const adminClient = createAdminClient()

  const { data: students, error: studentsError } = await adminClient
    .schema('admin')
    .from('students')
    .select('id, child_legal_name')
    .eq('parent_id', effectiveParentId)
    .eq('is_deleted', false)

  console.log('[getParentEmergencyContacts] students:', students, 'studentsError:', studentsError)
  if (!students || students.length === 0) return []

  const results = await Promise.all(
    students.map(async (student) => {
      const [{ data: healthInfo }, { data: appInfo }] = await Promise.all([
        adminClient
          .schema('parent_app')
          .from('student_health_info')
          .select(
            'in_state_contact_name, in_state_contact_relation, in_state_contact_phone, out_of_state_contact_name, out_of_state_contact_relation, out_of_state_contact_phone'
          )
          .eq('student_id', student.id)
          .maybeSingle(),
        adminClient
          .schema('parent_app')
          .from('applications')
          .select(
            'g1_full_name, g1_email, g1_cell_phone, g1_work_phone, g1_relationship, g2_full_name, g2_email, g2_cell_phone, g2_work_phone, g2_relationship'
          )
          .eq('student_id', student.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const fullName = student.child_legal_name ?? null

      return {
        studentId: student.id,
        studentName: fullName,
        g1_full_name: appInfo?.g1_full_name ?? null,
        g1_email: appInfo?.g1_email ?? null,
        g1_cell_phone: appInfo?.g1_cell_phone ?? null,
        g1_work_phone: appInfo?.g1_work_phone ?? null,
        g1_relationship: appInfo?.g1_relationship ?? null,
        g2_full_name: appInfo?.g2_full_name ?? null,
        g2_email: appInfo?.g2_email ?? null,
        g2_cell_phone: appInfo?.g2_cell_phone ?? null,
        g2_work_phone: appInfo?.g2_work_phone ?? null,
        g2_relationship: appInfo?.g2_relationship ?? null,
        in_state_contact_name: healthInfo?.in_state_contact_name ?? null,
        in_state_contact_relation: healthInfo?.in_state_contact_relation ?? null,
        in_state_contact_phone: healthInfo?.in_state_contact_phone ?? null,
        out_of_state_contact_name: healthInfo?.out_of_state_contact_name ?? null,
        out_of_state_contact_relation: healthInfo?.out_of_state_contact_relation ?? null,
        out_of_state_contact_phone: healthInfo?.out_of_state_contact_phone ?? null,
      } satisfies ParentEmergencyContactsRecord
    })
  )

  return results
}
