'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'

export async function saveQuickApplyStep1(formData: {
  program: string
  childLegalName: string
  dobMonth: string
  dobDay: string
  dobYear: string
  childAge: string
  childGrade: string
  addressStreet: string
  addressCity: string
  addressState: string
  addressZip: string
  isHomeschooled: string
  homeschoolExplanation: string
  previousSchools: string
  previousSchoolsList: string
  dropInProgram: string
  applicationId?: string | null
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const fields = {
    status: 'in_progress' as const,
    program: formData.program || null,
    child_legal_name: formData.childLegalName || null,
    preferred_name: null,
    dob_month: formData.dobMonth || null,
    dob_day: formData.dobDay || null,
    dob_year: formData.dobYear || null,
    child_age: formData.childAge ? parseInt(formData.childAge) : null,
    child_grade: formData.childGrade || null,
    address_street: formData.addressStreet || null,
    address_city: formData.addressCity || null,
    address_state: formData.addressState || null,
    address_zip: formData.addressZip || null,
    is_homeschooled: formData.isHomeschooled || null,
    homeschool_explanation: formData.homeschoolExplanation || null,
    previous_schools: formData.previousSchools || null,
    previous_schools_list: formData.previousSchoolsList || null,
    special_interests: null,
    drop_in_program: formData.program === 'homeschool_drop_in' ? (formData.dropInProgram || null) : null,
    updated_at: new Date().toISOString(),
  }

  let appId: string

  if (formData.applicationId) {
    // Update existing row
    const { error } = await adminClient
      .schema('parent_app')
      .from('applications')
      .update(fields)
      .eq('id', formData.applicationId)
      .eq('user_id', user.id)

    if (error) {
      void sendDiscordNotification(createErrorEmbed({ context: 'Quick Step 1 – DB Save', error: error.message })).catch(() => {})
      return { error: error.message }
    }
    appId = formData.applicationId
  } else {
    // Insert new row
    const { data, error } = await adminClient
      .schema('parent_app')
      .from('applications')
      .insert({ user_id: user.id, ...fields })
      .select('id')
      .single()

    if (error) {
      void sendDiscordNotification(createErrorEmbed({ context: 'Quick Step 1 – DB Save', error: error.message })).catch(() => {})
      return { error: error.message }
    }
    appId = data.id
  }

  redirect(`/quick-apply/step/2?appId=${appId}`)
}
