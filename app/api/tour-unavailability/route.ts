import { NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase-server'
import { normalizeTourDateKey } from '@/app/lib/tour-availability'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .schema('marketing')
    .from('tour_unavailability')
    .select('unavailable_date, unavailable_time, is_recurring')
    .order('unavailable_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []).map((row) => ({
    unavailable_date: normalizeTourDateKey(String(row.unavailable_date)),
    unavailable_time: row.unavailable_time,
    is_recurring: row.is_recurring,
  }))

  return NextResponse.json(rows, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
