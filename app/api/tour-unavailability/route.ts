import { NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase-server'

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

  return NextResponse.json(data ?? [])
}
