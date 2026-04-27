'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { Table, TableRow, TableCell } from '../components/Table'
import { ApplicationDetailSidebar } from '../components/ApplicationDetailSidebar'
import type { CachedEnrollmentData } from '../components/ApplicationDetailSidebar'
import { AdminEnrollmentItemDrawer } from '../components/AdminEnrollmentItemDrawer'
import { EnrollmentPipelineView } from '../components/EnrollmentPipelineView'
import { cssColors as colors } from '../design-system'
import { Poppins } from 'next/font/google'
import { approveApplication } from '../../actions/approveApplication'
import { denyApplication } from '../../actions/denyApplication'
import { updateApplicationTags } from '../../actions/updateApplicationTags'
import { PRESET_TAGS } from '../constants/applicationTags'

const merriweather = Poppins({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

const KANBAN_COLUMNS = [
  { key: 'in_progress',        collapsible: true,  label: 'In Progress',              accent: '#f59e0b', filter: (apps: Application[]) => apps.filter(a => a.status === 'in_progress') },
  { key: 'in_review',          collapsible: true,  label: 'In Review',                accent: '#a855f7', filter: (apps: Application[]) => apps.filter(a => a.status === 'in_review') },
  { key: 'enrolling',          collapsible: true,  label: 'Enrolling',                accent: '#3b82f6', filter: (apps: Application[]) => apps.filter(a => a.status === 'enrolling') },
  { key: 'enrolled',           collapsible: false, label: 'Enrolled',                 accent: '#22c55e', filter: (apps: Application[]) => apps.filter(a => a.status === 'enrolled') },
  { key: 'summer_26',          collapsible: false, label: 'Summer 2026',              accent: '#f59e0b', filter: (apps: Application[]) => apps.filter(a => a.status === 'enrolled' && (a.program === 'summer_26' || a.program === 'both')) },
  { key: 'school_year_26_27',  collapsible: false, label: 'School Year 2026–2027',    accent: '#6366f1', filter: (apps: Application[]) => apps.filter(a => a.status === 'enrolled' && (a.program === 'school_year_26_27' || a.program === 'both')) },
  { key: 'homeschool_drop_in', collapsible: false, label: 'Homeschool Drop-In Program', accent: '#10b981', filter: (apps: Application[]) => apps.filter(a => a.status === 'enrolled' && a.program === 'homeschool_drop_in') },
]

const PROGRAM_LABELS: Record<string, string> = {
  summer_26: 'Summer 2026',
  school_year_26_27: 'School Year 2026-2027',
  both: 'Both',
  homeschool_drop_in: 'Homeschool Drop-In',
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
  drop_in_program: string | null
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
  admin_tags: string[] | null
  is_active: boolean | null
  [key: string]: unknown
}

function KanbanTagEditor({
  app,
  onTagsChanged,
}: {
  app: Application
  onTagsChanged: (id: string, tags: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const tags = app.admin_tags ?? []

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
    }
    setOpen(o => !o)
  }

  const toggle = async (e: React.MouseEvent, tag: string) => {
    e.stopPropagation()
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]
    setSaving(true)
    const result = await updateApplicationTags(app.id, next)
    setSaving(false)
    if (result.success) onTagsChanged(app.id, next)
  }

  return (
    <div className="mt-1.5" onClick={e => e.stopPropagation()}>
      <div className="flex flex-wrap gap-1 items-center">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200"
          >
            {tag}
            <button
              onClick={e => toggle(e, tag)}
              disabled={saving}
              className="text-violet-300 hover:text-violet-600 transition-colors disabled:opacity-50 leading-none"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <button
          ref={buttonRef}
          onClick={handleOpen}
          disabled={saving}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-dashed border-violet-300 text-violet-400 hover:border-violet-500 hover:text-violet-600 transition-colors disabled:opacity-50 text-[10px] leading-none"
          aria-label="Add tag"
        >
          +
        </button>
      </div>

      {open && typeof window !== 'undefined' && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex flex-col gap-2"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: '232px' }}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TAGS.map(tag => {
              const active = tags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={e => toggle(e, tag)}
                  disabled={saving}
                  className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors disabled:opacity-50 ${
                    active
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                  }`}
                >
                  {active ? '✓ ' : ''}{tag}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TagCell({
  app,
  onTagsChanged,
}: {
  app: Application
  onTagsChanged: (id: string, tags: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const tags = app.admin_tags ?? []

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
    }
    setOpen(o => !o)
  }

  const toggle = async (tag: string) => {
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]
    setSaving(true)
    const result = await updateApplicationTags(app.id, next)
    setSaving(false)
    if (result.success) onTagsChanged(app.id, next)
  }

  const addCustom = async () => {
    const tag = customInput.trim()
    if (!tag || tags.includes(tag)) { setCustomInput(''); return }
    setSaving(true)
    const next = [...tags, tag]
    const result = await updateApplicationTags(app.id, next)
    setSaving(false)
    if (result.success) { onTagsChanged(app.id, next); setCustomInput('') }
  }

  return (
    <div onClick={e => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="flex flex-wrap gap-1 items-center min-w-[60px] group"
      >
        {tags.length === 0 ? (
          <span className="text-[10px] text-gray-300 group-hover:text-gray-400 transition-colors">+ Add tag</span>
        ) : (
          tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              {tag}
            </span>
          ))
        )}
      </button>

      {open && typeof window !== 'undefined' && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex flex-col gap-2"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: '240px' }}
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Preset Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TAGS.map(tag => {
              const active = tags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggle(tag)}
                  disabled={saving}
                  className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors disabled:opacity-50 ${
                    active
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                  }`}
                >
                  {active ? '✓ ' : ''}{tag}
                </button>
              )
            })}
          </div>
          <div className="border-t border-gray-100 pt-2 flex gap-1.5">
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
              placeholder="Custom tag…"
              className="flex-1 text-[10px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-300 focus:border-violet-400 bg-white"
            />
            <button
              onClick={addCustom}
              disabled={saving || !customInput.trim()}
              className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [view, setView] = useState<'table' | 'kanban' | 'pipeline'>('table')
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [selectedItemStudentId, setSelectedItemStudentId] = useState<string | null>(null)
  const [drawerApp, setDrawerApp] = useState<Application | null>(null)
  const [drawerEnrollmentData, setDrawerEnrollmentData] = useState<CachedEnrollmentData | null>(null)
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set(['in_progress', 'in_review', 'enrolling']))
  const [boardExcludedTags, setBoardExcludedTags] = useState<Set<string>>(new Set(["Don't Include"]))
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

  const handleEnrolled = (id: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: 'enrolled' } : app))
    )
    setSelectedApp((prev) =>
      prev?.id === id ? { ...prev, status: 'enrolled' } : prev
    )
  }

  const handleProgramChanged = (id: string, program: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, program } : app))
    )
    setSelectedApp((prev) =>
      prev?.id === id ? { ...prev, program } : prev
    )
  }

  const handleTagsChanged = (id: string, tags: string[]) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, admin_tags: tags } : app))
    )
    setSelectedApp((prev) =>
      prev?.id === id ? { ...prev, admin_tags: tags } : prev
    )
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

  const filteredApplications = searchQuery
    ? applications.filter((app) => {
        const q = searchQuery.toLowerCase()
        return (
          app.g1_full_name?.toLowerCase().includes(q) ||
          app.g1_email?.toLowerCase().includes(q) ||
          app.child_legal_name?.toLowerCase().includes(q) ||
          app.preferred_name?.toLowerCase().includes(q) ||
          app.child_grade?.toLowerCase().includes(q) ||
          app.program?.toLowerCase().includes(q)
        )
      })
    : applications

  const kanbanApplications = boardExcludedTags.size === 0
    ? filteredApplications
    : filteredApplications.filter(app =>
        !(app.admin_tags ?? []).some(t => boardExcludedTags.has(t))
      )

  const toggleBoardExcludeTag = (tag: string) => {
    setBoardExcludedTags(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
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
            {filteredApplications.length}{searchQuery ? ` of ${applications.length}` : ''} application{filteredApplications.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ backgroundColor: colors.warmLinen, border: `1px solid ${colors.border}` }}>
            <svg className="ml-1.5 w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-2 py-0.5 text-xs font-semibold bg-transparent border-none outline-none w-40 placeholder:font-normal"
              style={{ color: colors.textSecondary }}
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: colors.warmLinen, border: `1px solid ${colors.border}` }}>
            {(['active', 'inactive'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedApp(null); setSearchQuery('') }}
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
            {(['table', 'kanban', 'pipeline'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                style={view === v
                  ? { backgroundColor: '#fff', color: colors.mistyForest, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: colors.textSecondary }
                }
              >
                {v === 'table' ? 'Table' : v === 'kanban' ? 'Board' : 'Pipeline'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'kanban' && (
        <div className="flex items-center gap-2 flex-wrap -mt-2">
          <span className="text-xs font-semibold" style={{ color: colors.textTertiary }}>Exclude:</span>
          {PRESET_TAGS.map(tag => {
            const excluded = boardExcludedTags.has(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleBoardExcludeTag(tag)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                  excluded
                    ? 'bg-red-50 text-red-600 border-red-200 line-through opacity-70'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {excluded && <span className="not-italic no-underline">✕</span>}
                {tag}
              </button>
            )
          })}
          {boardExcludedTags.size > 0 && (
            <button
              onClick={() => setBoardExcludedTags(new Set())}
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {filteredApplications.length > 0 ? (
              <Table
                headers={[
                  'Parent',
                  'Child Name',
                  'Age / Grade',
                  'Program',
                  'Status',
                  'Approved',
                  'Tags',
                  'Submitted',
                  'Actions',
                ]}
              >
                {filteredApplications.map((app, index) => {
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
                      <TableCell style={{ overflow: 'visible', position: 'relative' }}>
                        <TagCell app={app} onTagsChanged={handleTagsChanged} />
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
        ) : view === 'pipeline' ? (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <EnrollmentPipelineView
              applications={filteredApplications as Parameters<typeof EnrollmentPipelineView>[0]['applications']}
              setSelectedApp={(app) => setSelectedApp(app as Application)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="kanban"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-x-auto pb-2"
            style={{ overflowX: 'auto', overflowY: 'visible' }}
          >
            <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
            {KANBAN_COLUMNS.map(col => {
              const cards = col.filter(kanbanApplications)
              const isCollapsed = col.collapsible && collapsedCols.has(col.key)
              const toggleCollapse = () => {
                setCollapsedCols(prev => {
                  const next = new Set(prev)
                  next.has(col.key) ? next.delete(col.key) : next.add(col.key)
                  return next
                })
              }

              if (isCollapsed) {
                return (
                  <div
                    key={col.key}
                    onClick={toggleCollapse}
                    className="flex-shrink-0 w-10 flex flex-col items-center gap-2 bg-gray-50 rounded-2xl py-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    title={`${col.label} (${cards.length}) — click to expand`}
                  >
                    <div className="w-0.5 h-5 rounded-full" style={{ backgroundColor: col.accent }} />
                    <span
                      className="text-[10px] font-semibold text-gray-400 select-none"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.05em' }}
                    >
                      {col.label}
                    </span>
                    <span className="text-[10px] font-bold mt-auto mb-1" style={{ color: col.accent }}>
                      {cards.length}
                    </span>
                  </div>
                )
              }

              return (
                <div key={col.key} className="flex-shrink-0 w-72 flex flex-col gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-200">
                  <div
                    className="flex items-center justify-between pl-3 py-1.5 mb-1"
                    style={{ borderLeft: `3px solid ${col.accent}` }}
                  >
                    <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">{cards.length}</span>
                      {col.collapsible && (
                        <button
                          onClick={toggleCollapse}
                          className="text-gray-300 hover:text-gray-500 transition-colors leading-none text-base"
                          title="Collapse column"
                        >
                          ‹
                        </button>
                      )}
                    </div>
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
                        {/* Child name */}
                        <div className={`text-sm font-bold text-gray-900 leading-snug ${merriweather.className}`}>
                          {app.child_legal_name ?? '—'}
                        </div>

                        {/* Tags (replaces preferred name) */}
                        <KanbanTagEditor app={app} onTagsChanged={handleTagsChanged} />

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
                          {app.program === 'homeschool_drop_in' && app.drop_in_program && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                              {formatProgram(app.drop_in_program)}
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
            </div>
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
          onEnrolled={handleEnrolled}
          onItemClick={handleItemClick}
          onProgramChanged={handleProgramChanged}
          onTagsChanged={handleTagsChanged}
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
