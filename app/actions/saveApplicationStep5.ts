'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'

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

  redirect('/apply/dashboard')
}
