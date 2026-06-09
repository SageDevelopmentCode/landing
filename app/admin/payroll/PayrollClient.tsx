'use client'

import { useState, useMemo, useTransition } from 'react'
import { Table, TableRow, TableCell } from '../components/Table'
import { DetailSidebar } from '../components/DetailSidebar'
import { cssColors as colors, radius } from '../design-system'
import { Check, DollarSign, Save, Search } from 'lucide-react'
import {
  approvePaystub,
  markPaystubPaid,
  updatePaystubNote,
  setTeacherHourlyRate,
} from '@/app/actions/paystubs'
import type { PaystubWithTeacher } from '@/app/actions/paystubs'
import { TeacherOverviewTab } from './TeacherOverviewTab'
import { PayPeriodHoursTab } from './PayPeriodHoursTab'
import { EmployeeCodesTab } from './EmployeeCodesTab'
import type { TeacherWithCode } from './EmployeeCodesTab'
import { ClockSessionsTab } from './ClockSessionsTab'
import type { ClockSessionWithTeacher } from '@/app/actions/timeclock'

export type TeacherRate = {
  id: string
  full_name: string | null
  email: string
  hourly_rate: number | null
  employee_code?: string | null
}

interface Props {
  paystubs: PaystubWithTeacher[]
  teachers: TeacherRate[]
  clockSessions: ClockSessionWithTeacher[]
  clockSessionsDate: string
}

export const STATUS_CFG = {
  pending:  { label: 'Pending',  color: colors.warning,  bg: colors.warningBg,  border: colors.warningBorder },
  approved: { label: 'Approved', color: colors.info,     bg: colors.infoBg,     border: colors.infoBorder },
  paid:     { label: 'Paid',     color: colors.success,  bg: colors.successBg,  border: colors.successBorder },
} as const

