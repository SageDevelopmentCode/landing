'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function saveApplicationStep1(formData: {
  program: string
  childLegalName: string
  preferredName: string
  dobMonth: string
  dobDay: string
  dobYear: string
  childAge: string
  childGrade: string
  addressStreet: string
  addressCity: string
  addressState: string
  addressZip: string
  householdPhone: string
  isHomeschooled: string
  homeschoolExplanation: string
  previousSchools: string
  previousSchoolsList: string
  specialInterests: string
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
        program: formData.program || null,
        child_legal_name: formData.childLegalName || null,
        preferred_name: formData.preferredName || null,
        dob_month: formData.dobMonth || null,
        dob_day: formData.dobDay || null,
        dob_year: formData.dobYear || null,
        child_age: formData.childAge ? parseInt(formData.childAge) : null,
        child_grade: formData.childGrade || null,
        address_street: formData.addressStreet || null,
        address_city: formData.addressCity || null,
        address_state: formData.addressState || null,
        address_zip: formData.addressZip || null,
        household_phone: formData.householdPhone || null,
        is_homeschooled: formData.isHomeschooled || null,
        homeschool_explanation: formData.homeschoolExplanation || null,
        previous_schools: formData.previousSchools || null,
        previous_schools_list: formData.previousSchoolsList || null,
        special_interests: formData.specialInterests || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) return { error: error.message }

  redirect('/apply/step/2')
}
