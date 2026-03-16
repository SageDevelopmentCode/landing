'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { Table, TableRow, TableCell } from '../components/Table'
import { ApplicationDetailSidebar } from '../components/ApplicationDetailSidebar'
import type { CachedEnrollmentData } from '../components/ApplicationDetailSidebar'
import { AdminEnrollmentItemDrawer } from '../components/AdminEnrollmentItemDrawer'
import { colors } from '../design-system'
import { Merriweather } from 'next/font/google'
import { approveApplication } from '../../actions/approveApplication'
import { denyApplication } from '../../actions/denyApplication'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

const KANBAN_COLUMNS = [
  { key: 'in_progress',       label: 'In Progress',           accent: '#f59e0b', filter: (apps: Application[]) => apps.filter(a => a.status === 'in_progress') },
  { key: 'in_review',         label: 'In Review',             accent: '#a855f7', filter: (apps: Application[]) => apps.filter(a => a.status === 'in_review') },
  { key: 'enrolling',         label: 'Enrolling',             accent: '#3b82f6', filter: (apps: Application[]) => apps.filter(a => a.status === 'enrolling') },
  { key: 'enrolled',          label: 'Enrolled',              accent: '#22c55e', filter: (apps: Application[]) => apps.filter(a => a.status === 'enrolled') },
  { key: 'summer_26',         label: 'Summer 2026',           accent: '#f59e0b', filter: (apps: Application[]) => apps.filter(a => a.status === 'enrolled' && (a.program === 'summer_26' || a.program === 'both')) },
  { key: 'school_year_26_27', label: 'School Year 2026–2027', accent: '#6366f1', filter: (apps: Application[]) => apps.filter(a => a.status === 'enrolled' && (a.program === 'school_year_26_27' || a.program === 'both')) },
]

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026-2027',
  both: 'Both',
}

function formatProgram(value: string | null): string {
  if (!value) return '—'
  return PROGRAM_LABELS[value] ?? value
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_review:   { label: 'In Review',   className: 'bg-purple-50 text-purple-700 border-purple-200' },
  enrolling:   { label: 'Enrolling',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  enrolled:    { label: 'Enrolled',    className: 'bg-green-50 text-green-700 border-green-200' },
  completed:   { label: 'Completed',   className: 'bg-gray-100 text-gray-600 border-gray-300' },
}

function formatStatus(status: string) {
  return STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  }
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
  admin_notes: string | null
  is_active: boolean | null
  [key: string]: unknown
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [selectedItemStudentId, setSelectedItemStudentId] = useState<string | null>(null)
  const [drawerApp, setDrawerApp] = useState<Application | null>(null)
  const [drawerEnrollmentData, setDrawerEnrollmentData] = useState<CachedEnrollmentData | null>(null)
  const pendingApp = useRef<Application | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function fetchData() {
      const query = supabase
        .schema('parent_app')
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: appsData } = await (activeTab === 'active'
        ? query.eq('is_active', true)
        : query.eq('is_active', false))

      setApplications(appsData ?? [])
      setIsLoading(false)
    }

    fetchData()
  }, [activeTab])

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

  const handleDeactivated = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id))
    setSelectedApp((prev) => (prev?.id === id ? null : prev))
  }

  function handleItemClick(itemId: number, studentId: string, data: CachedEnrollmentData | null) {
    pendingApp.current = selectedApp
    setSelectedApp(null)
    setTimeout(() => {
      setDrawerApp(pendingApp.current)
      setDrawerEnrollmentData(data)
      setSelectedItemId(itemId)
      setSelectedItemStudentId(studentId)
    }, 350)
  }

  function handleItemDrawerClose() {
    setSelectedItemId(null)
    setSelectedItemStudentId(null)
    setDrawerApp(null)
    setDrawerEnrollmentData(null)
    if (pendingApp.current) {
      setSelectedApp(pendingApp.current)
      pendingApp.current = null
    }
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
      <div className="flex items-start justify-between gap-4">
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
        <div className="flex items-center gap-2 mt-1">
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: colors.warmLinen, border: `1px solid ${colors.border}` }}>
            {(['active', 'inactive'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedApp(null) }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize"
                style={activeTab === tab
                  ? { backgroundColor: '#fff', color: colors.mistyForest, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: colors.textSecondary }
                }
              >
                {tab === 'active' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: colors.warmLinen, border: `1px solid ${colors.border}` }}>
            {(['table', 'kanban'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                style={view === v
                  ? { backgroundColor: '#fff', color: colors.mistyForest, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: colors.textSecondary }
                }
              >
                {v === 'table' ? 'Table' : 'Board'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
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
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${formatStatus(app.status).className}`}>
                          {formatStatus(app.status).label}
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
          </motion.div>
        ) : (
          <motion.div
            key="kanban"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex gap-4 overflow-x-auto pb-4"
          >
            {KANBAN_COLUMNS.map(col => {
              const cards = col.filter(applications)
              return (
                <div key={col.key} className="flex-shrink-0 w-72 flex flex-col gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-200">
                  <div
                    className="flex items-center justify-between pl-3 py-1.5 mb-1"
                    style={{ borderLeft: `3px solid ${col.accent}` }}
                  >
                    <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                    <span className="text-xs text-gray-400 font-medium">{cards.length}</span>
                  </div>
                  {cards.length === 0 ? (
                    <div className="text-xs text-gray-400 italic px-1">No applications</div>
                  ) : (
                    cards.map(app => (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        {/* Child name — Merriweather serif */}
                        <div className={`text-sm font-bold text-gray-900 leading-snug ${merriweather.className}`}>
                          {app.child_legal_name ?? '—'}
                        </div>

                        {/* Preferred name */}
                        {app.preferred_name && (
                          <div className="text-xs text-gray-400 italic mt-0.5">"{app.preferred_name}"</div>
                        )}

                        {/* Program + Grade badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {app.program === 'summer_26' && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Summer 2026
                            </span>
                          )}
                          {app.program === 'school_year_26_27' && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              School Year
                            </span>
                          )}
                          {app.program === 'both' && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Both Programs
                            </span>
                          )}
                          {app.child_grade && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              Grade {app.child_grade}
                            </span>
                          )}
                        </div>

                        {/* Parent info */}
                        {app.g1_full_name && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span className="text-xs text-gray-600 truncate">{app.g1_full_name}</span>
                            {app.g1_relationship && (
                              <span className="text-xs text-gray-400 flex-shrink-0">· {app.g1_relationship}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedApp && (
        <ApplicationDetailSidebar
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApproved={handleApproved}
          onDenied={handleDenied}
          onDeactivated={handleDeactivated}
          onItemClick={handleItemClick}
        />
      )}

      <AdminEnrollmentItemDrawer
        itemId={selectedItemId}
        studentId={selectedItemStudentId}
        app={drawerApp}
        enrollmentData={drawerEnrollmentData}
        onClose={handleItemDrawerClose}
      />
    </div>
  )
}
