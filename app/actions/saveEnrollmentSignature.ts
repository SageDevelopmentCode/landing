'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export async function saveEnrollmentSignature({
  studentId,
  contractId,
  sectionId,
  printedName,
  signature,
}: {
  studentId: string
  contractId: number
  sectionId: number
  printedName: string
  signature: string
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!studentId?.trim()) return { error: 'Missing student ID' }
  if (!printedName?.trim()) return { error: 'Printed name is required' }
  if (!signature?.trim()) return { error: 'Signature is required' }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('parent_app')
    .from('enrollment_signatures')
    .upsert(
      {
        parent_id: user.id,
        student_id: studentId,
        contract_id: contractId,
        section_id: sectionId,
        printed_name: printedName.trim(),
        signature: signature.trim(),
        signed_at: new Date().toISOString(),
      },
      { onConflict: 'parent_id,student_id,contract_id,section_id' }
    )
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}
