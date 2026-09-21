'use server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function updateApplicationHomeschoolPricing(
  id: string,
  useUpdated: boolean,
) {
  const adminClient = createAdminClient()

  const { data: app, error: fetchError } = await adminClient
    .schema('parent_app')
    .from('applications')
    .select('id, program')
    .eq('id', id)
    .single()

  if (fetchError || !app) {
    return { success: false, error: fetchError?.message ?? 'Application not found' }
  }

  if (app.program !== 'homeschool_drop_in') {
    return { success: false, error: 'Only homeschool drop-in applications support pricing tiers' }
  }

  const { error } = await adminClient
    .schema('parent_app')
    .from('applications')
    .update({
      use_updated_homeschool_pricing: useUpdated,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
