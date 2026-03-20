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

    // Fetch waitlist submissions
    const { data: waitlistData, error: waitlistError } = await supabase
      .schema('waitlist')
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })

    // Fetch contact submissions
    const { data: contactData, error: contactError } = await supabase
      .schema('contact')
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (waitlistError || contactError) {
      console.error('Error fetching submissions:', waitlistError || contactError)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    // Generate CSV with all columns
    const headers = [
      'ID',
      'Type',
      'Name',
      'Parent Name',
      'Email',
      'Phone',
      'Child Name',
      'Child Age',
      'Preferred Start',
      'Message',
      'Status',
      'Tags',
      'Created At',
    ]

    // Map waitlist submissions
    const waitlistRows = (waitlistData || []).map((item) => [
      item.id,
      'Waitlist',
      '', // name (contact only)
      item.parent_name,
      item.email,
      item.phone || '',
      item.child_name,
      item.child_age || '',
      item.preferred_start_date || '',
      item.notes || '', // any additional notes
      item.status || 'new_inquiry',
      (item.tags || []).join(';'),
      new Date(item.created_at).toISOString(),
    ])

    // Map contact submissions
    const contactRows = (contactData || []).map((item) => [
      item.id,
      'Contact',
      item.name,
      '', // parent_name (waitlist only)
      item.email,
      item.phone || '',
      '', // child_name (waitlist only)
      '', // child_age (waitlist only)
      '', // preferred_start_date (waitlist only)
      item.message || '',
      item.status || 'new_inquiry',
      (item.tags || []).join(';'),
      new Date(item.created_at).toISOString(),
    ])

    // Combine all rows
    const allRows = [...waitlistRows, ...contactRows]

    // Sort by created_at (column index 12)
    allRows.sort((a, b) => {
      const dateA = new Date(a[12] as string).getTime()
      const dateB = new Date(b[12] as string).getTime()
      return dateB - dateA // descending order (newest first)
    })

    const csv = [
      headers.join(','),
      ...allRows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    // Return CSV with proper headers
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString()}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error generating CSV:', error)
    return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 })
  }
}
