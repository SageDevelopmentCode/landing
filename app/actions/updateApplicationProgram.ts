'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

const VALID_PROGRAMS = ['summer_26', 'school_year_26_27', 'both', 'homeschool_drop_in'] as const
type ProgramValue = typeof VALID_PROGRAMS[number]

export async function updateApplicationProgram(id: string, program: ProgramValue) {
  if (!VALID_PROGRAMS.includes(program)) {
    return { success: false, error: 'Invalid program value' }
  }
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update({ program, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
