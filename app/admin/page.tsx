import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()

  console.log('=== ADMIN DASHBOARD DEBUG ===')

  // Get waitlist count
  const { count: waitlistCount, error: waitlistCountError } = await supabase
    .schema('waitlist')
    .from('submissions')
    .select('*', { count: 'exact', head: true })

  console.log('Waitlist count query:')
  console.log('  - count:', waitlistCount)
  console.log('  - error:', waitlistCountError)

  // Get contact count
  const { count: contactCount, error: contactCountError } = await supabase
    .schema('contact')
    .from('submissions')
    .select('*', { count: 'exact', head: true })

  console.log('Contact count query:')
  console.log('  - count:', contactCount)
  console.log('  - error:', contactCountError)

  // Get recent waitlist submissions
  const { data: recentWaitlist, error: recentWaitlistError } = await supabase
    .schema('waitlist')
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('Recent waitlist query:')
  console.log('  - data:', recentWaitlist)
  console.log('  - error:', recentWaitlistError)

  // Get recent contact submissions
  const { data: recentContact, error: recentContactError } = await supabase
    .schema('contact')
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('Recent contact query:')
  console.log('  - data:', recentContact)
  console.log('  - error:', recentContactError)
  console.log('==============================')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your Sagefield School admin dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Waitlist Submissions
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {waitlistCount || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link
              href="/admin/waitlist"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Contact Submissions
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {contactCount || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link
              href="/admin/contact"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Waitlist Submissions
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {recentWaitlist && recentWaitlist.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentWaitlist.map((submission) => (
                  <li key={submission.id} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {submission.parent_name}
                        </p>
                        <p className="text-sm text-gray-500">{submission.email}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No submissions yet</p>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Contact Submissions
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {recentContact && recentContact.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentContact.map((submission) => (
                  <li key={submission.id} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {submission.name}
                        </p>
                        <p className="text-sm text-gray-500">{submission.email}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No submissions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
