'use server'

import { createAdminClient, createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function swapSummerWeek(input: {
  studentId: string
  transactionId: string
  oldWeek: number
  newWeek: number
}): Promise<{ success: boolean; error?: string }> {
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

    // Fetch all weekly summer_tuition transactions for this student to validate
    const { data: allTxData } = await adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('id, metadata')
      .eq('student_id', input.studentId)
      .eq('payment_type', 'summer_tuition')
      .eq('status', 'completed')
      .eq('is_deleted', false)

    const allTx = (allTxData ?? []) as { id: string; metadata: Record<string, string> | null }[]

    // Compute all paid weeks across all transactions
    const allPaidWeeks = new Set<number>()
    let targetTxWeeks: number[] = []
    let targetTxMeta: Record<string, string> = {}

    for (const tx of allTx) {
      const meta = (tx.metadata ?? {}) as Record<string, string>
      if (meta.plan_type === 'full') {
        // Full plan — not eligible for swap
        if (tx.id === input.transactionId) {
          return { success: false, error: 'This transaction is a full-plan payment and cannot be edited.' }
        }
        for (let w = 1; w <= 12; w++) allPaidWeeks.add(w)
        continue
      }
      const weeks = (meta.weeks ?? '').split(',').map(Number).filter(Boolean)
      weeks.forEach((w) => allPaidWeeks.add(w))
      if (tx.id === input.transactionId) {
        targetTxWeeks = weeks
        targetTxMeta = { ...meta }
      }
    }

    if (targetTxWeeks.length === 0 && !allTx.find((t) => t.id === input.transactionId)) {
      return { success: false, error: 'Transaction not found.' }
    }

    if (!targetTxWeeks.includes(input.oldWeek)) {
      return { success: false, error: `Week ${input.oldWeek} is not in this transaction.` }
    }

    // Remove oldWeek from allPaidWeeks set to check if newWeek conflicts with OTHER weeks
    const paidWeeksWithoutOld = new Set(allPaidWeeks)
    paidWeeksWithoutOld.delete(input.oldWeek)

    if (paidWeeksWithoutOld.has(input.newWeek)) {
      return { success: false, error: `Week ${input.newWeek} is already paid.` }
    }

    const updatedWeeks = targetTxWeeks.filter((w) => w !== input.oldWeek)
    updatedWeeks.push(input.newWeek)
    updatedWeeks.sort((a, b) => a - b)

    const updatedMeta = { ...targetTxMeta, weeks: updatedWeeks.join(',') }

    const { error } = await adminClient
      .schema('billing')
      .from('stripe_transactions')
      .update({ metadata: updatedMeta, updated_at: new Date().toISOString() })
      .eq('id', input.transactionId)

    if (error) {
      console.error('Error swapping summer week:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error swapping summer week:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
