'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'
import { colors, radius, shadows } from '../design-system'
import { BadgePill } from '../components/BadgePill'
import { PageHeader } from '../components/PageHeader'
import { DataTable, Column } from '../components/DataTable'
import { MOCK_STUDENTS } from '../mock-data'

type Student = typeof MOCK_STUDENTS[number] & Record<string, unknown>

const COLUMNS: Column<Student>[] = [
  {
    key: 'name',
    label: 'Student',
    render: (row) => (
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBright})`,
            color: '#fff',
          }}
        >
          {row.name.charAt(0)}
        </div>
        <span className="font-medium" style={{ color: colors.textPrimary }}>{row.name}</span>
      </div>
    ),
  },
  {
    key: 'age',
    label: 'Age / Grade',
    render: (row) => (
      <span>{row.age} yrs · {row.grade}</span>
    ),
  },
  {
    key: 'program',
    label: 'Program',
    render: (row) => <BadgePill status={row.program} />,
  },
  { key: 'parent', label: 'Guardian' },
  {
    key: 'specialNeeds',
    label: 'Needs',
    render: (row) => row.specialNeeds
      ? <span style={{ color: colors.warning }}><AlertTriangle className="w-3.5 h-3.5 inline" /></span>
      : <span style={{ color: colors.textTertiary }}>—</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <BadgePill status={row.status} />,
  },
]

export default function Admin2Students() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  return (
    <div className="max-w-screen-xl mx-auto">
      <PageHeader
        title="Students"
        subtitle={`${MOCK_STUDENTS.length} enrolled`}
      />

      {/* Inline stats */}
      <div
        className="flex items-stretch mb-5 overflow-hidden rounded-lg"
        style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.surface }}
      >
        {[
          { label: 'Total Students', value: '24' },
          { label: 'Average Age',    value: '7.6 yrs' },
          { label: 'Programs',       value: '3' },
        ].map((stat, i, arr) => (
          <div
            key={stat.label}
            className="flex-1 px-5 py-3"
            style={{ borderRight: i < arr.length - 1 ? `1px solid ${colors.border}` : 'none' }}
          >
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: colors.textTertiary }}>
              {stat.label}
            </p>
            <p className="text-xl font-bold tabular-nums mt-0.5" style={{ color: colors.textPrimary }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          boxShadow: shadows.card,
          overflow: 'hidden',
        }}
      >
        <DataTable
          columns={COLUMNS}
          rows={MOCK_STUDENTS as Student[]}
          onRowClick={(row) => setSelectedStudent(row as unknown as Student)}
        />
      </motion.div>

      {/* Detail panel overlay */}
      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setSelectedStudent(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-96 overflow-y-auto"
              style={{
                backgroundColor: colors.surface,
                borderLeft: `1px solid ${colors.border}`,
                boxShadow: shadows.elevated,
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBright})`,
                        color: '#fff',
                      }}
                    >
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                        {selectedStudent.name}
                      </h2>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                        {selectedStudent.age} yrs · {selectedStudent.grade} grade
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: colors.textTertiary }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-5">
                  {[
                    { label: 'Guardian', value: selectedStudent.parent },
                    { label: 'Program',  value: selectedStudent.program.replace('_', ' ') },
                    { label: 'Status',   value: <BadgePill status={selectedStudent.status} /> },
                    { label: 'Special Needs', value: selectedStudent.specialNeeds ? 'Yes — see notes' : 'None documented' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' }}>
                      <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: colors.textTertiary }}>
                        {label}
                      </p>
                      {typeof value === 'string'
                        ? <p className="text-sm" style={{ color: colors.textPrimary }}>{value}</p>
                        : value
                      }
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
