'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Table, TableRow, TableCell } from '../components/Table'
import { StatusBadge } from '../components/StatusBadge'
import { WaitlistDetailSidebar } from '../components/WaitlistDetailSidebar'
import { colors, radius, shadows } from '../design-system'
import { Merriweather } from 'next/font/google'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

interface WaitlistSubmission {
  id: string
  parent_name: string
  email: string
  phone: string
  child_name: string
  child_age: number | null
  preferred_start_date: string | null
  status: string
  created_at: string
  message?: string | null
  additional_info?: string | null
}

export default function WaitlistPage() {
  const [submissions, setSubmissions] = useState<WaitlistSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<WaitlistSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function fetchSubmissions() {
      const { data, error } = await supabase
        .schema('waitlist')
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        setSubmissions(data)
      }
      setIsLoading(false)
    }

    fetchSubmissions()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center p-12">
          <p style={{ color: colors.textSecondary }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1
            className={`text-3xl font-bold ${merriweather.className}`}
            style={{ color: colors.mistyForest }}
          >
            Waitlist Submissions
          </h1>
          <p className="mt-2" style={{ color: colors.textSecondary }}>
            {submissions?.length || 0} total submissions
          </p>
        </div>
        <a
          href="/api/admin/export-waitlist"
          className="inline-flex items-center justify-center px-5 py-4 text-base font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: colors.mistyForest,
            borderRadius: '16px',
            boxShadow: shadows.soft,
            border: 'none',
          }}
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export to CSV
        </a>
      </div>

      {submissions && submissions.length > 0 ? (
        <Table
          headers={[
            'Parent Info',
            'Contact',
            'Child Info',
            'Start Date',
            'Status',
            'Submitted',
          ]}
        >
          {submissions.map((submission, index) => (
            <TableRow
              key={submission.id}
              index={index}
              onClick={() => setSelectedSubmission(submission)}
            >
              <TableCell>
                <div className="font-medium">{submission.parent_name}</div>
              </TableCell>
              <TableCell>
                <div>{submission.email}</div>
                <div className="text-sm" style={{ color: colors.textSecondary }}>
                  {submission.phone}
                </div>
              </TableCell>
              <TableCell>
                <div>{submission.child_name}</div>
                <div className="text-sm" style={{ color: colors.textSecondary }}>
                  Age: {submission.child_age || 'N/A'}
                </div>
              </TableCell>
              <TableCell>
                <div style={{ color: colors.textSecondary }}>
                  {submission.preferred_start_date || 'N/A'}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={(submission.status || 'pending') as any}
                  type="waitlist"
                />
              </TableCell>
              <TableCell>
                <div style={{ color: colors.textSecondary }}>
                  {new Date(submission.created_at).toLocaleDateString()}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      ) : (
        <div
          className="bg-white p-12 text-center"
          style={{
            borderRadius: radius.lg,
            boxShadow: shadows.soft,
            border: `1px solid ${colors.border}`,
          }}
        >
          <p style={{ color: colors.textSecondary }}>No submissions yet</p>
        </div>
      )}

      <WaitlistDetailSidebar
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  )
}
