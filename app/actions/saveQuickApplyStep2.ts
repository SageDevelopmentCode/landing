'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'
import { sendDiscordNotification, createErrorEmbed } from '@/app/lib/discord'

export async function saveQuickApplyStep2(formData: {
  g1FullName: string
  g1Relationship: string
  g1RelationshipOther: string
  g1Email: string
  g1CellPhone: string
  g1PreferredContact: string
  g1LivesWithChild: string
  g1HasCustody: string
  hasCustodyOrders: string
  custodyOrdersDescription: string
  applicationId?: string | null
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const adminClient = createAdminClient()

  const fields = {
    status: 'in_progress' as const,
    g1_full_name: formData.g1FullName || null,
    g1_relationship: formData.g1Relationship || null,
    g1_relationship_other: formData.g1RelationshipOther || null,
    g1_email: formData.g1Email || null,
    g1_cell_phone: formData.g1CellPhone || null,
    g1_work_phone: null,
    g1_preferred_contact: formData.g1PreferredContact || null,
    g1_lives_with_child: formData.g1LivesWithChild || null,
    g1_has_custody: formData.g1HasCustody || null,
    g2_full_name: null,
    g2_relationship: null,
    g2_relationship_other: null,
    g2_email: null,
    g2_cell_phone: null,
    g2_work_phone: null,
    g2_preferred_contact: null,
    g2_lives_with_child: null,
    g2_has_custody: null,
    has_custody_orders: formData.hasCustodyOrders || null,
    custody_orders_description: formData.custodyOrdersDescription || null,
    updated_at: new Date().toISOString(),
  }

  if (!formData.applicationId) return { error: 'Missing application ID' }

  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update(fields)
    .eq('id', formData.applicationId)
    .eq('user_id', user.id)

  if (error) {
    void sendDiscordNotification(createErrorEmbed({ context: 'Quick Step 2 – DB Save', error: error.message, details: { applicationId: formData.applicationId } })).catch(() => {})
    return { error: error.message }
  }

  redirect(`/quick-apply/step/3?appId=${formData.applicationId}`)
}
