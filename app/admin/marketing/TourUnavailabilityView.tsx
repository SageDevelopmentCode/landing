'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Merriweather } from 'next/font/google'
import { colors, radius, shadows } from '../design-system'
import { DetailSidebar } from '../components/DetailSidebar'
import { Table, TableRow, TableCell } from '../components/Table'
import {
  addTourUnavailability,
  deleteTourUnavailability,
  type TourUnavailability,
} from '@/app/actions/tourUnavailability'

const merriweather = Merriweather({ weight: ['300', '400', '700', '900'], subsets: ['latin'] })

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM',
]

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

function formatDate(dateStr: string) {
  // dateStr is YYYY-MM-DD — parse as local date to avoid timezone shift
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const defaultForm = {
  unavailable_date: '',
  unavailable_time: '',
  reason: '',
  is_recurring: false,
}

interface AddBlockSidebarProps {
  isOpen: boolean
  onClose: () => void
  onAdded: (record: TourUnavailability) => void
}

function AddBlockSidebar({ isOpen, onClose, onAdded }: AddBlockSidebarProps) {
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isOpen) {
      setForm(defaultForm)
      setErrors({})
      setServerError('')
    }
  }, [isOpen])

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

export function TourUnavailabilityView({ initial }: { initial: TourUnavailability[] }) {
  const [records, setRecords] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteTourUnavailability(id)
      if (result.success) {
        setRecords(prev => prev.filter(r => r.id !== id))
      }
      setDeletingId(null)
    })
  }

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1
            className={merriweather.className}
            style={{ fontSize: '22px', fontWeight: 900, color: colors.textPrimary, marginBottom: '6px' }}
          >
            Tour Unavailability
          </h1>
          <p style={{ fontSize: '13px', color: colors.textSecondary }}>
            Blocked dates and time slots — these are hidden from the /tour calendar.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
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

      {records.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            backgroundColor: 'white',
            borderRadius: radius.lg,
            boxShadow: shadows.soft,
            border: `1px solid ${colors.border}`,
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            No dates blocked. All available times show on the tour page.
          </p>
        </div>
      ) : (
        <Table headers={['Date', 'Time', 'Reason', 'Recurring', '']}>
          {records.map((r, i) => (
            <TableRow key={r.id} index={i}>
              <TableCell>
                <span style={{ fontWeight: 500, color: colors.textPrimary, whiteSpace: 'nowrap' }}>
                  {formatDate(r.unavailable_date)}
                </span>
              </TableCell>
              <TableCell>
                {r.unavailable_time ?? (
                  <span style={{ color: colors.textTertiary, fontStyle: 'italic' }}>Entire day</span>
                )}
              </TableCell>
              <TableCell>
                {r.reason ?? <span style={{ color: colors.textTertiary }}>—</span>}
              </TableCell>
              <TableCell>
                {r.is_recurring ? (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: colors.pastelSage,
                      color: colors.mistyForest,
                      borderRadius: '99px',
                      padding: '2px 8px',
                    }}
                  >
                    Weekly
                  </span>
                ) : (
                  <span style={{ color: colors.textTertiary }}>—</span>
                )}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={isPending && deletingId === r.id}
                  style={{
                    fontSize: '12px',
                    color: colors.errorText,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    opacity: isPending && deletingId === r.id ? 0.5 : 1,
                  }}
                >
                  Remove
                </button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <AddBlockSidebar
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={(record) => setRecords(prev => [record, ...prev])}
      />
    </div>
  )
}
