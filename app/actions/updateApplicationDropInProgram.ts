'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

const VALID_DROP_IN_PROGRAMS = ['summer_26', 'school_year_26_27', 'both'] as const
type DropInProgramValue = typeof VALID_DROP_IN_PROGRAMS[number]

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
