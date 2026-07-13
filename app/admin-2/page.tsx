'use client'

import { motion } from 'framer-motion'
import { DollarSign, Users, TrendingUp, ClipboardList, BarChart2, CalendarDays } from 'lucide-react'
import { colors, radius, shadows } from './design-system'
import { StatCard } from './components/StatCard'
import { ActivityFeed } from './components/ActivityFeed'
import { ProgressRing } from './components/ProgressRing'
import { MiniSparkline } from './components/MiniSparkline'
import { MOCK_MONTHLY_REVENUE, MOCK_ACTIVITY, MOCK_EVENTS } from './mock-data'

const revenueData = MOCK_MONTHLY_REVENUE.map(m => m.revenue)
const expenseData = MOCK_MONTHLY_REVENUE.map(m => m.expenses)

const KPIS = [
  { title: 'Revenue YTD',    value: '$47,320',   delta: '18% vs last year',   pos: true,  icon: <DollarSign className="w-4 h-4" /> },
  { title: 'Enrolled',       value: '24',         delta: '+4 this cycle',      pos: true,  icon: <Users className="w-4 h-4" />      },
  { title: 'Active Leads',   value: '37',         delta: '+12 this month',     pos: true,  icon: <TrendingUp className="w-4 h-4" /> },
  { title: 'In Review',      value: '8',          delta: 'Applications',       pos: false, icon: <ClipboardList className="w-4 h-4" /> },
  { title: 'Avg Tuition',    value: '$1,972/mo',  delta: '+$140 vs Q3',        pos: true,  icon: <BarChart2 className="w-4 h-4" />  },
]

const FUNNEL_STAGES = [
  { label: 'Leads',      count: 37, color: colors.accent },
  { label: 'Applied',    count: 22, color: colors.accentBright },
  { label: 'In Review',  count: 8,  color: colors.info },
  { label: 'Enrolling',  count: 5,  color: colors.warning },
  { label: 'Enrolled',   count: 24, color: colors.success },
]

const MONTHS = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']

function RevenueAreaChart() {
  const W = 480
  const H = 160
  const PAD = { top: 12, right: 16, bottom: 28, left: 48 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...revenueData, ...expenseData)
  const xStep = innerW / (MOCK_MONTHLY_REVENUE.length - 1)

  const toY = (v: number) => PAD.top + innerH - (v / maxVal) * innerH
  const toX = (i: number) => PAD.left + i * xStep

  const revPoints = revenueData.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const expPoints = expenseData.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')

  const revPath = revenueData.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ')
  const revArea = `${revPath} L${toX(revenueData.length - 1)},${PAD.top + innerH} L${PAD.left},${PAD.top + innerH} Z`

  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y grid lines */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={toY(tick)} x2={PAD.left + innerW} y2={toY(tick)}
            stroke={colors.border} strokeDasharray="3 3" strokeWidth="1"
          />
          <text
            x={PAD.left - 6} y={toY(tick) + 4}
            textAnchor="end" fontSize="9" fill={colors.textTertiary}
          >
            {tick > 0 ? `$${Math.round(tick / 1000)}k` : ''}
          </text>
        </g>
      ))}

      {/* Revenue area fill */}
      <path d={revArea} fill="url(#revGrad)" />

      {/* Expense line */}
      <polyline
        points={expPoints}
        fill="none"
        stroke={colors.border}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />

      {/* Revenue line */}
      <polyline
        points={revPoints}
        fill="none"
        stroke={colors.accent}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* X labels */}
      {MONTHS.map((m, i) => (
        <text
          key={m}
          x={toX(i)}
          y={H - 6}
          textAnchor="middle"
          fontSize="9"
          fill={colors.textTertiary}
        >
          {m}
        </text>
      ))}
    </svg>
  )
}

function FunnelMini() {
  const max = FUNNEL_STAGES[0].count
  return (
    <div className="space-y-2">
      {FUNNEL_STAGES.map((stage, i) => {
        const pct = Math.round((stage.count / max) * 100)
        return (
          <div key={stage.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: colors.textTertiary }}>{stage.label}</span>
              <span className="text-xs font-bold tabular-nums" style={{ color: colors.textPrimary }}>{stage.count}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                style={{ backgroundColor: stage.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function UpcomingEvents() {
  const TYPE_COLORS: Record<string, string> = {
    event: colors.accent,
    deadline: colors.danger,
    internal: colors.textTertiary,
  }

  return (
    <div className="space-y-3">
      {MOCK_EVENTS.map((ev) => {
        const d = new Date(ev.date)
        const month = d.toLocaleString('default', { month: 'short' }).toUpperCase()
        const day = d.getDate()
        return (
          <div key={ev.id} className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center"
              style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
            >
              <span style={{ fontSize: '8px', color: colors.textTertiary, fontWeight: 700, lineHeight: 1 }}>{month}</span>
              <span style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: 700, lineHeight: 1.2 }}>{day}</span>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium leading-snug truncate" style={{ color: colors.textPrimary }}>
                {ev.title}
              </p>
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: TYPE_COLORS[ev.type] ?? colors.textTertiary }}
              >
                {ev.type}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Admin2Dashboard() {
  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: colors.textPrimary }}>
          Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: colors.textTertiary }}>
          Sage Field School — Spring / Summer 2026
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((kpi, i) => (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            delta={kpi.delta}
            deltaPositive={kpi.pos}
            icon={kpi.icon}
            delay={i * 0.05}
          />
        ))}
      </div>

      {/* Row 2: Revenue chart + Progress rings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: '20px',
            boxShadow: shadows.card,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.textTertiary }}>
              Revenue vs Expenses
            </p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: colors.accent }} />
                <span style={{ color: colors.textTertiary }}>Revenue</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block rounded border-t border-dashed" style={{ borderColor: colors.border }} />
                <span style={{ color: colors.textTertiary }}>Expenses</span>
              </span>
            </div>
          </div>
          <RevenueAreaChart />
        </motion.div>

        {/* Progress rings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: '20px',
            boxShadow: shadows.card,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: colors.textTertiary }}>
            Enrollment Capacity
          </p>
          <div className="space-y-5">
            <ProgressRing
              value={90}
              label="Summer 2026"
              sublabel="18 / 20 enrolled"
              color={colors.accent}
              delay={0.3}
            />
            <ProgressRing
              value={64}
              label="School Year 26–27"
              sublabel="14 / 22 enrolled"
              color={colors.info}
              delay={0.4}
            />
            <div className="flex items-center gap-4 pt-1">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold tabular-nums"
                style={{
                  border: `5px solid ${colors.warning}`,
                  backgroundColor: colors.warningBg,
                  color: colors.warning,
                }}
              >
                31
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>Waitlist</p>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Families waiting</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 3: Activity + Funnel + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ActivityFeed events={MOCK_ACTIVITY} />

        {/* Funnel mini */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: '20px',
            boxShadow: shadows.card,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: colors.textTertiary }}>
            Enrollment Pipeline
          </p>
          <FunnelMini />
        </motion.div>

        {/* Upcoming events */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: '20px',
            boxShadow: shadows.card,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: colors.textTertiary }}>
            Upcoming
          </p>
          <UpcomingEvents />
        </motion.div>
      </div>
    </div>
  )
}
