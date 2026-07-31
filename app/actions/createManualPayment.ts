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

export type CreateManualSchoolYearPaymentInput = {
  studentId: string
  parentId: string
  applicationId?: string
  includeSupplyFee: boolean
  tuitionMonthIndices: number[]
  gradeTier: 'primary' | 'upper'
  notes: string
}

const SUPPLY_FEE_CENTS = 30000
const PRIMARY_TUITION_CENTS = 119500
const UPPER_TUITION_CENTS = 109500

async function assertSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not authenticated' }

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'super_admin') {
    return { ok: false as const, error: 'Unauthorized' }
  }

  return { ok: true as const, adminClient }
}

export async function createManualPayment(
  input: CreateManualPaymentInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await assertSuperAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const sessionId = 'check_' + crypto.randomUUID()

    const { error } = await auth.adminClient
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

export async function createManualSchoolYearPayment(
  input: CreateManualSchoolYearPaymentInput,
): Promise<{ success: boolean; error?: string; createdCount?: number }> {
  try {
    const auth = await assertSuperAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const { data: existingTx } = await auth.adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('payment_type, metadata')
      .eq('student_id', input.studentId)
      .eq('status', 'completed')
      .eq('is_deleted', false)
      .in('payment_type', ['supply_fee', 'school_year_tuition'])

    let supplyFeePaid = false
    const paidMonths = new Set<number>()
    for (const tx of existingTx ?? []) {
      if (tx.payment_type === 'supply_fee') supplyFeePaid = true
      if (tx.payment_type === 'school_year_tuition') {
        const meta = (tx.metadata ?? {}) as Record<string, string>
        const months = (meta.selected_months ?? '').split(',').map(Number).filter(Boolean)
        months.forEach((m) => paidMonths.add(m))
      }
    }

    const shouldRecordSupplyFee = input.includeSupplyFee && !supplyFeePaid
    const tuitionMonths = input.tuitionMonthIndices
      .filter((m) => m >= 1 && m <= 10)
      .filter((m) => !paidMonths.has(m))
      .sort((a, b) => a - b)

    if (!shouldRecordSupplyFee && tuitionMonths.length === 0) {
      return { success: false, error: 'Nothing new to record — supply fee and selected months are already paid.' }
    }

    const tuitionRate = input.gradeTier === 'primary' ? PRIMARY_TUITION_CENTS : UPPER_TUITION_CENTS
    const rows: Array<{
      stripe_session_id: string
      payment_type: string
      amount_cents: number
      metadata: Record<string, string>
    }> = []

    if (shouldRecordSupplyFee) {
      rows.push({
        stripe_session_id: 'check_' + crypto.randomUUID(),
        payment_type: 'supply_fee',
        amount_cents: SUPPLY_FEE_CENTS,
        metadata: { payment_type: 'supply_fee' },
      })
    }

    if (tuitionMonths.length > 0) {
      rows.push({
        stripe_session_id: 'check_' + crypto.randomUUID(),
        payment_type: 'school_year_tuition',
        amount_cents: tuitionRate * tuitionMonths.length,
        metadata: {
          payment_type: 'school_year_tuition',
          selected_months: tuitionMonths.join(','),
        },
      })
    }

    const description = input.notes || 'Manual check payment recorded by admin'

    for (const row of rows) {
      const { error } = await auth.adminClient
        .schema('billing')
        .from('stripe_transactions')
        .insert({
          stripe_session_id: row.stripe_session_id,
          stripe_payment_intent_id: null,
          payment_type: row.payment_type,
          status: 'completed',
          amount_cents: row.amount_cents,
          intended_amount_cents: row.amount_cents,
          currency: 'usd',
          cover_fees: false,
          payer_name: 'Check Payment',
          payer_email: null,
          description,
          student_id: input.studentId,
          application_id: input.applicationId ?? null,
          parent_id: input.parentId,
          metadata: row.metadata,
          is_deleted: false,
          exclude_from_revenue: false,
        })

      if (error) {
        console.error('Error creating manual school year payment:', error)
        return { success: false, error: error.message }
      }
    }

    return { success: true, createdCount: rows.length }
  } catch (err) {
    console.error('Unexpected error creating manual school year payment:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    }
  }
}
