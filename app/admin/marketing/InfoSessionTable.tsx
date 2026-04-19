'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendInfoSessionReminderEmail } from '../../actions/sendInfoSessionReminderEmail'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'
import { Table, TableRow, TableCell } from '../components/Table'
import type { InfoSessionRsvp } from './page'

const PROGRAM_LABELS: Record<string, string> = {
  'summer-2026': 'Summer 2026',
  'school-year': 'School Year 2026–2027',
  'homeschool': 'Homeschool Drop-In',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatPrograms(programs: string[] | null) {
  if (!programs || programs.length === 0) return '—'
  return programs.map((p) => PROGRAM_LABELS[p] ?? p).join(' · ')
}

export function InfoSessionTable({ rsvps }: { rsvps: InfoSessionRsvp[] }) {
  const [showSubmitted, setShowSubmitted] = useState(false)
  const [selectedRsvp, setSelectedRsvp] = useState<InfoSessionRsvp | null>(null)
  const [reminderSending, setReminderSending] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const [reminderError, setReminderError] = useState<string | null>(null)

  useEffect(() => {
    setReminderSending(false)
    setReminderSent(false)
    setReminderError(null)
  }, [selectedRsvp?.id])

  const handleSendReminder = async () => {
    if (!selectedRsvp || reminderSending || reminderSent) return
    setReminderSending(true)
    setReminderError(null)
    const result = await sendInfoSessionReminderEmail({ firstName: selectedRsvp.first_name, email: selectedRsvp.email })
    setReminderSending(false)
    if (result.success) {
      setReminderSent(true)
      setTimeout(() => setReminderSent(false), 3000)
    } else {
      setReminderError(result.error ?? 'Failed to send email')
    }
  }

  const totalChildren = rsvps.reduce((sum, r) => sum + (r.children?.length ?? 0), 0)

  if (rsvps.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '240px',
          backgroundColor: 'white',
          borderRadius: radius.lg,
          boxShadow: shadows.soft,
          border: `1px solid ${colors.border}`,
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '14px', color: colors.textSecondary }}>
          No RSVPs yet.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'RSVPs', value: rsvps.length },
          { label: 'Children', value: totalChildren },
        ].map((stat) => (
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

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px' }}>
        <button
          onClick={() => setShowSubmitted((v) => !v)}
          style={{
            fontSize: '12px',
            color: colors.textSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.sm,
            padding: '4px 10px',
            cursor: 'pointer',
            background: 'transparent',
          }}
        >
          {showSubmitted ? 'Hide submitted' : 'Show submitted'}
        </button>
      </div>

      <Table
        headers={[
          'Name',
          'Email',
          'Phone',
          'Programs',
          'Children',
          'Hear About Us',
          ...(showSubmitted ? ['Submitted'] : []),
        ]}
      >
        {rsvps.map((rsvp, i) => (
          <TableRow
            key={rsvp.id}
            index={i}
            onClick={() => setSelectedRsvp(rsvp)}
            style={{ cursor: 'pointer' }}
          >
            <TableCell>
              <span style={{ fontWeight: 500, color: colors.textPrimary }}>
                {rsvp.first_name} {rsvp.last_name}
              </span>
            </TableCell>
            <TableCell>
              <span style={{ display: 'block', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {rsvp.email}
              </span>
            </TableCell>
            <TableCell>{rsvp.phone ?? '—'}</TableCell>
            <TableCell>
              <span style={{ display: 'block', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.textSecondary }}>
                {formatPrograms(rsvp.programs)}
              </span>
            </TableCell>
            <TableCell>{rsvp.children?.length ?? 0}</TableCell>
            <TableCell>
              {rsvp.hear_about_us ? (
                <span style={{ display: 'block', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.textSecondary }}>
                  {rsvp.hear_about_us}
                </span>
              ) : (
                <span style={{ color: colors.textTertiary }}>—</span>
              )}
            </TableCell>
            {showSubmitted && (
              <TableCell>
                <span style={{ color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                  {formatDate(rsvp.created_at)}
                </span>
              </TableCell>
            )}
          </TableRow>
        ))}
      </Table>

      <AnimatePresence>
        {selectedRsvp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRsvp(null)}
              style={{
                position: 'fixed', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.15)',
                zIndex: 40,
              }}
            />

            <motion.div
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', top: 0, right: 0,
                width: '360px', height: '100vh',
                backgroundColor: 'white',
                boxShadow: shadows.large,
                zIndex: 50,
                overflowY: 'auto',
                padding: '28px 24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>RSVP Details</p>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary }}>
                    {selectedRsvp.first_name} {selectedRsvp.last_name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRsvp(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textTertiary, fontSize: '20px', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              {/* Contact info */}
              {[
                { label: 'Email', value: selectedRsvp.email },
                { label: 'Phone', value: selectedRsvp.phone ?? '—' },
                { label: 'How They Heard', value: selectedRsvp.hear_about_us ?? '—' },
                { label: 'Submitted', value: formatDate(selectedRsvp.created_at) },
              ].map(({ label, value }) => (
                <div key={label} style={{ borderBottom: `1px solid ${colors.divider}`, paddingBottom: '14px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '14px', color: colors.textPrimary }}>{value}</p>
                </div>
              ))}

              {/* Programs */}
              <div style={{ borderBottom: `1px solid ${colors.divider}`, paddingBottom: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Programs</p>
                {selectedRsvp.programs && selectedRsvp.programs.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedRsvp.programs.map((p) => (
                      <span
                        key={p}
                        style={{
                          backgroundColor: colors.pastelSage,
                          color: colors.mistyForest,
                          borderRadius: radius.full,
                          padding: '3px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {PROGRAM_LABELS[p] ?? p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: colors.textTertiary }}>—</p>
                )}
              </div>

              {/* Children */}
              <div style={{ borderBottom: `1px solid ${colors.divider}`, paddingBottom: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Children ({selectedRsvp.children?.length ?? 0})
                </p>
                {selectedRsvp.children && selectedRsvp.children.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedRsvp.children.map((child, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          backgroundColor: '#F9FAFB',
                          borderRadius: radius.sm,
                          padding: '6px 10px',
                          fontSize: '13px',
                          color: colors.textPrimary,
                        }}
                      >
                        <span>{child.name}</span>
                        <span style={{ color: colors.textSecondary }}>Age {child.age}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: colors.textTertiary }}>—</p>
                )}
              </div>

              {/* Outreach */}
              <div style={{ borderBottom: `1px solid ${colors.divider}`, paddingBottom: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Outreach</p>
                <button
                  onClick={handleSendReminder}
                  disabled={reminderSending || reminderSent}
                  style={{
                    backgroundColor: reminderSent ? '#2C5F2E' : '#2C5F2E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: reminderSending || reminderSent ? 'not-allowed' : 'pointer',
                    opacity: reminderSending || reminderSent ? 0.6 : 1,
                  }}
                >
                  {reminderSending ? 'Sending…' : reminderSent ? '✓ Sent!' : 'Send Reminder Email'}
                </button>
                {reminderError && (
                  <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '6px' }}>{reminderError}</p>
                )}
              </div>

              {/* Questions */}
              <div style={{ borderBottom: `1px solid ${colors.divider}`, paddingBottom: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Questions</p>
                <p style={{ fontSize: '14px', color: selectedRsvp.questions ? colors.textPrimary : colors.textTertiary, lineHeight: 1.5 }}>
                  {selectedRsvp.questions ?? '—'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
