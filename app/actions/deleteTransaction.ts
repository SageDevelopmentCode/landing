'use server'

import { createAdminClient } from '@/app/lib/supabase-server'

export async function deleteTransaction(
  transactionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .schema('billing')
      .from('stripe_transactions')
      .update({ is_deleted: true })
      .eq('id', transactionId)

    if (error) {
      console.error('Error deleting transaction:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
