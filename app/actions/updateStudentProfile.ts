'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import type { Database } from '@/app/types/database.types'

type Student = Database["admin"]["Tables"]["students"]["Row"]

export type ProfileFields = Partial<Pick<Student,
  | 'has_medical_conditions'
  | 'medical_conditions_description'
  | 'has_allergies'
  | 'allergies_description'
  | 'has_emergency_medications'
  | 'emergency_medications_description'
  | 'learning_style'
  | 'strengths_interests'
  | 'current_challenges'
  | 'dysregulation_response'
  | 'regulation_strategies'
  | 'activities_to_avoid'
  | 'needs_aide'
  | 'needs_aide_description'
  | 'history_flags'
  | 'history_explanation'
>>

export async function updateStudentProfile(studentId: string, fields: ProfileFields) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const { error: ownershipError } = await adminClient
    .schema('admin')
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .single()

  if (ownershipError) return { error: 'Not authorized' }

  const { data, error } = await adminClient
    .schema('admin')
    .from('students')
    .update({ ...fields })
    .eq('id', studentId)
    .select()
    .single()

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'updateStudentProfile – DB Update', error: error.message, details: { studentId, userId: user.id } })).catch(() => {})
    return { error: error.message }
  }
  return { data }
}
