'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

import { ALL_PROGRAM_VALUES, type ProgramValue } from '@/app/lib/application-programs'

const VALID_PROGRAMS: readonly string[] = ALL_PROGRAM_VALUES

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
