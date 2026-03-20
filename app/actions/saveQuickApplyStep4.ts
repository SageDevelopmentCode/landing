'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import { createApplicationEmbed, sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'
import { sendZohoEmail, buildApplicationConfirmationEmail } from '@/app/lib/zoho'

export async function saveQuickApplyStep4(formData: {
  g1SignatureName: string
  g1Signature: string
  g1SignatureDate: string
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
      status: 'in_review',
      g1_signature_name: formData.g1SignatureName || null,
      g1_signature: formData.g1Signature || null,
      g1_signature_date: formData.g1SignatureDate || null,
      g2_signature_name: null,
      g2_signature: null,
      g2_signature_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', formData.applicationId)
    .eq('user_id', user.id)

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'Quick Step 4 – DB Save', error: error.message, details: { applicationId: formData.applicationId } })).catch(() => {})
    return { error: error.message }
  }

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
      const emailResult = await sendZohoEmail({ toAddress: app.g1_email ?? '', subject, content })

      if (!emailResult.success) {
        void sendDiscordNotification(createErrorEmbed({
          context: 'Email Send – Quick Apply Confirmation',
          error: emailResult.error ?? 'Unknown error',
          details: { to: app.g1_email ?? '', applicationId: formData.applicationId },
        })).catch(() => {})
      }

      await adminClient
        .schema('email_logs')
        .from('sends')
        .insert({
          application_id: formData.applicationId,
          to_address: app.g1_email ?? '',
          subject,
          status: emailResult.success ? 'success' : 'error',
          error_message: emailResult.error ?? null,
        })
    }
  } catch (notifError) {
    console.error('Failed to send notifications:', notifError)
  }

  redirect('/apply/dashboard')
}
