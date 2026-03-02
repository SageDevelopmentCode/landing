import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { Table, TableRow, TableCell } from '../components/Table'
import { StatusBadge } from '../components/StatusBadge'
import { colors, radius, shadows } from '../design-system'

export default async function WaitlistPage() {
  const supabase = await createServerSupabaseClient()

  const { data: submissions, error: submissionsError } = await supabase
    .schema('waitlist')
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: colors.mistyForest }}>
            Waitlist Submissions
          </h1>
          <p className="mt-2" style={{ color: colors.textSecondary }}>
            {submissions?.length || 0} total submissions
          </p>
        </div>
        <a
          href="/api/admin/export-waitlist"
          className="inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: colors.mistyForest,
            borderRadius: radius.md,
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
            <TableRow key={submission.id} index={index}>
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
    </div>
  )
}
