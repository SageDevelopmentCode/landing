'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'

import { InlineStatusEditor } from '../components/InlineStatusEditor'
import { TagEditor, PREDEFINED_TAGS, getTagColor } from '../components/TagEditor'
import { LeadsDetailSidebar } from '../components/LeadsDetailSidebar'
import { AddLeadSidebar } from '../components/AddLeadSidebar'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'
import { Poppins } from 'next/font/google'
import { LeadStatus, allLeadStatuses, leadStatusLabels, leadStatusStyles } from '../../types/lead-status'

const COLUMNS = [
  { key: 'type',       label: 'Type' },
  { key: 'name',       label: 'Name/Parent' },
  { key: 'contact',    label: 'Contact' },
  { key: 'child',      label: 'Child Info' },
  { key: 'message',    label: 'Message' },
  { key: 'start_date', label: 'Start Date' },
  { key: 'status',     label: 'Status' },
  { key: 'tags',       label: 'Tags' },
  { key: 'submitted',  label: 'Submitted' },
]

const merriweather = Poppins({
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
  status: LeadStatus
  created_at: string
  notes?: string | null
  preferred_start_date?: string | null
  special_interests?: string | null
  call_notes?: string | null
  tags?: string[]
}

type ContactLead = {
  id: string
  type: 'contact'
  name: string
  email: string
  phone: string
  message: string
  status: LeadStatus
  created_at: string
  call_notes?: string | null
  tags?: string[]
}

type Lead = WaitlistLead | ContactLead

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [tagFilters, setTagFilters] = useState<Set<string>>(new Set())
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set(['start_date']))
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const columnsDropdownRef = useRef<HTMLDivElement>(null)

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
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      // Fetch contact submissions
      const { data: contactData } = await supabase
        .schema('contact')
        .from('submissions')
        .select('*')
        .eq('is_deleted', false)
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnsDropdownRef.current && !columnsDropdownRef.current.contains(e.target as Node)) {
        setColumnsDropdownOpen(false)
      }
    }
    if (columnsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [columnsDropdownOpen])

  const handleLeadUpdate = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    )
  }

  const handleTagsUpdate = (leadId: string, newTags: string[]) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, tags: newTags } : lead
      )
    )
  }

  const handleLeadFieldsUpdate = (updatedLead: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)))
    setSelectedLead(updatedLead)
  }

  const handleLeadDeleted = (leadId: string) => {
    setLeads((prevLeads) => prevLeads.filter((lead) => lead.id !== leadId))
    setSelectedLead(null)
  }

  const handleLeadAdded = (newLead: WaitlistLead) => {
    setLeads((prevLeads) => [newLead, ...prevLeads])
    setIsAddLeadOpen(false)
  }

  const filteredLeads = leads
    .filter((l) => statusFilter === 'all' || l.status === statusFilter)
    .filter((l) => tagFilters.size === 0 || [...tagFilters].every((t) => (l.tags ?? []).includes(t)))
    .filter((l) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const name = l.type === 'waitlist' ? l.parent_name : l.name
      const msg = l.type === 'contact' ? l.message : (l as WaitlistLead).special_interests ?? ''
      const childName = l.type === 'waitlist' ? (l as WaitlistLead).child_name : ''
      return (
        name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        childName?.toLowerCase().includes(q) ||
        msg?.toLowerCase().includes(q)
      )
    })

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1
    return acc
  }, {} as Record<LeadStatus, number>)

  const tagCounts = leads.reduce((acc, lead) => {
    ;(lead.tags ?? []).forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const toggleTag = (tag: string) => {
    setTagFilters((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1
            className={`text-2xl font-bold ${merriweather.className}`}
            style={{ color: colors.mistyForest }}
          >
            Leads
          </h1>
          <p className="mt-2" style={{ color: colors.textSecondary }}>
            {statusFilter === 'all'
              ? `${leads.length} total submissions`
              : `${filteredLeads.length} of ${leads.length} submissions`}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative hidden md:block" ref={columnsDropdownRef}>
            <button
              onClick={() => setColumnsDropdownOpen((o) => !o)}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: colors.warmLinen,
                color: colors.textSecondary,
                borderRadius: radius.md,
                boxShadow: shadows.soft,
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
              }}
            >
              <svg className="-ml-1 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
              Columns
            </button>
            {columnsDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 bg-white py-1"
                style={{
                  borderRadius: radius.md,
                  border: `1px solid ${colors.border}`,
                  boxShadow: shadows.soft,
                  minWidth: '160px',
                }}
              >
                {COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50"
                    style={{ color: colors.textPrimary }}
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.has(col.key)}
                      onChange={() => {
                        setHiddenColumns((prev) => {
                          const next = new Set(prev)
                          if (next.has(col.key)) next.delete(col.key)
                          else next.add(col.key)
                          return next
                        })
                      }}
                      className="rounded"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: colors.mistyForest,
              borderRadius: radius.md,
              boxShadow: shadows.soft,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg
              className="-ml-1 mr-1.5 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Lead
          </button>
          <a
            href="/api/admin/export-leads"
            className="inline-flex items-center justify-center px-2.5 py-2.5 md:px-4 md:py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: colors.mistyForest,
              borderRadius: radius.md,
              boxShadow: shadows.soft,
              border: 'none',
            }}
            title="Export to CSV"
          >
            <svg
              className="h-4 w-4 md:-ml-1 md:mr-1.5"
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
            <span className="hidden md:inline">Export to CSV</span>
          </a>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center gap-1.5 p-1 rounded-xl w-fit mb-3" style={{ backgroundColor: colors.warmLinen, border: `1px solid ${colors.border}` }}>
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
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setStatusFilter('all')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-150 hover:scale-105 active:scale-95"
          style={{
            borderRadius: radius.full,
            backgroundColor: statusFilter === 'all' ? colors.mistyForest : colors.warmLinen,
            color: statusFilter === 'all' ? '#ffffff' : colors.textSecondary,
            border: `1px solid ${statusFilter === 'all' ? colors.mistyForest : colors.border}`,
            cursor: 'pointer',
          }}
        >
          All
          <span
            className="inline-flex items-center justify-center w-4 h-4 text-xs font-semibold rounded-full"
            style={{
              backgroundColor: statusFilter === 'all' ? 'rgba(255,255,255,0.25)' : colors.border,
              color: statusFilter === 'all' ? '#ffffff' : colors.textSecondary,
            }}
          >
            {leads.length}
          </span>
        </button>
        {allLeadStatuses.filter((s) => (statusCounts[s] || 0) > 0).map((status) => {
          const isActive = statusFilter === status
          const style = leadStatusStyles[status]
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(isActive ? 'all' : status)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                borderRadius: radius.full,
                backgroundColor: isActive ? style.bg : colors.warmLinen,
                color: isActive ? style.text : colors.textSecondary,
                border: `1px solid ${isActive ? style.bg : colors.border}`,
                cursor: 'pointer',
              }}
            >
              {leadStatusLabels[status]}
              <span
                className="inline-flex items-center justify-center w-4 h-4 text-xs font-semibold rounded-full"
                style={{
                  backgroundColor: isActive ? 'rgba(0,0,0,0.12)' : colors.border,
                  color: isActive ? style.text : colors.textSecondary,
                }}
              >
                {statusCounts[status]}
              </span>
            </button>
          )
        })}
        </div>
        <div
          className="absolute right-0 top-0 bottom-1 w-8 pointer-events-none"
          style={{ background: `linear-gradient(to right, transparent, ${colors.bg})` }}
        />
      </div>

      {Object.keys(tagCounts).length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
            Filter by tag
          </p>
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Object.keys(tagCounts).map((tag) => {
              const isActive = tagFilters.has(tag)
              const color = getTagColor(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    borderRadius: radius.full,
                    backgroundColor: isActive ? color.bg : colors.warmLinen,
                    color: isActive ? color.text : colors.textSecondary,
                    border: `1px solid ${isActive ? color.border : colors.border}`,
                    cursor: 'pointer',
                  }}
                >
                  {tag}
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 text-xs font-semibold rounded-full"
                    style={{
                      backgroundColor: isActive ? 'rgba(0,0,0,0.08)' : colors.border,
                      color: isActive ? color.text : colors.textSecondary,
                    }}
                  >
                    {tagCounts[tag]}
                  </span>
                </button>
              )
            })}
            </div>
            <div
              className="absolute right-0 top-0 bottom-1 w-8 pointer-events-none"
              style={{ background: `linear-gradient(to right, transparent, ${colors.bg})` }}
            />
          </div>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-500">No submissions yet</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-500">No leads match this filter</p>
        </div>
      ) : (
        <>
          {/* Desktop: inline grid view */}
          <div className="hidden md:block">
            {/* Header row */}
            <div
              className="grid gap-4 px-2 py-2"
              style={{
                gridTemplateColumns: `repeat(${COLUMNS.filter((c) => !hiddenColumns.has(c.key)).length}, minmax(0, 1fr))`,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              {COLUMNS.filter((c) => !hiddenColumns.has(c.key)).map((col) => (
                <span
                  key={col.key}
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: colors.textTertiary }}
                >
                  {col.label}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y" style={{ borderColor: colors.border }}>
              {filteredLeads.map((lead) => {
                const isWaitlist = lead.type === 'waitlist'
                const isContact = lead.type === 'contact'
                const visibleCount = COLUMNS.filter((c) => !hiddenColumns.has(c.key)).length

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="grid gap-4 px-2 py-2.5 cursor-pointer transition-colors duration-100 hover:bg-[var(--admin-elevated)] items-center"
                    style={{
                      gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`,
                      borderColor: colors.border,
                    }}
                  >
                    {!hiddenColumns.has('type') && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border w-fit ${
                          isWaitlist
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isWaitlist ? 'Waitlist' : 'Contact'}
                      </span>
                    )}
                    {!hiddenColumns.has('name') && (
                      <span className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>
                        {isWaitlist ? lead.parent_name : lead.name}
                      </span>
                    )}
                    {!hiddenColumns.has('contact') && (
                      <div className="min-w-0">
                        <div className="text-xs truncate" style={{ color: colors.textSecondary }}>{lead.email}</div>
                        <div className="text-xs truncate" style={{ color: colors.textTertiary }}>{lead.phone}</div>
                      </div>
                    )}
                    {!hiddenColumns.has('child') && (
                      <div className="min-w-0">
                        {isWaitlist ? (
                          <>
                            <div className="text-xs truncate" style={{ color: colors.textSecondary }}>{lead.child_name}</div>
                            <div className="text-xs" style={{ color: colors.textTertiary }}>Age: {lead.child_age || 'N/A'}</div>
                          </>
                        ) : (
                          <span style={{ color: colors.textTertiary }}>—</span>
                        )}
                      </div>
                    )}
                    {!hiddenColumns.has('message') && (
                      <div className="min-w-0">
                        {isContact ? (
                          <span className="text-xs truncate block" style={{ color: colors.textSecondary }} title={lead.message}>
                            {lead.message}
                          </span>
                        ) : isWaitlist && lead.special_interests ? (
                          <span className="text-xs truncate block" style={{ color: colors.textSecondary }} title={lead.special_interests}>
                            {lead.special_interests}
                          </span>
                        ) : (
                          <span style={{ color: colors.textTertiary }}>—</span>
                        )}
                      </div>
                    )}
                    {!hiddenColumns.has('start_date') && (
                      <span className="text-xs" style={{ color: colors.textSecondary }}>
                        {isWaitlist && lead.preferred_start_date ? lead.preferred_start_date : '—'}
                      </span>
                    )}
                    {!hiddenColumns.has('status') && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <InlineStatusEditor
                          status={lead.status}
                          leadId={lead.id}
                          leadType={lead.type}
                          onStatusChange={handleLeadUpdate}
                        />
                      </div>
                    )}
                    {!hiddenColumns.has('tags') && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <TagEditor
                          tags={lead.tags ?? []}
                          leadId={lead.id}
                          leadType={lead.type}
                          onTagsChange={handleTagsUpdate}
                        />
                      </div>
                    )}
                    {!hiddenColumns.has('submitted') && (
                      <span className="text-xs" style={{ color: colors.textSecondary }}>
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile: card list view */}
          <motion.div
            className="block md:hidden space-y-2"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {filteredLeads.map((lead) => {
              const isWaitlist = lead.type === 'waitlist'
              return (
                <motion.button
                  key={lead.id}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
                  }}
                  onClick={() => setSelectedLead(lead)}
                  className="w-full text-left active:scale-[0.99] transition-transform"
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg,
                    boxShadow: shadows.card,
                    padding: '14px 16px',
                    cursor: 'pointer',
                  }}
                >
                  {/* Row 1: Type badge + Status + Date */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${
                          isWaitlist
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isWaitlist ? 'Waitlist' : 'Contact'}
                      </span>
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: leadStatusStyles[lead.status].bg,
                          color: leadStatusStyles[lead.status].text,
                        }}
                      >
                        {leadStatusLabels[lead.status]}
                      </span>
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: colors.textTertiary }}>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Row 2: Name */}
                  <p className="text-sm font-semibold mb-1 truncate" style={{ color: colors.textPrimary }}>
                    {isWaitlist ? lead.parent_name : lead.name}
                  </p>

                  {/* Row 3: Email + phone */}
                  <p className="text-xs truncate mb-0.5" style={{ color: colors.textSecondary }}>{lead.email}</p>
                  {lead.phone && (
                    <p className="text-xs mb-2" style={{ color: colors.textTertiary }}>{lead.phone}</p>
                  )}

                  {/* Row 4: Child info (waitlist) or message snippet (contact) */}
                  {isWaitlist && lead.child_name && (
                    <p className="text-xs mb-1.5" style={{ color: colors.textTertiary }}>
                      Child: {lead.child_name}{lead.child_age ? `, age ${lead.child_age}` : ''}
                    </p>
                  )}
                  {!isWaitlist && (lead as ContactLead).message && (
                    <p className="text-xs mb-1.5 line-clamp-2" style={{ color: colors.textTertiary }}>
                      {(lead as ContactLead).message}
                    </p>
                  )}

                  {/* Row 5: Tags */}
                  {(lead.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(lead.tags ?? []).map((tag) => {
                        const color = getTagColor(tag)
                        return (
                          <span
                            key={tag}
                            className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full border"
                            style={{
                              backgroundColor: color.bg,
                              color: color.text,
                              borderColor: color.border,
                            }}
                          >
                            {tag}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        </>
      )}

      <LeadsDetailSidebar
        key={selectedLead?.id ?? 'none'}
        submission={selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdate={handleLeadUpdate}
        onLeadFieldsUpdate={handleLeadFieldsUpdate}
        onLeadDeleted={handleLeadDeleted}
        onTagsUpdate={handleTagsUpdate}
      />

      <AddLeadSidebar
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onLeadAdded={handleLeadAdded}
      />
    </div>
  )
}
