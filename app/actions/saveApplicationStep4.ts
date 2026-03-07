'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function saveApplicationStep4(formData: {
  learningStyle: string
  strengthsInterests: string
  currentChallenges: string
  dysregulationResponse: string
  regulationStrategies: string
  activitiesToAvoid: string
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .upsert(
      {
        user_id: user.id,
        status: 'in_progress',
        learning_style: formData.learningStyle || null,
        strengths_interests: formData.strengthsInterests || null,
        current_challenges: formData.currentChallenges || null,
        dysregulation_response: formData.dysregulationResponse || null,
        regulation_strategies: formData.regulationStrategies || null,
        activities_to_avoid: formData.activitiesToAvoid || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) return { error: error.message }

  redirect('/apply/step/5')
}
