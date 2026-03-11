'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export async function saveHealthStatement(studentId: string, optionType: 'professional' | 'religious') {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .schema('parent_app')
    .from('student_health_statement')
    .upsert(
      {
        parent_id: user.id,
        student_id: studentId,
        option_type: optionType,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'parent_id,student_id' }
    )
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}
