'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Poppins } from 'next/font/google'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'
import { DetailSidebar } from '../components/DetailSidebar'
import { Tooltip } from '../components/Tooltip'
import { Table, TableRow, TableCell } from '../components/Table'
import {
  addTourUnavailability,
  deleteTourUnavailability,
  type TourUnavailability,
} from '@/app/actions/tourUnavailability'
import type { TourBooking } from './page'

const merriweather = Poppins({ weight: ['300', '400', '700', '900'], subsets: ['latin'] })

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM',
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const inputStyle = {
  backgroundColor: colors.softCloud,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  color: colors.textPrimary,
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  marginBottom: '6px',
  color: '#6B7280',
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDateKeyDisplay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

const defaultForm = {
  unavailable_date: '',
  unavailable_time: '',
  reason: '',
  is_recurring: false,
}

// ─── AddBlockSidebar ──────────────────────────────────────────────────────────

interface AddBlockSidebarProps {
  isOpen: boolean
  onClose: () => void
  onAdded: (record: TourUnavailability) => void
  prefillDate?: string
  prefillTime?: string
}

function AddBlockSidebar({ isOpen, onClose, onAdded, prefillDate, prefillTime }: AddBlockSidebarProps) {
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isOpen) {
      setForm(defaultForm)
      setErrors({})
      setServerError('')
    } else {
      setForm({
        ...defaultForm,
        unavailable_date: prefillDate ?? '',
        unavailable_time: prefillTime ?? '',
      })
    }
  }, [isOpen, prefillDate, prefillTime])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.unavailable_date) newErrors.unavailable_date = 'Date is required'
    return newErrors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setServerError('')

    startTransition(async () => {
      const result = await addTourUnavailability({
        unavailable_date: form.unavailable_date,
        unavailable_time: form.unavailable_time || null,
        reason: form.reason || null,
        is_recurring: form.is_recurring,
      })

      if (!result.success || !result.record) {
        setServerError(result.message)
        return
      }

      onAdded(result.record)
      onClose()
    })
  }

  return (
    <DetailSidebar isOpen={isOpen} onClose={onClose} title="Block Date / Time">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label style={labelStyle}>Date *</label>
          <input
            type="date"
            value={form.unavailable_date}
            onChange={e => setForm(f => ({ ...f, unavailable_date: e.target.value }))}
            style={inputStyle}
          />
          {errors.unavailable_date && (
            <p style={{ color: colors.errorText, fontSize: '12px', marginTop: '4px' }}>
              {errors.unavailable_date}
            </p>
          )}
        </div>

        <div>
          <label style={labelStyle}>Time Slot (leave blank to block entire day)</label>
          <select
            value={form.unavailable_time}
            onChange={e => setForm(f => ({ ...f, unavailable_time: e.target.value }))}
            style={inputStyle}
          >
            <option value="">— Entire day —</option>
            {TIME_SLOTS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Reason (internal note)</label>
          <input
            type="text"
            value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            style={inputStyle}
            placeholder="e.g. Staff meeting, Holiday..."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            id="is_recurring"
            type="checkbox"
            checked={form.is_recurring}
            onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="is_recurring" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
            Recurring weekly
          </label>
        </div>

        {serverError && (
          <p style={{ color: colors.errorText, fontSize: '13px' }}>{serverError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 text-sm font-medium"
            style={{
              backgroundColor: colors.softCloud,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              color: colors.textSecondary,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-3 text-sm font-medium text-white hover:opacity-90 active:scale-95 transition-all"
            style={{
              backgroundColor: colors.mistyForest,
              borderRadius: radius.md,
              boxShadow: shadows.soft,
              border: 'none',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? 'Saving...' : 'Save Block'}
          </button>
        </div>
      </form>
    </DetailSidebar>
  )
}

// ─── AdminCalendarGrid ────────────────────────────────────────────────────────

interface AdminCalendarGridProps {
  selectedDate: string | null
  onSelectDate: (key: string) => void
  calendarMonth: number
  calendarYear: number
  onPrevMonth: () => void
  onNextMonth: () => void
  blockedDates: Set<string>
  partialDates: Set<string>
}

function AdminCalendarGrid({
  selectedDate,
  onSelectDate,
  calendarMonth,
  calendarYear,
  onPrevMonth,
  onNextMonth,
  blockedDates,
  partialDates,
}: AdminCalendarGridProps) {
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth)
  const startOffset = getFirstDayOfMonth(calendarYear, calendarMonth)
  const totalCells = startOffset + daysInMonth
  const paddedCells = Math.ceil(totalCells / 7) * 7

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: radius.lg,
        boxShadow: shadows.soft,
        border: `1px solid ${colors.border}`,
        padding: '20px',
      }}
    >
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={onPrevMonth}
          style={{
            padding: '6px',
            borderRadius: radius.sm,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.softCloud,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: colors.textSecondary,
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <span
          className={merriweather.className}
          style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary }}
        >
          {MONTHS[calendarMonth]} {calendarYear}
        </span>
        <button
          onClick={onNextMonth}
          style={{
            padding: '6px',
            borderRadius: radius.sm,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.softCloud,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: colors.textSecondary,
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { color: 'white', border: colors.border, label: 'Available' },
          { color: colors.warning, border: colors.warningText, label: 'Partial' },
          { color: colors.error, border: colors.errorText, label: 'Blocked' },
        ].map(({ color, border, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '3px',
              backgroundColor: color, border: `1px solid ${border}`,
            }} />
            <span style={{ fontSize: '11px', color: colors.textTertiary }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
        {DAY_HEADERS.map(d => (
          <div
            key={d}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: colors.textTertiary,
              textAlign: 'center',
              textTransform: 'uppercase',
              padding: '4px 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {Array.from({ length: paddedCells }).map((_, idx) => {
          const dayNum = idx - startOffset + 1
          if (dayNum < 1 || dayNum > daysInMonth) {
            return <div key={idx} />
          }

          const dateKey = formatDateKey(calendarYear, calendarMonth, dayNum)
          const isSelected = selectedDate === dateKey
          const isFullyBlocked = blockedDates.has(dateKey)
          const isPartial = !isFullyBlocked && partialDates.has(dateKey)

          let bg = 'white'
          let textColor: string = colors.textPrimary
          let border = `1px solid ${colors.border}`

          if (isSelected) {
            bg = colors.mistyForest
            textColor = 'white'
            border = `1px solid ${colors.mistyForest}`
          } else if (isFullyBlocked) {
            bg = colors.error
            textColor = colors.errorText
            border = `1px solid ${colors.errorText}30`
          } else if (isPartial) {
            bg = colors.warning
            textColor = colors.warningText
            border = `1px solid ${colors.warningText}30`
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(dateKey)}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.sm,
                fontSize: '13px',
                fontWeight: isSelected ? 700 : 400,
                backgroundColor: bg,
                color: textColor,
                border,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {dayNum}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── BlockDetailSidebar ───────────────────────────────────────────────────────

interface BlockDetailSidebarProps {
  record: TourUnavailability | null
  booking: TourBooking | null
  onClose: () => void
  onDeleted: (id: string) => void
}

function BlockDetailSidebar({ record, booking, onClose, onDeleted }: BlockDetailSidebarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!record) setConfirmOpen(false)
  }, [record])

  const handleDelete = () => {
    if (!record) return
    startTransition(async () => {
      const result = await deleteTourUnavailability(record.id)
      if (result.success) {
        onDeleted(record.id)
        onClose()
      }
    })
  }

  const isBooked = !!record?.booking_id
  const isFullDay = record?.unavailable_time === null

  const footer = confirmOpen ? (
    <div>
      <p style={{ fontSize: '13px', color: colors.textPrimary, marginBottom: '12px', fontWeight: 500 }}>
        Are you sure you want to remove this block? This cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setConfirmOpen(false)}
          disabled={isPending}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.softCloud,
            color: colors.textSecondary,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: radius.md,
            border: 'none',
            backgroundColor: colors.errorText,
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? 'Removing…' : 'Yes, Remove'}
        </button>
      </div>
    </div>
  ) : (
    <button
      onClick={() => setConfirmOpen(true)}
      style={{
        width: '100%',
        padding: '11px',
        borderRadius: radius.md,
        border: `1px solid ${colors.errorText}50`,
        backgroundColor: colors.error,
        color: colors.errorText,
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Remove Block
    </button>
  )

  return (
    <DetailSidebar
      isOpen={!!record}
      onClose={onClose}
      title={isBooked ? 'Booked Slot' : 'Manual Block'}
      footer={footer}
    >
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {/* Type badge */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: radius.full,
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: isBooked ? colors.info : colors.warning,
              color: isBooked ? colors.infoText : colors.warningText,
            }}>
              {isBooked ? 'Booked by a family' : 'Manually blocked'}
            </span>
          </div>

          {/* Block details */}
          {[
            { label: 'Date', value: formatDateKeyDisplay(record.unavailable_date) },
            { label: 'Time', value: isFullDay ? 'Entire day' : record.unavailable_time! },
            ...(record.reason ? [{ label: 'Reason', value: record.reason }] : []),
            { label: 'Recurring Weekly', value: record.is_recurring ? 'Yes' : 'No' },
            { label: 'Created', value: new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) },
          ].map(({ label, value }) => (
            <div key={label} style={{ borderBottom: `1px solid ${colors.divider}`, paddingBottom: '14px', marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</p>
              <p style={{ fontSize: '14px', color: colors.textPrimary }}>{value}</p>
            </div>
          ))}

          {/* Booking details if linked */}
          {isBooked && booking && (
            <>
              <p style={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '14px',
                marginTop: '4px',
              }}>
                Booking Details
              </p>
              {[
                { label: 'Parent Name', value: `${booking.first_name} ${booking.last_name}` },
                { label: 'Email', value: booking.email },
                { label: 'Phone', value: booking.phone ?? '—' },
                { label: 'Child Name', value: booking.child_name },
                { label: 'Child Grade', value: booking.child_grade },
                { label: 'Children Attending', value: String(booking.num_children) },
                { label: 'How They Heard', value: { google: 'Google', social_media: 'Social Media', friend_family: 'Friend / Family', flyer: 'Flyer / Poster', other: 'Other' }[booking.how_did_you_hear] ?? booking.how_did_you_hear },
                ...(booking.accommodations ? [{ label: 'Accommodations', value: booking.accommodations }] : []),
                { label: 'Booking Status', value: booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ') },
              ].map(({ label, value }) => (
                <div key={label} style={{ borderBottom: `1px solid ${colors.divider}`, paddingBottom: '14px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '14px', color: colors.textPrimary }}>{value}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </DetailSidebar>
  )
}

// ─── AdminTimeSlotPanel ───────────────────────────────────────────────────────

type SlotFilter = 'all' | 'available' | 'blocked'

interface AdminTimeSlotPanelProps {
  selectedDate: string | null
  blockedTimesForDate: Set<string>
  blockedRecordsForDate: TourUnavailability[]
  isFullDayBlocked: boolean
  fullDayRecord: TourUnavailability | undefined
  filter: SlotFilter
  onFilterChange: (f: SlotFilter) => void
  onSlotClick: (time: string, isBlocked: boolean) => void
  onViewFullDay: () => void
}

function AdminTimeSlotPanel({
  selectedDate,
  blockedTimesForDate,
  blockedRecordsForDate,
  isFullDayBlocked,
  fullDayRecord,
  filter,
  onFilterChange,
  onSlotClick,
  onViewFullDay,
}: AdminTimeSlotPanelProps) {
  const filters: SlotFilter[] = ['all', 'available', 'blocked']

  const visibleSlots = TIME_SLOTS.filter(slot => {
    const isBlocked = blockedTimesForDate.has(slot)
    if (filter === 'available') return !isBlocked
    if (filter === 'blocked') return isBlocked
    return true
  })

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: radius.lg,
        boxShadow: shadows.soft,
        border: `1px solid ${colors.border}`,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {!selectedDate ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: colors.textTertiary, fontStyle: 'italic' }}>
            Click any day on the calendar<br />to see time slots.
          </p>
        </div>
      ) : (
        <>
          {/* Date header */}
          <div>
            <p style={{ fontSize: '12px', color: colors.textTertiary, marginBottom: '2px' }}>Selected</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
              {formatDateKeyDisplay(selectedDate)}
            </p>
          </div>

          {/* Full-day block button */}
          {isFullDayBlocked ? (
            <button
              onClick={onViewFullDay}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: radius.md,
                border: `1px solid ${colors.errorText}50`,
                backgroundColor: colors.error,
                color: colors.errorText,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 150ms',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Full day blocked</span>
              <span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.7 }}>click to view</span>
            </button>
          ) : (
            <button
              onClick={() => onSlotClick('', false)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: radius.md,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.softCloud,
                color: colors.textSecondary,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 150ms',
              }}
            >
              + Block entire day
            </button>
          )}

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                style={{
                  padding: '4px 12px',
                  borderRadius: radius.full,
                  fontSize: '11px',
                  fontWeight: 600,
                  border: `1px solid ${filter === f ? colors.mistyForest : colors.border}`,
                  backgroundColor: filter === f ? colors.pastelSage : colors.softCloud,
                  color: filter === f ? colors.mistyForest : colors.textTertiary,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 150ms',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Time slots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '400px' }}>
            {visibleSlots.length === 0 ? (
              <p style={{ fontSize: '13px', color: colors.textTertiary, fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                No {filter === 'all' ? '' : filter} slots to show.
              </p>
            ) : (
              visibleSlots.map(slot => {
                const isBlocked = blockedTimesForDate.has(slot)
                const record = isBlocked
                  ? blockedRecordsForDate.find(r => r.unavailable_time === slot)
                  : undefined

                const btn = (
                  <button
                    key={slot}
                    onClick={() => onSlotClick(slot, isBlocked)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: radius.md,
                      border: `1px solid ${isBlocked ? `${colors.errorText}40` : `${colors.successText}40`}`,
                      backgroundColor: isBlocked ? colors.error : colors.success,
                      color: isBlocked ? colors.errorText : colors.successText,
                      fontSize: '13px',
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'opacity 150ms',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{slot}</span>
                    {isBlocked && (
                      <span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.7 }}>
                        click to view
                      </span>
                    )}
                  </button>
                )

                if (isBlocked && record?.reason) {
                  return (
                    <Tooltip key={slot} content={record.reason} side="left">
                      {btn}
                    </Tooltip>
                  )
                }

                return btn
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── TourBookingsTable ────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TourBooking['status'], { bg: string; text: string; label: string }> = {
  pending:   { bg: colors.warning,  text: colors.warningText,  label: 'Pending' },
  confirmed: { bg: colors.success,  text: colors.successText,  label: 'Confirmed' },
  cancelled: { bg: colors.error,    text: colors.errorText,    label: 'Cancelled' },
  completed: { bg: colors.info,     text: colors.infoText,     label: 'Completed' },
  no_show:   { bg: colors.error,    text: colors.errorText,    label: 'No Show' },
}

const HOW_LABELS: Record<string, string> = {
  google: 'Google',
  social_media: 'Social Media',
  friend_family: 'Friend / Family',
  flyer: 'Flyer / Poster',
  other: 'Other',
}

function formatBookingDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function TourBookingsTable({ bookings }: { bookings: TourBooking[] }) {
  const [selected, setSelected] = useState<TourBooking | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const upcoming = bookings.filter(b => b.tour_date >= today && b.status !== 'cancelled')
  const pendingCount = bookings.filter(b => b.status === 'pending').length

  return (
    <div style={{ marginTop: '32px' }}>
      {/* Section header */}
      <div style={{ marginBottom: '16px' }}>
        <h2
          className={merriweather.className}
          style={{ fontSize: '17px', fontWeight: 700, color: colors.textPrimary, marginBottom: '4px' }}
        >
          Scheduled Tours
        </h2>
        <p style={{ fontSize: '13px', color: colors.textSecondary }}>
          All tour bookings submitted by families.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Bookings', value: bookings.length },
          { label: 'Upcoming', value: upcoming.length },
          { label: 'Pending', value: pendingCount },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              backgroundColor: 'white',
              borderRadius: radius.md,
              boxShadow: shadows.soft,
              border: `1px solid ${colors.border}`,
              padding: '12px 20px',
              minWidth: '100px',
            }}
          >
            <p style={{ fontSize: '22px', fontWeight: 700, color: colors.mistyForest, lineHeight: 1, marginBottom: '4px' }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '12px', color: colors.textSecondary }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '160px',
            backgroundColor: 'white',
            borderRadius: radius.lg,
            boxShadow: shadows.soft,
            border: `1px solid ${colors.border}`,
          }}
        >
          <p style={{ fontSize: '13px', color: colors.textTertiary, fontStyle: 'italic' }}>No tour bookings yet.</p>
        </div>
      ) : (
        <Table headers={['Date', 'Time', 'Parent', 'Child', 'Grade', 'Status', 'Booked At']}>
          {bookings.map((b, i) => {
            const s = STATUS_STYLES[b.status]
            return (
              <TableRow key={b.id} index={i} onClick={() => setSelected(b)} style={{ cursor: 'pointer' }}>
                <TableCell>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 500, color: colors.textPrimary }}>
                    {formatBookingDate(b.tour_date)}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ whiteSpace: 'nowrap' }}>{b.tour_time}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontWeight: 500, color: colors.textPrimary }}>
                    {b.first_name} {b.last_name}
                  </span>
                </TableCell>
                <TableCell>{b.child_name}</TableCell>
                <TableCell>{b.child_grade}</TableCell>
                <TableCell>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: radius.full,
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: s.bg,
                    color: s.text,
                  }}>
                    {s.label}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                    {formatCreatedAt(b.created_at)}
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </Table>
      )}

      {/* Detail slide-in */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)', zIndex: 40 }}
            />
            <motion.div
              initial={{ x: 380 }}
              animate={{ x: 0 }}
              exit={{ x: 380 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', top: 0, right: 0,
                width: '380px', height: '100vh',
                backgroundColor: 'white',
                boxShadow: shadows.large,
                zIndex: 50,
                overflowY: 'auto',
                padding: '28px 24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    Tour Booking
                  </p>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary }}>
                    {selected.first_name} {selected.last_name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textTertiary, fontSize: '20px', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              {[
                { label: 'Tour Date', value: formatBookingDate(selected.tour_date) },
                { label: 'Tour Time', value: selected.tour_time },
                { label: 'Status', value: STATUS_STYLES[selected.status].label },
                { label: 'Email', value: selected.email },
                { label: 'Phone', value: selected.phone ?? '—' },
                { label: 'Child Name', value: selected.child_name },
                { label: 'Child Grade', value: selected.child_grade },
                { label: 'Children Attending', value: selected.num_children },
                { label: 'How Did They Hear', value: HOW_LABELS[selected.how_did_you_hear] ?? selected.how_did_you_hear },
                { label: 'Accommodations / Notes', value: selected.accommodations ?? '—' },
                { label: 'Booked At', value: formatCreatedAt(selected.created_at) },
              ].map(({ label, value }) => (
                <div key={label} style={{ borderBottom: `1px solid ${colors.divider}`, paddingBottom: '14px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '14px', color: colors.textPrimary }}>{value}</p>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── TourUnavailabilityView ───────────────────────────────────────────────────

export function TourUnavailabilityView({ initial, tourBookings }: { initial: TourUnavailability[]; tourBookings: TourBooking[] }) {
  const now = new Date()
  const [records, setRecords] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<TourUnavailability | null>(null)

  const [calendarMonth, setCalendarMonth] = useState(now.getMonth())
  const [calendarYear, setCalendarYear] = useState(now.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [prefillDate, setPrefillDate] = useState('')
  const [prefillTime, setPrefillTime] = useState('')
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('all')

  function handlePrevMonth() {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1) }
    else setCalendarMonth(m => m - 1)
  }

  function handleNextMonth() {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1) }
    else setCalendarMonth(m => m + 1)
  }

  function handleSelectDate(key: string) {
    setSelectedDate(key)
    setSlotFilter('all')
  }

  function handleSlotClick(time: string, isBlocked: boolean) {
    if (isBlocked && time !== '') {
      const record = blockedRecordsForDate.find(r => r.unavailable_time === time)
      if (record) setSelectedBlock(record)
    } else {
      setPrefillDate(selectedDate ?? '')
      setPrefillTime(time)
      setShowAdd(true)
    }
  }

  function handleViewFullDay() {
    if (fullDayRecord) setSelectedBlock(fullDayRecord)
  }

  // Fully blocked dates (entire day blocked)
  const blockedDates = new Set<string>(
    records.filter(r => r.unavailable_time === null).map(r => r.unavailable_date)
  )

  // Partially blocked dates (has time blocks but not full-day) — account for recurring
  const partialDates = new Set<string>()
  for (const r of records) {
    if (r.unavailable_time === null) continue
    if (r.is_recurring) {
      const [ry, rm, rd] = r.unavailable_date.split('-').map(Number)
      const recurringDow = new Date(ry, rm - 1, rd).getDay()
      const daysInMonth = getDaysInMonth(calendarYear, calendarMonth)
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(calendarYear, calendarMonth, d).getDay() === recurringDow) {
          const key = formatDateKey(calendarYear, calendarMonth, d)
          if (!blockedDates.has(key)) partialDates.add(key)
        }
      }
    } else {
      if (!blockedDates.has(r.unavailable_date)) partialDates.add(r.unavailable_date)
    }
  }

  // Blocked time records for the selected date (considering recurring)
  const blockedRecordsForDate: TourUnavailability[] = (() => {
    if (!selectedDate) return []
    const [sy, sm, sd] = selectedDate.split('-').map(Number)
    const dayOfWeek = new Date(sy, sm - 1, sd).getDay()
    return records.filter(r => {
      if (r.unavailable_time === null) return false
      if (r.is_recurring) {
        const [ry, rm, rd] = r.unavailable_date.split('-').map(Number)
        return new Date(ry, rm - 1, rd).getDay() === dayOfWeek
      }
      return r.unavailable_date === selectedDate
    })
  })()

  const blockedTimesForDate = new Set<string>(blockedRecordsForDate.map(r => r.unavailable_time as string))

  const isFullDayBlocked = blockedDates.has(selectedDate ?? '')
  const fullDayRecord = records.find(r => r.unavailable_date === selectedDate && r.unavailable_time === null)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1
            className={merriweather.className}
            style={{ fontSize: '22px', fontWeight: 900, color: colors.textPrimary, marginBottom: '6px' }}
          >
            Tour Unavailability
          </h1>
          <p style={{ fontSize: '13px', color: colors.textSecondary }}>
            Click a day to manage time slots. Blocked times are hidden from the /tour calendar.
          </p>
        </div>
        <button
          onClick={() => { setPrefillDate(''); setPrefillTime(''); setShowAdd(true) }}
          style={{
            fontSize: '13px',
            color: 'white',
            backgroundColor: colors.mistyForest,
            border: 'none',
            borderRadius: radius.md,
            padding: '8px 14px',
            cursor: 'pointer',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          + Block Date
        </button>
      </div>

      {/* Two-panel calendar layout */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">
        <AdminCalendarGrid
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          calendarMonth={calendarMonth}
          calendarYear={calendarYear}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          blockedDates={blockedDates}
          partialDates={partialDates}
        />
        <AdminTimeSlotPanel
          selectedDate={selectedDate}
          blockedTimesForDate={blockedTimesForDate}
          blockedRecordsForDate={blockedRecordsForDate}
          isFullDayBlocked={isFullDayBlocked}
          fullDayRecord={fullDayRecord}
          filter={slotFilter}
          onFilterChange={setSlotFilter}
          onSlotClick={handleSlotClick}
          onViewFullDay={handleViewFullDay}
        />
      </div>

      <AddBlockSidebar
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setPrefillDate(''); setPrefillTime('') }}
        onAdded={record => setRecords(prev => [record, ...prev])}
        prefillDate={prefillDate}
        prefillTime={prefillTime}
      />

      <BlockDetailSidebar
        record={selectedBlock}
        booking={selectedBlock?.booking_id
          ? (tourBookings.find(b => b.id === selectedBlock.booking_id) ?? null)
          : null}
        onClose={() => setSelectedBlock(null)}
        onDeleted={id => setRecords(prev => prev.filter(r => r.id !== id))}
      />

      <TourBookingsTable bookings={tourBookings} />
    </div>
  )
}
