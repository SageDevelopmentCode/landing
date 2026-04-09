'use client'

import { motion } from 'framer-motion'
import { colors, radius, shadows } from '../design-system'
import { BadgePill } from '../components/BadgePill'
import { PageHeader } from '../components/PageHeader'
import { ProgressRing } from '../components/ProgressRing'
import { MOCK_PROGRAMS, MOCK_STUDENTS } from '../mock-data'

export default function Admin2Programs() {
  return (
    <div className="max-w-screen-xl mx-auto">
      <PageHeader title="Programs" subtitle="Current enrollment overview" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {MOCK_PROGRAMS.map((prog, i) => {
          const capacity = Math.round((prog.enrolled / prog.capacity) * 100)
          const students = MOCK_STUDENTS.filter(s =>
            s.program === 'both' ||
            (prog.id === 'summer_26' && s.program === 'summer') ||
            (prog.id === 'school_year_26_27' && s.program === 'school_year')
          ).slice(0, 5)

          return (
            <motion.div
              key={prog.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.xl,
                padding: '24px',
                boxShadow: shadows.card,
                minHeight: '320px',
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                    {prog.name}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                    {prog.startDate} → {prog.endDate}
                  </p>
                </div>
                <BadgePill status={prog.status} />
              </div>

              {/* Progress ring + stats */}
              <div className="flex items-center gap-6 mb-6">
                <ProgressRing
                  value={capacity}
                  label={`${prog.enrolled} / ${prog.capacity} enrolled`}
                  sublabel={`${prog.waitlist} on waitlist`}
                  color={capacity >= 90 ? colors.success : colors.accent}
                  delay={0.2 + i * 0.1}
                />
              </div>

              {/* Mini KPIs */}
              <div
                className="grid grid-cols-2 gap-0 mb-5 overflow-hidden rounded-lg"
                style={{ border: `1px solid ${colors.border}` }}
              >
                {[
                  { label: 'Revenue',     value: `$${prog.revenue.toLocaleString()}` },
                  { label: 'Avg Tuition', value: `$${prog.tuitionMonthly}/mo`        },
                ].map((kpi, idx, arr) => (
                  <div
                    key={kpi.label}
                    className="px-4 py-3"
                    style={{ borderRight: idx < arr.length - 1 ? `1px solid ${colors.border}` : 'none' }}
                  >
                    <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: colors.textTertiary }}>
                      {kpi.label}
                    </p>
                    <p className="text-lg font-bold tabular-nums mt-0.5" style={{ color: colors.textPrimary }}>
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Student roster preview */}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: colors.textTertiary }}>
                  Enrolled Students (preview)
                </p>
                <div className="space-y-2">
                  {students.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBright})`,
                          color: '#fff',
                        }}
                      >
                        {s.name.charAt(0)}
                      </div>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>
                        {s.name}
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: colors.textTertiary }}>
                        {s.grade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
