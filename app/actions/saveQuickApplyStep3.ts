'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'

export async function saveQuickApplyStep3(formData: {
  hasMedicalConditions: string
  medicalConditionsDescription: string
  hasAllergies: string
  allergiesDescription: string
  hasEmergencyMedications: string
  emergencyMedicationsDescription: string
  applicationId?: string | null
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!formData.applicationId) return { error: 'Missing application ID' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update({
      status: 'in_progress',
      has_medical_conditions: formData.hasMedicalConditions || null,
      medical_conditions_description: formData.medicalConditionsDescription || null,
      has_allergies: formData.hasAllergies || null,
      allergies_description: formData.allergiesDescription || null,
      has_emergency_medications: formData.hasEmergencyMedications || null,
      emergency_medications_description: formData.emergencyMedicationsDescription || null,
      history_flags: null,
      history_explanation: null,
      needs_aide: null,
      needs_aide_description: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', formData.applicationId)
    .eq('user_id', user.id)

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'Quick Step 3 – DB Save', error: error.message, details: { applicationId: formData.applicationId } })).catch(() => {})
    return { error: error.message }
  }

  redirect(`/quick-apply/step/4?appId=${formData.applicationId}`)
}
