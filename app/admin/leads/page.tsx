'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Table, TableRow, TableCell } from '../components/Table'
import { StatusBadge } from '../components/StatusBadge'
import { LeadsDetailSidebar } from '../components/LeadsDetailSidebar'
import { colors, radius, shadows } from '../design-system'
import { Merriweather } from 'next/font/google'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

type WaitlistLead = {
  id: string
  type: 'waitlist'
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

type ContactLead = {
  id: string
  type: 'contact'
  name: string
  email: string
  phone: string
  message: string
  status: string
  created_at: string
}

type Lead = WaitlistLead | ContactLead

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function fetchLeads() {
      // Fetch waitlist submissions
      const { data: waitlistData } = await supabase
        .schema('waitlist')
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch contact submissions
      const { data: contactData } = await supabase
        .schema('contact')
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      // Combine and add type field
      const waitlistLeads: WaitlistLead[] = (waitlistData || []).map((item) => ({
        ...item,
        type: 'waitlist' as const,
      }))

      const contactLeads: ContactLead[] = (contactData || []).map((item) => ({
        ...item,
        type: 'contact' as const,
      }))

      // Merge and sort by created_at
      const allLeads = [...waitlistLeads, ...contactLeads].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setLeads(allLeads)
      setIsLoading(false)
    }

    fetchLeads()
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
            Leads
          </h1>
          <p className="mt-2" style={{ color: colors.textSecondary }}>
            {leads.length} total submissions
          </p>
        </div>
        <a
          href="/api/admin/export-leads"
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

      {leads && leads.length > 0 ? (
        <Table
          headers={[
            'Type',
            'Name/Parent',
            'Contact',
            'Child Info',
            'Message',
            'Start Date',
            'Status',
            'Submitted',
          ]}
        >
          {leads.map((lead, index) => {
            const isWaitlist = lead.type === 'waitlist'
            const isContact = lead.type === 'contact'

            return (
              <TableRow
                key={lead.id}
                index={index}
                onClick={() => setSelectedLead(lead)}
              >
                <TableCell>
                  <span
                    className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: isWaitlist
                        ? colors.paleMarigold
                        : colors.powderBlue,
                      color: isWaitlist ? colors.textPrimary : colors.textPrimary,
                    }}
                  >
                    {isWaitlist ? 'Waitlist' : 'Contact'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {isWaitlist ? lead.parent_name : lead.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{lead.email}</div>
                  <div className="text-sm" style={{ color: colors.textSecondary }}>
                    {lead.phone}
                  </div>
                </TableCell>
                <TableCell>
                  {isWaitlist ? (
                    <>
                      <div>{lead.child_name}</div>
                      <div className="text-sm" style={{ color: colors.textSecondary }}>
                        Age: {lead.child_age || 'N/A'}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: colors.textSecondary }}>—</div>
                  )}
                </TableCell>
                <TableCell>
                  {isContact ? (
                    <div className="max-w-xs truncate" title={lead.message}>
                      {lead.message}
                    </div>
                  ) : (
                    <div style={{ color: colors.textSecondary }}>—</div>
                  )}
                </TableCell>
                <TableCell>
                  <div style={{ color: colors.textSecondary }}>
                    {isWaitlist && lead.preferred_start_date
                      ? lead.preferred_start_date
                      : '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={(lead.status || 'pending') as any}
                    type={lead.type}
                  />
                </TableCell>
                <TableCell>
                  <div style={{ color: colors.textSecondary }}>
                    {new Date(lead.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
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

      <LeadsDetailSidebar
        submission={selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  )
}
