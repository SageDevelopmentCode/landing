'use client'

import { motion } from 'framer-motion'
import { colors, radius, shadows } from '../design-system'
import { BadgePill } from '../components/BadgePill'
import { PageHeader } from '../components/PageHeader'
import { MOCK_APPLICATIONS } from '../mock-data'
import { ChevronRight } from 'lucide-react'

const COLUMNS = [
  { key: 'in_progress', label: 'In Progress',  color: colors.warning },
  { key: 'in_review',   label: 'In Review',    color: '#8B5CF6'       },
  { key: 'enrolling',   label: 'Enrolling',    color: colors.info     },
  { key: 'enrolled',    label: 'Enrolled',     color: colors.success  },
]

const PROGRAM_LABELS: Record<string, string> = {
  summer_26:          'Summer \'26',
  school_year_26_27:  'School Year',
  both:               'Both',
}

const FUNNEL = [
  { label: 'Leads',     count: 37 },
  { label: 'Applied',   count: 22 },
  { label: 'Enrolling', count: 5  },
  { label: 'Enrolled',  count: 24 },
]

export default function Admin2Applications() {
  return (
    <div className="max-w-screen-xl mx-auto">
      <PageHeader
        title="Applications"
        subtitle="Enrollment pipeline — 2026 programs"
      />

      {/* Pipeline progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-0 mb-6 overflow-hidden rounded-lg"
        style={{ border: `1px solid ${colors.border}` }}
      >
        {FUNNEL.map((stage, i) => (
          <div
            key={stage.label}
            className="flex-1 flex items-center justify-between px-4 py-3"
            style={{
              backgroundColor: colors.surface,
              borderRight: i < FUNNEL.length - 1 ? `1px solid ${colors.border}` : 'none',
            }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: colors.textTertiary }}>
                {stage.label}
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: colors.textPrimary }}>
                {stage.count}
              </p>
            </div>
            {i < FUNNEL.length - 1 && (
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.textTertiary }} />
            )}
          </div>
        ))}
      </motion.div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col, ci) => {
          const cards = MOCK_APPLICATIONS.filter(a => a.status === col.key)
          return (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.07 }}
              className="flex-shrink-0 w-72"
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {col.label}
                  </span>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${col.color}20`,
                    color: col.color,
                    border: `1px solid ${col.color}40`,
                  }}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2.5">
                {cards.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: ci * 0.07 + i * 0.04 }}
                    whileHover={{ y: -1, boxShadow: shadows.elevated }}
                    style={{
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.md,
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      {app.preferredName ? `${app.preferredName} (${app.childName})` : app.childName}
                    </p>
                    <p className="text-xs mt-0.5 mb-3" style={{ color: colors.textTertiary }}>
                      {app.parent1}
                    </p>
                    <div className="flex items-center justify-between">
                      <BadgePill status={app.program} />
                      <span className="text-[10px]" style={{ color: colors.textTertiary }}>
                        {new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {cards.length === 0 && (
                  <div
                    className="py-8 text-center rounded-lg"
                    style={{
                      border: `1px dashed ${colors.border}`,
                      color: colors.textTertiary,
                      fontSize: '12px',
                    }}
                  >
                    No applications
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
