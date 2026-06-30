'use server'

import { createAdminClient, createServerSupabaseClient } from '@/app/lib/supabase-server'
import { SUMMER_DATE_TO_WEEK, JS_DOW_TO_DAY_KEY } from '@/app/lib/summer-schedule'

function dateToWeekAndDayKey(isoDate: string): { week: number; dayKey: string } | null {
  const week = SUMMER_DATE_TO_WEEK[isoDate]
  if (!week) return null
  const dow = new Date(isoDate + 'T00:00:00').getDay()
  const dayKey = JS_DOW_TO_DAY_KEY[dow]
  if (!dayKey) return null
  return { week, dayKey }
}

function expandWeekSelections(entries: { week: number; days: string[] }[]): string[] {
  const dates: string[] = []
  for (const [isoDate, weekNum] of Object.entries(SUMMER_DATE_TO_WEEK)) {
    for (const entry of entries) {
      if (entry.week !== weekNum) continue
      const dow = new Date(isoDate + 'T00:00:00').getDay()
      const dayKey = JS_DOW_TO_DAY_KEY[dow]
      if (dayKey && entry.days.includes(dayKey)) dates.push(isoDate)
    }
  }
  return dates
}

export async function swapHomeschoolDay(input: {
  studentId: string
  transactionId: string
  oldDay: string    // YYYY-MM-DD
  newDay: string    // YYYY-MM-DD
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

    // Fetch all homeschool_dropin transactions for this student to validate
    const { data: allTxData } = await adminClient
      .schema('billing')
      .from('stripe_transactions')
      .select('id, metadata')
      .eq('student_id', input.studentId)
      .eq('payment_type', 'homeschool_dropin')
      .eq('status', 'completed')
      .eq('is_deleted', false)

    const allTx = (allTxData ?? []) as { id: string; metadata: Record<string, string> | null }[]

    const oldInfo = dateToWeekAndDayKey(input.oldDay)
    const newInfo = dateToWeekAndDayKey(input.newDay)
    if (!oldInfo) return { success: false, error: `${input.oldDay} is not a valid program date.` }
    if (!newInfo) return { success: false, error: `${input.newDay} is not a valid program date.` }

    // Find target transaction and build paid days set
    const allPaidDays = new Set<string>()
    let targetTxMeta: Record<string, string> = {}
    let targetWeekSelections: { week: number; days: string[] }[] = []
    let targetFound = false

    for (const tx of allTx) {
      const meta = (tx.metadata ?? {}) as Record<string, string>

      let weekSelections: { week: number; days: string[] }[] = []
      if (meta.week_selections) {
        try { weekSelections = JSON.parse(meta.week_selections) } catch {}
      }
      if (!weekSelections.length) {
        const weeks = (meta.selected_weeks ?? '').split(',').map(Number).filter(Boolean)
        const days = (meta.selected_days ?? '').split(',').map((d) => d.trim()).filter(Boolean)
        weekSelections = weeks.map(w => ({ week: w, days }))
      }

      const expanded = expandWeekSelections(weekSelections)
      expanded.forEach((d) => allPaidDays.add(d))

      if (tx.id === input.transactionId) {
        targetTxMeta = { ...meta }
        targetWeekSelections = weekSelections
        targetFound = true
      }
    }

    if (!targetFound) {
      return { success: false, error: 'Transaction not found.' }
    }

    const targetExpanded = expandWeekSelections(targetWeekSelections)
    if (!targetExpanded.includes(input.oldDay)) {
      return { success: false, error: `${input.oldDay} is not in this transaction.` }
    }

    // Check newDay doesn't conflict with other paid days (excluding oldDay)
    const paidDaysWithoutOld = new Set(allPaidDays)
    paidDaysWithoutOld.delete(input.oldDay)
    if (paidDaysWithoutOld.has(input.newDay)) {
      return { success: false, error: `${input.newDay} is already paid.` }
    }

    // Update week_selections: remove oldDay's dayKey from its week, add newDay's dayKey to its week
    const updated = targetWeekSelections
      .map(entry => {
        if (entry.week !== oldInfo.week) return entry
        return { ...entry, days: entry.days.filter(d => d !== oldInfo.dayKey) }
      })
      .filter(entry => entry.days.length > 0)

    const existingNewWeek = updated.find(e => e.week === newInfo.week)
    if (existingNewWeek) {
      existingNewWeek.days = [...new Set([...existingNewWeek.days, newInfo.dayKey])].sort()
    } else {
      updated.push({ week: newInfo.week, days: [newInfo.dayKey] })
    }
    updated.sort((a, b) => a.week - b.week)

    // Rebuild legacy fields for consistency
    const allWeeks = [...new Set(updated.map(e => e.week))].sort((a, b) => a - b)
    const allDays = [...new Set(updated.flatMap(e => e.days))].sort()

    const updatedMeta = {
      ...targetTxMeta,
      week_selections: JSON.stringify(updated),
      selected_weeks: allWeeks.join(','),
      selected_days: allDays.join(','),
    }

    const { error } = await adminClient
      .schema('billing')
      .from('stripe_transactions')
      .update({ metadata: updatedMeta, updated_at: new Date().toISOString() })
      .eq('id', input.transactionId)

    if (error) {
      console.error('Error swapping homeschool day:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error swapping homeschool day:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
