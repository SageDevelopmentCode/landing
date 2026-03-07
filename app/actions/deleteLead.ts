'use server'

import { createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function deleteWaitlistLead(
  submissionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .schema('waitlist')
      .from('submissions')
      .update({ is_deleted: true })
      .eq('id', submissionId)

    if (error) {
      console.error('Error deleting waitlist lead:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting waitlist lead:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function deleteContactLead(
  submissionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .schema('contact')
      .from('submissions')
      .update({ is_deleted: true })
      .eq('id', submissionId)

    if (error) {
      console.error('Error deleting contact lead:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting contact lead:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
