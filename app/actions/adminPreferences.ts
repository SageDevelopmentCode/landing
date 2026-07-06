'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

type ParticipationLevel = 'watch' | 'cook_no_eat' | 'full'

export async function adminSetStudentDefaultPreference(
  parentId: string,
  studentId: string,
  level: ParticipationLevel | null
): Promise<{ error?: string }> {
  const adminClient = createAdminClient()

  if (level !== null) {
    const { error } = await adminClient
      .schema('parent_app')
      .from('student_default_preferences')
      .upsert(
        { parent_id: parentId, student_id: studentId, participation_level: level },
        { onConflict: 'parent_id,student_id' }
      )
    if (error) return { error: error.message }
  } else {
    const { error } = await adminClient
      .schema('parent_app')
      .from('student_default_preferences')
      .delete()
      .eq('parent_id', parentId)
      .eq('student_id', studentId)
    if (error) return { error: error.message }
  }

  return {}
}
