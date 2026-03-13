'use server'
import { createAdminClient } from '@/app/lib/supabase-server'
import { buildApprovalEmail, sendZohoEmail } from '@/app/lib/zoho'

export async function approveApplication(id: string) {
  const adminClient = createAdminClient()

  // 1. Fetch the application
  const { data: app, error: fetchError } = await adminClient
    .schema('parent_app')
    .from('applications')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchError) return { error: fetchError.message }

  // 2. Sync guardian data to admin.users
  const { error: userUpdateError } = await adminClient
    .schema('admin')
    .from('users')
    .update({
      g1_cell_phone: app.g1_cell_phone,
      g1_work_phone: app.g1_work_phone,
      g1_preferred_contact: app.g1_preferred_contact,
      g1_lives_with_child: app.g1_lives_with_child,
      g1_has_custody: app.g1_has_custody,
      g2_full_name: app.g2_full_name,
      g2_relationship: app.g2_relationship,
      g2_relationship_other: app.g2_relationship_other,
      g2_email: app.g2_email,
      g2_cell_phone: app.g2_cell_phone,
      g2_work_phone: app.g2_work_phone,
      g2_preferred_contact: app.g2_preferred_contact,
      g2_lives_with_child: app.g2_lives_with_child,
      g2_has_custody: app.g2_has_custody,
      has_custody_orders: app.has_custody_orders,
      custody_orders_description: app.custody_orders_description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', app.user_id)
  if (userUpdateError) return { error: userUpdateError.message }

  // 3. Insert student record
  const { data: studentRow, error: studentInsertError } = await adminClient
    .schema('admin')
    .from('students')
    .insert({
      parent_id: app.user_id,
      child_legal_name: app.child_legal_name,
      dob_month: app.dob_month,
      dob_day: app.dob_day,
      dob_year: app.dob_year,
      special_interests: app.special_interests,
      has_medical_conditions: app.has_medical_conditions,
      medical_conditions_description: app.medical_conditions_description,
      has_allergies: app.has_allergies,
      allergies_description: app.allergies_description,
      has_emergency_medications: app.has_emergency_medications,
      emergency_medications_description: app.emergency_medications_description,
      history_flags: app.history_flags,
      history_explanation: app.history_explanation,
      needs_aide: app.needs_aide,
      needs_aide_description: app.needs_aide_description,
      learning_style: app.learning_style,
      strengths_interests: app.strengths_interests,
      current_challenges: app.current_challenges,
      dysregulation_response: app.dysregulation_response,
      regulation_strategies: app.regulation_strategies,
      activities_to_avoid: app.activities_to_avoid,
    })
    .select('id')
    .single()
  if (studentInsertError) return { error: studentInsertError.message }

  // 4. Update application with student_id and approval fields
  const { error: appUpdateError } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      student_id: studentRow.id,
      status: 'enrolling',
    })
    .eq('id', id)
  if (appUpdateError) return { error: appUpdateError.message }

  // 5. Send approval email (non-blocking — log error but don't fail)
  const { data: authUser } = await adminClient.auth.admin.getUserById(app.user_id)
  const parentEmail = authUser?.user?.email
  if (parentEmail) {
    const { subject, content } = await buildApprovalEmail({
      g1FullName: app.g1_full_name ?? 'Parent',
      childLegalName: app.child_legal_name ?? 'your child',
      program: app.program ?? null,
    })
    const emailResult = await sendZohoEmail({ toAddress: parentEmail, subject, content })
    if (!emailResult.success) {
      console.error('Failed to send approval email:', emailResult.error)
    }
  }

  return { success: true }
}