export function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function fmtTs(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatHours(h: number) {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

export function StatusBadge({ status }: { status: 'pending' | 'approved' | 'paid' }) {
  const cfg = STATUS_CFG[status]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Detail Sidebar ───────────────────────────────────────────────────────────

function PaystubDetailSidebar({
  stub,
  onClose,
  onApprove,
  onMarkPaid,
}: {
  stub: PaystubWithTeacher | null
  onClose: () => void
  onApprove: (id: string, note: string) => void
  onMarkPaid: (id: string, note: string) => void
}) {
  const [note, setNote] = useState(stub?.admin_note ?? '')
  const [saving, setSaving] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Reset note when stub changes
  const currentNote = stub?.admin_note ?? ''

  function handleNoteBlur() {
    if (!stub || note === currentNote) return
    setSaving(true)
    startTransition(async () => {
      await updatePaystubNote(stub.id, note)
      setSaving(false)
    })
  }

  if (!stub) return null

  const footer = (
    <div className="flex gap-2">
      {stub.status === 'pending' && (
        <button
          disabled={isPending}
          onClick={() => onApprove(stub.id, note)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          style={{ backgroundColor: colors.infoBg, color: colors.info, border: `1px solid ${colors.infoBorder}` }}
        >
          <Check className="w-3.5 h-3.5" />
          Approve
        </button>
      )}
      {stub.status === 'approved' && (
        <button
          disabled={isPending}
          onClick={() => onMarkPaid(stub.id, note)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          style={{ backgroundColor: colors.successBg, color: colors.success, border: `1px solid ${colors.successBorder}` }}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Mark as Paid
        </button>
      )}
      {stub.status === 'paid' && (
        <div
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: colors.successBg, color: colors.success, border: `1px solid ${colors.successBorder}` }}
        >
          <Check className="w-3.5 h-3.5" />
          Paid
        </div>
      )}
    </div>
  )

  return (
    <DetailSidebar
      isOpen={!!stub}
      onClose={onClose}
      title="Paystub Detail"
      footer={footer}
    >
      <div className="space-y-5">
        {/* Teacher */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.textTertiary }}>Teacher</p>
          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{stub.teacher_name ?? '—'}</p>
          <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{stub.teacher_email ?? '—'}</p>
        </div>

        {/* Period */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.textTertiary }}>Pay Period</p>
          <p className="text-sm" style={{ color: colors.textPrimary }}>{fmtDate(stub.period_start)} – {fmtDate(stub.period_end)}</p>
        </div>

        {/* Status */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.textTertiary }}>Status</p>
          <StatusBadge status={stub.status} />
        </div>

        {/* Financials */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.textTertiary }}>Summary</p>
          <div
            className="rounded-lg divide-y"
            style={{ border: `1px solid ${colors.border}` }}
          >
            {[
              ['Hours Worked', formatHours(stub.total_hours)],
              ['Hourly Rate', `$${stub.hourly_rate_snapshot}/hr`],
              ['Gross Pay', fmtMoney(stub.gross_pay)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center px-3 py-2">
                <span className="text-xs" style={{ color: colors.textSecondary }}>{label}</span>
                <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamps */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.textTertiary }}>Timeline</p>
          <div className="space-y-1 text-xs" style={{ color: colors.textSecondary }}>
            <div className="flex justify-between">
              <span>Submitted</span>
              <span style={{ color: colors.textPrimary }}>{fmtTs(stub.submitted_at)}</span>
            </div>
            {stub.approved_at && (
              <div className="flex justify-between">
                <span>Approved</span>
                <span style={{ color: colors.textPrimary }}>{fmtTs(stub.approved_at)}</span>
              </div>
            )}
            {stub.paid_at && (
              <div className="flex justify-between">
                <span>Paid</span>
                <span style={{ color: colors.textPrimary }}>{fmtTs(stub.paid_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Admin note */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.textTertiary }}>
            Admin Note {saving && <span style={{ color: colors.textTertiary }}>(saving…)</span>}
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            rows={3}
            placeholder="Add a note visible to the teacher…"
            className="w-full rounded-lg text-xs px-3 py-2 resize-none focus:outline-none focus:ring-1"
            style={{
              background: colors.elevated,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
            }}
          />
        </div>
      </div>
    </DetailSidebar>
  )
}

// ─── Teacher Rates Tab ────────────────────────────────────────────────────────

function TeacherRatesTab({ teachers: initial }: { teachers: TeacherRate[] }) {
  const [teachers, setTeachers] = useState(initial)
  const [rates, setRates] = useState<Record<string, string>>(
    Object.fromEntries(initial.map((t) => [t.id, t.hourly_rate != null ? String(t.hourly_rate) : '']))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSave(teacherId: string) {
    const rateStr = rates[teacherId]
    const rate = parseFloat(rateStr)
    if (isNaN(rate) || rate <= 0) {
      setErrors((e) => ({ ...e, [teacherId]: 'Enter a valid rate > 0' }))
      return
    }
    setErrors((e) => ({ ...e, [teacherId]: '' }))
    setSaving((s) => ({ ...s, [teacherId]: true }))
    const result = await setTeacherHourlyRate(teacherId, rate)
    setSaving((s) => ({ ...s, [teacherId]: false }))
    if (result.error) {
      setErrors((e) => ({ ...e, [teacherId]: result.error! }))
    } else {
      setSaved((s) => ({ ...s, [teacherId]: true }))
      setTeachers((prev) => prev.map((t) => t.id === teacherId ? { ...t, hourly_rate: rate } : t))
      setTimeout(() => setSaved((s) => ({ ...s, [teacherId]: false })), 2000)
    }
  }

  return (
    <Table headers={['Teacher', 'Email', 'Hourly Rate', '']}>
      {teachers.map((t, i) => (
        <TableRow key={t.id} index={i}>
          <TableCell>
            <span style={{ color: colors.textPrimary, fontWeight: 500 }}>
              {t.full_name ?? '—'}
            </span>
          </TableCell>
          <TableCell>{t.email}</TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: colors.textTertiary }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rates[t.id] ?? ''}
                  onChange={(e) => setRates((r) => ({ ...r, [t.id]: e.target.value }))}
                  className="pl-5 pr-2 py-1 rounded-md text-xs w-24 focus:outline-none focus:ring-1"
                  style={{
                    background: colors.elevated,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                  }}
                  placeholder="0.00"
                />
              </div>
              {errors[t.id] && (
                <span className="text-[10px]" style={{ color: colors.error }}>{errors[t.id]}</span>
              )}
            </div>
          </TableCell>
          <TableCell>
            <button
              onClick={() => handleSave(t.id)}
              disabled={saving[t.id]}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
              style={{
                background: saved[t.id] ? colors.successBg : colors.accentLight,
                color: saved[t.id] ? colors.success : colors.accent,
                border: `1px solid ${saved[t.id] ? colors.successBorder : 'transparent'}`,
              }}
            >
              {saved[t.id] ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
              {saving[t.id] ? 'Saving…' : saved[t.id] ? 'Saved' : 'Save'}
            </button>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  )
}

// ─── Main PayrollClient ───────────────────────────────────────────────────────

export function PayrollClient({ paystubs: initial, teachers, clockSessions, clockSessionsDate }: Props) {
  const [paystubs, setPaystubs] = useState<PaystubWithTeacher[]>(initial)
  const [tab, setTab] = useState<'paystubs' | 'overview' | 'periods' | 'rates' | 'codes' | 'clock-sessions'>('paystubs')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedStub, setSelectedStub] = useState<PaystubWithTeacher | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    return paystubs.filter((s) => {
      const matchSearch = !search || (s.teacher_name ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || s.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [paystubs, search, filterStatus])

  function handleApprove(id: string, note: string) {
    startTransition(async () => {
      const result = await approvePaystub(id, note || undefined)
      if (!result.error) {
        const now = new Date().toISOString()
        setPaystubs((prev) =>
          prev.map((s) => s.id === id ? { ...s, status: 'approved', approved_at: now, admin_note: note || s.admin_note } : s)
        )
        setSelectedStub((s) => s?.id === id ? { ...s, status: 'approved', approved_at: now, admin_note: note || s.admin_note } : s)
      }
    })
  }

  function handleMarkPaid(id: string, note: string) {
    startTransition(async () => {
      const result = await markPaystubPaid(id, note || undefined)
      if (!result.error) {
        const now = new Date().toISOString()
        setPaystubs((prev) =>
          prev.map((s) => s.id === id ? { ...s, status: 'paid', paid_at: now, admin_note: note || s.admin_note } : s)
        )
        setSelectedStub((s) => s?.id === id ? { ...s, status: 'paid', paid_at: now, admin_note: note || s.admin_note } : s)
      }
    })
  }

  const tabStyle = (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: radius.md,
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: active ? colors.accentLight : 'transparent',
    color: active ? colors.accent : colors.textSecondary,
    transition: 'all 0.15s',
  })

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1">
        <button style={tabStyle(tab === 'paystubs')}  onClick={() => setTab('paystubs')}>Paystubs</button>
        <button style={tabStyle(tab === 'overview')}  onClick={() => setTab('overview')}>Teacher Overview</button>
        <button style={tabStyle(tab === 'periods')}   onClick={() => setTab('periods')}>Pay Period Hours</button>
        <button style={tabStyle(tab === 'rates')}     onClick={() => setTab('rates')}>Teacher Rates</button>
        <button style={tabStyle(tab === 'codes')}          onClick={() => setTab('codes')}>Employee Codes</button>
        <button style={tabStyle(tab === 'clock-sessions')} onClick={() => setTab('clock-sessions')}>Clock Sessions</button>
      </div>

      {tab === 'paystubs' && (
        <>
          {/* Filters */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: colors.textTertiary }} />
              <input
                type="text"
                placeholder="Search teacher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs w-full focus:outline-none focus:ring-1"
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                }}
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'pending', 'approved', 'paid'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                  style={{
                    background: filterStatus === s ? colors.accentLight : colors.elevated,
                    color: filterStatus === s ? colors.accent : colors.textSecondary,
                    border: `1px solid ${filterStatus === s ? 'transparent' : colors.border}`,
                  }}
                >
                  {s === 'all' ? 'All' : STATUS_CFG[s].label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-center py-12" style={{ color: colors.textTertiary }}>
              No paystubs found.
            </p>
          ) : (
            <Table headers={['Teacher', 'Period', 'Hours', 'Rate', 'Gross Pay', 'Status', 'Submitted', 'Actions']}>
              {filtered.map((stub, i) => (
                <TableRow key={stub.id} index={i} onClick={() => setSelectedStub(stub)}>
                  <TableCell style={{ color: colors.textPrimary, fontWeight: 500 }}>
                    {stub.teacher_name ?? '—'}
                  </TableCell>
                  <TableCell>
                    {fmtDate(stub.period_start)} – {fmtDate(stub.period_end)}
                  </TableCell>
                  <TableCell>{formatHours(stub.total_hours)}</TableCell>
                  <TableCell>${stub.hourly_rate_snapshot}/hr</TableCell>
                  <TableCell style={{ color: colors.textPrimary, fontWeight: 500 }}>
                    {fmtMoney(stub.gross_pay)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={stub.status} />
                  </TableCell>
                  <TableCell>{fmtTs(stub.submitted_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {stub.status === 'pending' && (
                        <button
                          disabled={isPending}
                          onClick={() => handleApprove(stub.id, stub.admin_note ?? '')}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold transition-colors disabled:opacity-50"
                          style={{ background: colors.infoBg, color: colors.info, border: `1px solid ${colors.infoBorder}` }}
                        >
                          Approve
                        </button>
                      )}
                      {stub.status === 'approved' && (
                        <button
                          disabled={isPending}
                          onClick={() => handleMarkPaid(stub.id, stub.admin_note ?? '')}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold transition-colors disabled:opacity-50"
                          style={{ background: colors.successBg, color: colors.success, border: `1px solid ${colors.successBorder}` }}
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          )}

          <PaystubDetailSidebar
            stub={selectedStub}
            onClose={() => setSelectedStub(null)}
            onApprove={handleApprove}
            onMarkPaid={handleMarkPaid}
          />
        </>
      )}

      {tab === 'overview' && <TeacherOverviewTab paystubs={paystubs} teachers={teachers} />}
      {tab === 'periods'  && <PayPeriodHoursTab paystubs={paystubs} />}
      {tab === 'rates'    && <TeacherRatesTab teachers={teachers} />}
      {tab === 'codes'          && <EmployeeCodesTab teachers={teachers as TeacherWithCode[]} />}
      {tab === 'clock-sessions' && <ClockSessionsTab initialSessions={clockSessions} initialDate={clockSessionsDate} teachers={teachers} />}
    </div>
  )
}
