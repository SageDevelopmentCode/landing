'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Table, TableRow, TableCell } from '../components/Table'
import { InlineStatusEditor } from '../components/InlineStatusEditor'
import { TagEditor } from '../components/TagEditor'
import { LeadsDetailSidebar } from '../components/LeadsDetailSidebar'
import { AddLeadSidebar } from '../components/AddLeadSidebar'
import { colors, radius, shadows } from '../design-system'
import { Merriweather } from 'next/font/google'
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
  status: LeadStatus
  created_at: string
  notes?: string | null
  preferred_start_date?: string | null
  special_interests?: string | null
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
  tags?: string[]
}

type Lead = WaitlistLead | ContactLead

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set(['start_date']))
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false)
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

  const filteredLeads = statusFilter === 'all'
    ? leads
    : leads.filter((l) => l.status === statusFilter)

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1
    return acc
  }, {} as Record<LeadStatus, number>)

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
          <div className="relative" ref={columnsDropdownRef}>
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
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: colors.mistyForest,
              borderRadius: radius.md,
              boxShadow: shadows.soft,
              border: 'none',
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export to CSV
          </a>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
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

      {leads.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-500">No submissions yet</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-500">No leads match this filter</p>
        </div>
      ) : (
        <Table
          headers={COLUMNS.filter((c) => !hiddenColumns.has(c.key)).map((c) => c.label)}
        >
          {filteredLeads.map((lead, index) => {
            const isWaitlist = lead.type === 'waitlist'
            const isContact = lead.type === 'contact'

            return (
              <TableRow
                key={lead.id}
                index={index}
                onClick={() => setSelectedLead(lead)}
              >
                {!hiddenColumns.has('type') && (
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${
                        isWaitlist
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {isWaitlist ? 'Waitlist' : 'Contact'}
                    </span>
                  </TableCell>
                )}
                {!hiddenColumns.has('name') && (
                  <TableCell>
                    <div className="font-medium">
                      {isWaitlist ? lead.parent_name : lead.name}
                    </div>
                  </TableCell>
                )}
                {!hiddenColumns.has('contact') && (
                  <TableCell>
                    <div>{lead.email}</div>
                    <div className="text-xs text-gray-400 font-body">
                      {lead.phone}
                    </div>
                  </TableCell>
                )}
                {!hiddenColumns.has('child') && (
                  <TableCell>
                    {isWaitlist ? (
                      <>
                        <div>{lead.child_name}</div>
                        <div className="text-xs text-gray-400 font-body">
                          Age: {lead.child_age || 'N/A'}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400">—</div>
                    )}
                  </TableCell>
                )}
                {!hiddenColumns.has('message') && (
                  <TableCell>
                    {isContact ? (
                      <div className="max-w-xs truncate" title={lead.message}>
                        {lead.message}
                      </div>
                    ) : isWaitlist && lead.special_interests ? (
                      <div className="max-w-xs truncate" title={lead.special_interests}>
                        {lead.special_interests}
                      </div>
                    ) : (
                      <div className="text-gray-400">—</div>
                    )}
                  </TableCell>
                )}
                {!hiddenColumns.has('start_date') && (
                  <TableCell>
                    <div className="text-gray-600">
                      {isWaitlist && lead.preferred_start_date
                        ? lead.preferred_start_date
                        : '—'}
                    </div>
                  </TableCell>
                )}
                {!hiddenColumns.has('status') && (
                  <TableCell>
                    <InlineStatusEditor
                      status={lead.status}
                      leadId={lead.id}
                      leadType={lead.type}
                      onStatusChange={handleLeadUpdate}
                    />
                  </TableCell>
                )}
                {!hiddenColumns.has('tags') && (
                  <TableCell>
                    <TagEditor
                      tags={lead.tags ?? []}
                      leadId={lead.id}
                      leadType={lead.type}
                      onTagsChange={handleTagsUpdate}
                    />
                  </TableCell>
                )}
                {!hiddenColumns.has('submitted') && (
                  <TableCell>
                    <div className="text-gray-600">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </Table>
      )}

      <LeadsDetailSidebar
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
