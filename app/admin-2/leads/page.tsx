'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Download } from 'lucide-react'
import { colors, radius, shadows } from '../design-system'
import { BadgePill } from '../components/BadgePill'
import { PageHeader } from '../components/PageHeader'
import { DataTable, Column } from '../components/DataTable'
import { MOCK_LEADS } from '../mock-data'

type Lead = typeof MOCK_LEADS[number]

const STATUSES = ['all', 'new', 'contacted', 'emailed', 'application_sent', 'enrolled', 'nurture', 'lost']

const COLUMNS: Column<Lead>[] = [
  {
    key: 'type',
    label: 'Source',
    render: (row) => (
      <span
        className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded"
        style={{
          backgroundColor: row.type === 'waitlist' ? colors.accentGlow : colors.warningBg,
          color: row.type === 'waitlist' ? colors.accentBright : colors.warning,
        }}
      >
        {row.type}
      </span>
    ),
  },
  {
    key: 'parentName',
    label: 'Name',
    render: (row) => (
      <span className="font-medium" style={{ color: colors.textPrimary }}>
        {row.parentName}
      </span>
    ),
  },
  { key: 'email', label: 'Email' },
  {
    key: 'childName',
    label: 'Child',
    render: (row) => (
      <span>
        {row.childName
          ? `${row.childName}${row.childAge ? `, age ${row.childAge}` : ''}`
          : <span style={{ color: colors.textTertiary }}>—</span>
        }
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <BadgePill status={row.status} />,
  },
  {
    key: 'tags',
    label: 'Tags',
    render: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.tags?.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: colors.elevated,
              color: colors.textTertiary,
              border: `1px solid ${colors.border}`,
            }}
          >
            {tag}
          </span>
        )) ?? null}
      </div>
    ),
  },
  {
    key: 'createdAt',
    label: 'Date',
    render: (row) => (
      <span style={{ color: colors.textTertiary }}>
        {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
    ),
  },
]

export default function Admin2Leads() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = MOCK_LEADS.filter((lead) => {
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      lead.parentName.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      (lead.childName?.toLowerCase().includes(q) ?? false)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="max-w-screen-xl mx-auto">
      <PageHeader
        title="Leads"
        subtitle={`${MOCK_LEADS.length} total leads`}
        actions={
          <>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: colors.elevated,
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg"
              style={{ backgroundColor: colors.accent, color: '#fff' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Lead
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            minWidth: '220px',
          }}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.textTertiary }} />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm bg-transparent outline-none w-full"
            style={{ color: colors.textPrimary }}
          />
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const active = statusFilter === s
            const count = s === 'all' ? MOCK_LEADS.length : MOCK_LEADS.filter(l => l.status === s).length
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="text-xs px-2.5 py-1 rounded-full transition-all duration-150 font-medium"
                style={{
                  backgroundColor: active ? `${colors.accent}20` : colors.surface,
                  color: active ? colors.accentBright : colors.textTertiary,
                  border: `1px solid ${active ? `${colors.accent}50` : colors.border}`,
                }}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          boxShadow: shadows.card,
          overflow: 'hidden',
        }}
      >
        <DataTable columns={COLUMNS} rows={filtered as unknown as Record<string, unknown>[]} />
      </motion.div>
    </div>
  )
}
