'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Poppins } from 'next/font/google'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'
import { Table, TableRow, TableCell } from '../components/Table'
import type { ShadowDayBooking } from './page'

const merriweather = Poppins({ weight: ['300', '400', '700', '900'], subsets: ['latin'] })

const PAYMENT_STYLES: Record<ShadowDayBooking['payment_status'], { bg: string; text: string; label: string }> = {
  pending: { bg: colors.warning, text: colors.warningText, label: 'Pending' },
  paid:    { bg: colors.success, text: colors.successText, label: 'Paid' },
}

const REFERRAL_LABELS: Record<string, string> = {
  google: 'Google',
  social_media: 'Social Media',
  friend_family: 'Friend / Family',
  flyer: 'Flyer / Poster',
  other: 'Other',
}

function formatShadowDate(dateStr: string): string {
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

export function ShadowDayBookingsView({ bookings }: { bookings: ShadowDayBooking[] }) {
  const [selected, setSelected] = useState<ShadowDayBooking | null>(null)

  const paidCount = bookings.filter(b => b.payment_status === 'paid').length
  const pendingCount = bookings.filter(b => b.payment_status === 'pending').length

  function closePanel() {
    setSelected(null)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1
          className={merriweather.className}
          style={{ fontSize: '22px', fontWeight: 900, color: colors.textPrimary, marginBottom: '6px' }}
        >
          Shadow Day Bookings
        </h1>
        <p style={{ fontSize: '13px', color: colors.textSecondary }}>
          All shadow day bookings submitted by families, including payment status.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Bookings', value: bookings.length },
          { label: 'Paid', value: paidCount },
          { label: 'Pending Payment', value: pendingCount },
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
          <p style={{ fontSize: '13px', color: colors.textTertiary, fontStyle: 'italic' }}>No shadow day bookings yet.</p>
        </div>
      ) : (
        <Table headers={['Shadow Date', 'Parent', 'Child', 'Grade', 'Payment', 'Referral', 'Booked At']}>
          {bookings.map((b, i) => {
            const p = PAYMENT_STYLES[b.payment_status]
            return (
              <TableRow key={b.id} index={i} onClick={() => setSelected(b)} style={{ cursor: 'pointer' }}>
                <TableCell>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 500, color: colors.textPrimary }}>
                    {formatShadowDate(b.shadow_date)}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ fontWeight: 500, color: colors.textPrimary }}>
                    {b.first_name} {b.last_name}
                  </span>
                </TableCell>
                <TableCell>{b.child_name}</TableCell>
                <TableCell>{b.child_grade ?? '—'}</TableCell>
                <TableCell>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: radius.full,
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: p.bg,
                    color: p.text,
                  }}>
                    {p.label}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ color: colors.textSecondary }}>
                    {b.referral_source ? (REFERRAL_LABELS[b.referral_source] ?? b.referral_source) : '—'}
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
              onClick={closePanel}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)', zIndex: 40 }}
            />
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
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
                    Shadow Day Booking
                  </p>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary }}>
                    {selected.first_name} {selected.last_name}
                  </h2>
                </div>
                <button
                  onClick={closePanel}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textTertiary, fontSize: '20px', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              {/* Payment badge */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: radius.full,
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: PAYMENT_STYLES[selected.payment_status].bg,
                  color: PAYMENT_STYLES[selected.payment_status].text,
                }}>
                  {PAYMENT_STYLES[selected.payment_status].label}
                </span>
              </div>

              {[
                { label: 'Shadow Date', value: formatShadowDate(selected.shadow_date) },
                { label: 'Email', value: selected.email },
                { label: 'Phone', value: selected.phone ?? '—' },
                { label: 'Child Name', value: selected.child_name },
                { label: 'Child Grade', value: selected.child_grade ?? '—' },
                { label: 'Referral Source', value: selected.referral_source ? (REFERRAL_LABELS[selected.referral_source] ?? selected.referral_source) : '—' },
                { label: 'Notes', value: selected.notes ?? '—' },
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
