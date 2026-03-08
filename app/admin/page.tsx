import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import Link from 'next/link'
import { StatCard } from './components/StatCard'
import { colors, radius, shadows } from './design-system'
import { Merriweather } from 'next/font/google'
import { fetchSentEmails, isZohoConfigured } from '@/app/lib/zoho'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()

  // Fetch Zoho sent emails if configured
  let zohoEmails = []
  if (await isZohoConfigured()) {
    try {
      zohoEmails = await fetchSentEmails(20)
      console.log('=== ZOHO SENT EMAILS ===')
      console.log(`Total emails fetched: ${zohoEmails.length}`)
      console.log(JSON.stringify(zohoEmails, null, 2))
      console.log('========================')
    } catch (error) {
      console.error('Error fetching Zoho emails:', error)
    }
  } else {
    console.log('Zoho Mail API is not configured. Skipping email fetch.')
  }

  // Get waitlist count
  const { count: waitlistCount } = await supabase
    .schema('waitlist')
    .from('submissions')
    .select('*', { count: 'exact', head: true })

  // Get contact count
  const { count: contactCount } = await supabase
    .schema('contact')
    .from('submissions')
    .select('*', { count: 'exact', head: true })

  // Calculate total leads
  const totalLeads = (waitlistCount || 0) + (contactCount || 0)

  // Get recent waitlist submissions
  const { data: recentWaitlist } = await supabase
    .schema('waitlist')
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  // Get recent contact submissions
  const { data: recentContact } = await supabase
    .schema('contact')
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  // Combine and sort recent submissions
  const recentLeads = [
    ...(recentWaitlist || []).map((item) => ({ ...item, type: 'waitlist' as const })),
    ...(recentContact || []).map((item) => ({ ...item, type: 'contact' as const })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  return (
    <div className="space-y-8 pt-6">
      <div>
        <h1
          className={`text-3xl font-bold ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          Dashboard
        </h1>
        <p className="mt-2" style={{ color: colors.textSecondary }}>
          Welcome to your Sagefield School admin dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-1 max-w-md">
        <StatCard
          title="Total Leads"
          value={totalLeads}
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
          href="/admin/leads"
          delay={0}
        />
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
          className="px-5 py-3.5 flex items-center justify-between"
          style={{
            backgroundColor: colors.warmLinen,
            borderBottom: `1px solid ${colors.border}`,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
          }}
        >
          <h3
            className={`text-lg font-semibold ${merriweather.className}`}
            style={{ color: colors.mistyForest }}
          >
            Recent Leads
          </h3>
          <Link
            href="/admin/leads"
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: colors.mistyForest }}
          >
            View all →
          </Link>
        </div>
        <div className="px-5 py-4">
          {recentLeads && recentLeads.length > 0 ? (
            <ul style={{ borderTop: `1px solid ${colors.divider}` }}>
              {recentLeads.map((lead, index) => {
                const isWaitlist = lead.type === 'waitlist'
                const name = 'parent_name' in lead
                  ? (lead as { parent_name: string }).parent_name
                  : (lead as { name: string }).name
                const email = lead.email

                return (
                  <li
                    key={lead.id}
                    className="py-2.5"
                    style={{
                      borderBottom:
                        index < recentLeads.length - 1
                          ? `1px solid ${colors.divider}`
                          : 'none',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
                            style={{
                              backgroundColor: isWaitlist
                                ? colors.paleMarigold
                                : colors.powderBlue,
                              color: colors.textPrimary,
                            }}
                          >
                            {isWaitlist ? 'Waitlist' : 'Contact'}
                          </span>
                          <p
                            className="text-sm font-medium"
                            style={{ color: colors.textPrimary }}
                          >
                            {name}
                          </p>
                        </div>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {email}
                        </p>
                      </div>
                      <div className="text-sm" style={{ color: colors.textTertiary }}>
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p style={{ color: colors.textSecondary }}>No submissions yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
