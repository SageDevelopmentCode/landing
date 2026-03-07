'use server'
import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function saveApplicationStep2(formData: {
  g1FullName: string
  g1Relationship: string
  g1RelationshipOther: string
  g1Email: string
  g1CellPhone: string
  g1WorkPhone: string
  g1PreferredContact: string
  g1LivesWithChild: string
  g1HasCustody: string
  g2FullName: string
  g2Relationship: string
  g2RelationshipOther: string
  g2Email: string
  g2CellPhone: string
  g2WorkPhone: string
  g2PreferredContact: string
  g2LivesWithChild: string
  g2HasCustody: string
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
    g1_work_phone: formData.g1WorkPhone || null,
    g1_preferred_contact: formData.g1PreferredContact || null,
    g1_lives_with_child: formData.g1LivesWithChild || null,
    g1_has_custody: formData.g1HasCustody || null,
    g2_full_name: formData.g2FullName || null,
    g2_relationship: formData.g2Relationship || null,
    g2_relationship_other: formData.g2RelationshipOther || null,
    g2_email: formData.g2Email || null,
    g2_cell_phone: formData.g2CellPhone || null,
    g2_work_phone: formData.g2WorkPhone || null,
    g2_preferred_contact: formData.g2PreferredContact || null,
    g2_lives_with_child: formData.g2LivesWithChild || null,
    g2_has_custody: formData.g2HasCustody || null,
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

  if (error) return { error: error.message }

  redirect(`/apply/step/3?appId=${formData.applicationId}`)
}
