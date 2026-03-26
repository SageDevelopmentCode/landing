'use server'

import { createAdminClient } from '@/app/lib/supabase-server'

export async function deleteCalendarEvent(
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await createAdminClient()
      .schema('calendar')
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
