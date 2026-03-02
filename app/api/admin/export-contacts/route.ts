import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with request cookies for API routes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
          },
        },
      }
    )

    const { data: submissions, error } = await supabase
      .schema('contact')
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    // Generate CSV
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Message',
      'Status',
      'Notes',
      'Created At',
    ]

    const rows = submissions.map((item) => [
      item.id,
      item.name,
      item.email,
      item.phone || '',
      item.message,
      item.status || 'pending',
      item.notes || '',
      new Date(item.created_at).toISOString(),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    // Return CSV with proper headers
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contact-submissions-${new Date().toISOString()}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error generating CSV:', error)
    return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 })
  }
}
