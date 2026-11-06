'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

import { ALL_DROP_IN_PROGRAM_VALUES, type DropInProgramValue } from '@/app/lib/application-programs'

const VALID_DROP_IN_PROGRAMS: readonly string[] = ALL_DROP_IN_PROGRAM_VALUES

export async function updateApplicationDropInProgram(id: string, dropInProgram: DropInProgramValue) {
  if (!VALID_DROP_IN_PROGRAMS.includes(dropInProgram)) {
    return { success: false, error: 'Invalid drop-in program value' }
  }
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update({ drop_in_program: dropInProgram, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
