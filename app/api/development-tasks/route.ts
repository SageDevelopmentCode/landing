import { NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .schema('admin')
      .from('development_tasks')
      .select('*')
      .order('created_at', { ascending: true })

    console.log('[development-tasks API] data:', data)
    console.log('[development-tasks API] error:', error)

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ tasks: data })
  } catch (err) {
    console.error('[development-tasks API] caught error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
