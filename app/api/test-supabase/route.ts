import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

// Test endpoint to verify Supabase connection
// Visit: http://localhost:3000/api/test-supabase

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Test the connection by checking the project URL
    const { data, error } = await supabase
      .from('_dummy_table_')
      .select('*')
      .limit(1)

    // If we get a 'relation does not exist' error, that's actually good!
    // It means we connected successfully, just don't have any tables yet
    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return NextResponse.json({
        status: 'success',
        message: 'Supabase connected successfully! No tables found yet, but connection is working.',
        details: 'You can now create tables in your Supabase dashboard and start using the database.'
      })
    }

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase connection failed',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connected successfully!',
      data
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to Supabase',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
