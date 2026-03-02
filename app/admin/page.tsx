import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import Link from 'next/link'
import { StatCard } from './components/StatCard'
import { colors, radius, shadows } from './design-system'

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()

  // Get waitlist count
  const { count: waitlistCount, error: waitlistCountError } = await supabase
    .schema('waitlist')
    .from('submissions')
    .select('*', { count: 'exact', head: true })

  // Get contact count
  const { count: contactCount, error: contactCountError } = await supabase
    .schema('contact')
    .from('submissions')
    .select('*', { count: 'exact', head: true })

  // Get recent waitlist submissions
  const { data: recentWaitlist, error: recentWaitlistError } = await supabase
    .schema('waitlist')
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent contact submissions
  const { data: recentContact, error: recentContactError } = await supabase
    .schema('contact')
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: colors.mistyForest }}>
          Dashboard
        </h1>
        <p className="mt-2" style={{ color: colors.textSecondary }}>
          Welcome to your Sagefield School admin dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <StatCard
          title="Waitlist Submissions"
          value={waitlistCount || 0}
          icon={
            <svg
              className="h-6 w-6"
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
          }
          iconColor={colors.mistyForest}
          iconBgColor={colors.pastelSage}
          href="/admin/waitlist"
          delay={0}
        />

        <StatCard
          title="Contact Submissions"
          value={contactCount || 0}
          icon={
            <svg
              className="h-6 w-6"
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
          }
          iconColor={colors.mistyForest}
          iconBgColor={colors.dustyRose}
          href="/admin/contact"
          delay={0.1}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          className="bg-white"
          style={{
            borderRadius: radius.lg,
            boxShadow: shadows.soft,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{
              backgroundColor: colors.warmLinen,
              borderBottom: `1px solid ${colors.border}`,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
            }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: colors.mistyForest }}
            >
              Recent Waitlist Submissions
            </h3>
            <Link
              href="/admin/waitlist"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: colors.mistyForest }}
            >
              View all →
            </Link>
          </div>
          <div className="px-6 py-5">
            {recentWaitlist && recentWaitlist.length > 0 ? (
              <ul style={{ borderTop: `1px solid ${colors.divider}` }}>
                {recentWaitlist.map((submission, index) => (
                  <li
                    key={submission.id}
                    className="py-4"
                    style={{
                      borderBottom:
                        index < recentWaitlist.length - 1
                          ? `1px solid ${colors.divider}`
                          : 'none',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: colors.textPrimary }}
                        >
                          {submission.parent_name}
                        </p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {submission.email}
                        </p>
                      </div>
                      <div className="text-sm" style={{ color: colors.textTertiary }}>
                        {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: colors.textSecondary }}>No submissions yet</p>
            )}
          </div>
        </div>

        <div
          className="bg-white"
          style={{
            borderRadius: radius.lg,
            boxShadow: shadows.soft,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{
              backgroundColor: colors.warmLinen,
              borderBottom: `1px solid ${colors.border}`,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
            }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: colors.mistyForest }}
            >
              Recent Contact Submissions
            </h3>
            <Link
              href="/admin/contact"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: colors.mistyForest }}
            >
              View all →
            </Link>
          </div>
          <div className="px-6 py-5">
            {recentContact && recentContact.length > 0 ? (
              <ul style={{ borderTop: `1px solid ${colors.divider}` }}>
                {recentContact.map((submission, index) => (
                  <li
                    key={submission.id}
                    className="py-4"
                    style={{
                      borderBottom:
                        index < recentContact.length - 1
                          ? `1px solid ${colors.divider}`
                          : 'none',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: colors.textPrimary }}
                        >
                          {submission.name}
                        </p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {submission.email}
                        </p>
                      </div>
                      <div className="text-sm" style={{ color: colors.textTertiary }}>
                        {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: colors.textSecondary }}>No submissions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
