'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export async function getTeacherStudentDetail(studentId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[getTeacherStudentDetail] No authenticated user')
    return null
  }

  const adminClient = createAdminClient()

  const { data: assignment, error: assignmentError } = await adminClient
    .schema('teachers')
    .from('teacher_students')
    .select('id')
    .eq('teacher_id', user.id)
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .limit(1)
    .maybeSingle()

  if (assignmentError) {
    console.error('[getTeacherStudentDetail] Assignment query error:', assignmentError)
    return null
  }
  if (!assignment) {
    console.error('[getTeacherStudentDetail] No assignment found for teacher:', user.id, 'student:', studentId)
    return null
  }

  const { data, error: studentError } = await adminClient
    .schema('admin')
    .from('students')
    .select('id, child_legal_name, child_grade, dob_month, dob_day, dob_year, special_interests, learning_style, strengths_interests, current_challenges, dysregulation_response, regulation_strategies, activities_to_avoid, has_medical_conditions, medical_conditions_description, has_allergies, allergies_description, has_emergency_medications, emergency_medications_description, history_flags, history_explanation, needs_aide, needs_aide_description')
    .eq('id', studentId)
    .maybeSingle()

  if (studentError) {
    console.error('[getTeacherStudentDetail] Student query error:', studentError)
  }

  if (!data) return null

  const [{ data: healthInfo }, { data: applicationInfo }] = await Promise.all([
    adminClient
      .schema('parent_app')
      .from('student_health_info')
      .select('in_state_contact_name, in_state_contact_relation, in_state_contact_phone, out_of_state_contact_name, out_of_state_contact_relation, out_of_state_contact_phone')
      .eq('student_id', studentId)
      .maybeSingle(),
    adminClient
      .schema('parent_app')
      .from('applications')
      .select('g1_full_name, g1_email, g1_cell_phone, g1_work_phone, g1_relationship, g2_full_name, g2_email, g2_cell_phone, g2_work_phone, g2_relationship')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return { ...data, ...healthInfo, ...applicationInfo }
}
