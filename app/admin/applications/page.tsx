'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Table, TableRow, TableCell } from '../components/Table'
import { ApplicationDetailSidebar } from '../components/ApplicationDetailSidebar'
import { colors } from '../design-system'
import { Merriweather } from 'next/font/google'
import { approveApplication } from '../../actions/approveApplication'
import { denyApplication } from '../../actions/denyApplication'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026-2027',
  both: 'Both',
}

function formatProgram(value: string | null): string {
  if (!value) return '—'
  return PROGRAM_LABELS[value] ?? value
}

type Application = {
  id: string
  user_id: string
  child_legal_name: string | null
  preferred_name: string | null
  dob_month: string | null
  dob_day: string | null
  dob_year: string | null
  child_age: number | null
  child_grade: string | null
  program: string | null
  address_street: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  is_homeschooled: string | null
  homeschool_explanation: string | null
  previous_schools: string | null
  previous_schools_list: string | null
  special_interests: string | null
  has_allergies: boolean | null
  allergies_description: string | null
  has_medical_conditions: boolean | null
  medical_conditions_description: string | null
  has_emergency_medications: boolean | null
  emergency_medications_description: string | null
  activities_to_avoid: string | null
  dysregulation_response: string | null
  regulation_strategies: string | null
  needs_aide: boolean | null
  needs_aide_description: string | null
  history_flags: string | null
  history_explanation: string | null
  has_custody_orders: boolean | null
  custody_orders_description: string | null
  learning_style: string | null
  strengths_interests: string | null
  current_challenges: string | null
  g1_full_name: string | null
  g1_relationship: string | null
  g1_cell_phone: string | null
  g1_work_phone: string | null
  g1_email: string | null
  g1_has_custody: boolean | null
  g1_lives_with_child: boolean | null
  g1_preferred_contact: boolean | null
  g2_full_name: string | null
  g2_relationship: string | null
  g2_cell_phone: string | null
  g2_work_phone: string | null
  g2_email: string | null
  g2_has_custody: boolean | null
  g2_lives_with_child: boolean | null
  g2_preferred_contact: boolean | null
  status: string
  approved: boolean
  approved_at: string | null
  denied: boolean
  denied_at: string | null
  denied_reason: string | null
  created_at: string | null
  student_id: string | null
  [key: string]: unknown
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function fetchData() {
      const { data: appsData } = await supabase
        .schema('parent_app')
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })

      setApplications(appsData ?? [])
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const handleApproved = (id: string) => {
    const now = new Date().toISOString()
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, approved: true, approved_at: now } : app
      )
    )
    setSelectedApp((prev) =>
      prev?.id === id ? { ...prev, approved: true, approved_at: now } : prev
    )
  }

  const handleDenied = (id: string, reason: string) => {
    const now = new Date().toISOString()
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, denied: true, denied_at: now, denied_reason: reason } : app
      )
    )
    setSelectedApp((prev) =>
      prev?.id === id ? { ...prev, denied: true, denied_at: now, denied_reason: reason } : prev
    )
  }

  const handleRowApprove = async (e: React.MouseEvent, app: Application) => {
    e.stopPropagation()
    if (app.approved || approvingId === app.id) return
    setApprovingId(app.id)
    const result = await approveApplication(app.id)
    setApprovingId(null)
    if (result.success) {
      handleApproved(app.id)
    }
  }

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
    <div className="space-y-6 pt-6">
      <div>
        <h1
          className={`text-2xl font-bold ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          Applications
        </h1>
        <p className="mt-2" style={{ color: colors.textSecondary }}>
          {applications.length} total application{applications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {applications.length > 0 ? (
        <Table
          headers={[
            'Parent',
            'Child Name',
            'Age / Grade',
            'Program',
            'Status',
            'Approved',
            'Submitted',
            'Actions',
          ]}
        >
          {applications.map((app, index) => {
            const isApproving = approvingId === app.id

            return (
              <TableRow
                key={app.id}
                index={index}
                onClick={() => setSelectedApp(app)}
              >
                <TableCell>
                  <div className="font-medium">{app.g1_full_name ?? '—'}</div>
                  <div className="text-xs text-gray-400 font-body">
                    {app.g1_email ?? '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{app.child_legal_name ?? '—'}</div>
                  {app.preferred_name && (
                    <div className="text-xs text-gray-400 font-body">
                      "{app.preferred_name}"
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>{app.child_age != null ? `Age ${app.child_age}` : '—'}</div>
                  {app.child_grade && (
                    <div className="text-xs text-gray-400 font-body">
                      {app.child_grade}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-gray-600">{formatProgram(app.program)}</div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {app.status}
                  </span>
                </TableCell>
                <TableCell>
                  {app.approved ? (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
                      Approved
                    </span>
                  ) : app.denied ? (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-600 border border-red-200">
                      Denied
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-gray-600">
                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedApp(app) }}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => handleRowApprove(e, app)}
                      disabled={app.approved || app.denied || isApproving}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        app.approved
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : app.denied || isApproving
                          ? 'bg-[#2C5F2E] text-white opacity-60 cursor-not-allowed'
                          : 'bg-[#2C5F2E] text-white hover:bg-[#234d25] cursor-pointer'
                      }`}
                    >
                      {isApproving ? '...' : app.approved ? 'Approved' : 'Approve'}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </Table>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-500">No applications yet</p>
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailSidebar
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApproved={handleApproved}
          onDenied={handleDenied}
        />
      )}
    </div>
  )
}
