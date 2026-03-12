'use server'

import { createAdminClient } from '@/app/lib/supabase-server'

export async function deleteStudent(
  studentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .schema('admin')
      .from('students')
      .update({ is_deleted: true })
      .eq('id', studentId)

    if (error) {
      console.error('Error deleting student:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting student:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
