'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import { createApplicationEmbed, sendDiscordNotification } from '@/app/lib/discord'
import { sendZohoEmail, buildApplicationConfirmationEmail } from '@/app/lib/zoho'

export async function saveApplicationStep5(formData: {
  g1SignatureName: string
  g1Signature: string
  g1SignatureDate: string
  g2SignatureName: string
  g2Signature: string
  g2SignatureDate: string
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
      status: 'completed',
      g1_signature_name: formData.g1SignatureName || null,
      g1_signature: formData.g1Signature || null,
      g1_signature_date: formData.g1SignatureDate || null,
      g2_signature_name: formData.g2SignatureName || null,
      g2_signature: formData.g2Signature || null,
      g2_signature_date: formData.g2SignatureDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', formData.applicationId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  const { data: app } = await adminClient
    .schema('parent_app')
    .from('applications')
    .select('g1_full_name, g1_email, g1_cell_phone, g2_full_name, g2_email, child_legal_name, child_age, child_grade, program, special_interests')
    .eq('id', formData.applicationId)
    .single()

  try {
    if (app) {
      const embed = createApplicationEmbed({
        g1FullName: app.g1_full_name ?? '',
        g1Email: app.g1_email ?? '',
        g1Phone: app.g1_cell_phone ?? '',
        g2FullName: app.g2_full_name,
        g2Email: app.g2_email,
        childLegalName: app.child_legal_name ?? '',
        childAge: app.child_age,
        childGrade: app.child_grade,
        program: app.program,
        specialInterests: app.special_interests,
      })
      await sendDiscordNotification(embed)

      const { subject, content } = await buildApplicationConfirmationEmail({
        g1FullName: app.g1_full_name ?? '',
        childLegalName: app.child_legal_name ?? '',
        program: app.program,
      })
      await sendZohoEmail({ toAddress: app.g1_email ?? '', subject, content })
    }
  } catch (notifError) {
    console.error('Failed to send notifications:', notifError)
  }

  redirect('/apply/dashboard')
}
