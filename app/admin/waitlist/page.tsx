import { createServerSupabaseClient } from '@/app/lib/supabase-server'

async function exportToCSV(data: any[]) {
  'use server'

  const headers = [
    'ID',
    'Parent Name',
    'Email',
    'Phone',
    'Child Name',
    'Child Age',
    'Preferred Start',
    'Status',
    'Notes',
    'Created At',
  ]

  const rows = data.map((item) => [
    item.id,
    item.parent_name,
    item.email,
    item.phone || '',
    item.child_name,
    item.child_age || '',
    item.preferred_start_date || '',
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

  return csv
}

async function updateSubmissionStatus(formData: FormData) {
  'use server'

  const id = formData.get('id') as string
  const status = formData.get('status') as string
  const notes = formData.get('notes') as string

  const supabase = await createServerSupabaseClient()

  await supabase
    .schema('waitlist')
    .from('submissions')
    .update({ status, notes })
    .eq('id', id)
}

export default async function WaitlistPage() {
  const supabase = await createServerSupabaseClient()

  console.log('=== WAITLIST PAGE DEBUG ===')

  const { data: submissions, error: submissionsError } = await supabase
    .schema('waitlist')
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('Waitlist submissions query:')
  console.log('  - data count:', submissions?.length || 0)
  console.log('  - error:', submissionsError)
  console.log('===========================')

  const csvData = submissions ? await exportToCSV(submissions) : ''

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Waitlist Submissions</h1>
          <p className="mt-2 text-gray-600">
            {submissions?.length || 0} total submissions
          </p>
        </div>
        <form
          action={async () => {
            'use server'
            return new Response(csvData, {
              headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="waitlist-${new Date().toISOString()}.csv"`,
              },
            })
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
          </button>
        </form>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Child Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions && submissions.length > 0 ? (
                submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.parent_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{submission.email}</div>
                      <div className="text-sm text-gray-500">{submission.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{submission.child_name}</div>
                      <div className="text-sm text-gray-500">
                        Age: {submission.child_age || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.preferred_start_date || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          submission.status === 'enrolled'
                            ? 'bg-green-100 text-green-800'
                            : submission.status === 'contacted'
                            ? 'bg-blue-100 text-blue-800'
                            : submission.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {submission.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No submissions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
