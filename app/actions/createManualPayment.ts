'use server'

import { createAdminClient, createServerSupabaseClient } from '@/app/lib/supabase-server'

export type ManualPaymentType =
  | 'summer_tuition'
  | 'aftercare_tuition'
  | 'fun_friday_tuition'
  | 'homeschool_dropin'

export type CreateManualPaymentInput = {
  studentId: string
  parentId: string
  paymentType: ManualPaymentType
  metadata: Record<string, string>
  amountCents: number
  notes: string
  applicationId?: string
}

export async function createManualPayment(
  input: CreateManualPaymentInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const adminClient = createAdminClient()
    const { data: adminUser } = await adminClient
      .schema('admin')
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'super_admin') {
      return { success: false, error: 'Unauthorized' }
    }

    const sessionId = 'check_' + crypto.randomUUID()

    const { error } = await adminClient
      .schema('billing')
      .from('stripe_transactions')
      .insert({
        stripe_session_id: sessionId,
        stripe_payment_intent_id: null,
        payment_type: input.paymentType,
        status: 'completed',
        amount_cents: input.amountCents,
        intended_amount_cents: input.amountCents,
        currency: 'usd',
        cover_fees: false,
        payer_name: 'Check Payment',
        payer_email: null,
        description: input.notes || 'Manual check payment recorded by admin',
        student_id: input.studentId,
        application_id: input.applicationId ?? null,
        parent_id: input.parentId,
        metadata: input.metadata,
        is_deleted: false,
        exclude_from_revenue: false,
      })

    if (error) {
      console.error('Error creating manual payment:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error creating manual payment:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    }
  }
}
