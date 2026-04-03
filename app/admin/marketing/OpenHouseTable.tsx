'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colors, radius, shadows } from '../design-system'
import { Table, TableRow, TableCell } from '../components/Table'
import type { OpenHouseRsvp } from './page'
import { AddRsvpSidebar } from './AddRsvpSidebar'
import { EmailThread } from '../components/EmailThread'
import { sendOpenHouseReminderEmail } from '../../actions/sendOpenHouseReminderEmail'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function OpenHouseTable({ rsvps }: { rsvps: OpenHouseRsvp[] }) {
  const [localRsvps, setLocalRsvps] = useState(rsvps)
  const [showSubmitted, setShowSubmitted] = useState(false)
  const [selectedRsvp, setSelectedRsvp] = useState<OpenHouseRsvp | null>(null)
  const [showAddSidebar, setShowAddSidebar] = useState(false)
  const [reminderSending, setReminderSending] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const [reminderError, setReminderError] = useState<string | null>(null)
  const totalAdults = localRsvps.reduce((sum, r) => sum + (r.adults_attending ?? 0), 0)
  const totalChildren = localRsvps.reduce((sum, r) => sum + (r.children_attending ?? 0), 0)
  const totalAttendees = totalAdults + totalChildren

  if (localRsvps.length === 0) {
    return (
      <>
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
          <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
            No RSVPs yet.
          </p>
          <button
            onClick={() => setShowAddSidebar(true)}
            style={{
              backgroundColor: colors.mistyForest,
              color: 'white',
              border: 'none',
              borderRadius: radius.md,
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Add RSVP
          </button>
        </div>
        <AddRsvpSidebar
          isOpen={showAddSidebar}
          onClose={() => setShowAddSidebar(false)}
          onRsvpAdded={(rsvp) => setLocalRsvps(prev => [rsvp, ...prev])}
        />
      </>
    )
  }

  const handleSendReminder = async (rsvp: OpenHouseRsvp) => {
    if (reminderSending || reminderSent) return
    setReminderSending(true)
    setReminderError(null)
    const result = await sendOpenHouseReminderEmail({ name: rsvp.name, email: rsvp.email })
    setReminderSending(false)
    if (result.success) {
      setReminderSent(true)
      setTimeout(() => setReminderSent(false), 3000)
    } else {
      setReminderError(result.error ?? 'Failed to send email')
    }
  }

  return (
    <div>
      {/* Summary bar */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'RSVPs', value: localRsvps.length },
          { label: 'Adults', value: totalAdults },
          { label: 'Children', value: totalChildren },
          { label: 'Total Attendees', value: totalAttendees },
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
            <p
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: colors.mistyForest,
                lineHeight: 1,
                marginBottom: '4px',
              }}
            >
              {stat.value}
            </p>
            <p style={{ fontSize: '12px', color: colors.textSecondary }}>
              {stat.label}
            </p>
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
        <button
          onClick={() => setShowAddSidebar(true)}
          style={{
            fontSize: '12px',
            color: 'white',
            backgroundColor: colors.mistyForest,
            border: 'none',
            borderRadius: radius.sm,
            padding: '4px 10px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Add RSVP
        </button>
      </div>

      <Table
        headers={['Name', 'Email', 'Phone', 'Adults', 'Children', 'Notes', ...(showSubmitted ? ['Submitted'] : [])]}
      >
        {localRsvps.map((rsvp, i) => (
          <TableRow key={rsvp.id} index={i} onClick={() => { setSelectedRsvp(rsvp); setReminderSent(false); setReminderError(null) }} style={{ cursor: 'pointer' }}>
            <TableCell>
              <span style={{ fontWeight: 500, color: colors.textPrimary }}>
                {rsvp.name}
              </span>
            </TableCell>
            <TableCell>
              <span style={{
                display: 'block',
                maxWidth: '160px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {rsvp.email}
              </span>
            </TableCell>
            <TableCell>{rsvp.phone ?? '—'}</TableCell>
            <TableCell>{rsvp.adults_attending}</TableCell>
            <TableCell>{rsvp.children_attending}</TableCell>
            <TableCell>
              {rsvp.notes ? (
                <span style={{
                  display: 'block',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: colors.textSecondary,
                }}>{rsvp.notes}</span>
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

      <AddRsvpSidebar
        isOpen={showAddSidebar}
        onClose={() => setShowAddSidebar(false)}
        onRsvpAdded={(rsvp) => setLocalRsvps(prev => [rsvp, ...prev])}
      />

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
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary }}>{selectedRsvp.name}</h2>
                </div>
                <button onClick={() => setSelectedRsvp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textTertiary, fontSize: '20px', lineHeight: 1 }}>×</button>
              </div>

              {[
                { label: 'Email', value: selectedRsvp.email },
                { label: 'Phone', value: selectedRsvp.phone ?? '—' },
                { label: 'Adults', value: selectedRsvp.adults_attending },
                { label: 'Children', value: selectedRsvp.children_attending },
                { label: 'Notes', value: selectedRsvp.notes ?? '—' },
                { label: 'Submitted', value: formatDate(selectedRsvp.created_at) },
              ].map(({ label, value }) => (
                <div key={label} style={{ borderBottom: `1px solid ${colors.divider}`, paddingBottom: '14px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '14px', color: colors.textPrimary }}>{value}</p>
                </div>
              ))}

              {/* Outreach */}
              <div style={{ borderTop: `1px solid ${colors.divider}`, paddingTop: '14px', marginTop: '4px' }}>
                <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Outreach</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleSendReminder(selectedRsvp)}
                    disabled={reminderSending || reminderSent}
                    style={{
                      backgroundColor: '#2C5F2E',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: reminderSending || reminderSent ? 'not-allowed' : 'pointer',
                      opacity: reminderSending || reminderSent ? 0.5 : 1,
                    }}
                  >
                    {reminderSending ? 'Sending…' : reminderSent ? '✓ Sent!' : 'Send Reminder 1'}
                  </button>
                  {reminderError && <span style={{ fontSize: '12px', color: '#DC2626' }}>{reminderError}</span>}
                </div>
              </div>

              {/* Email History */}
              <div style={{ borderTop: `1px solid ${colors.divider}`, paddingTop: '14px', marginTop: '4px' }}>
                <p style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Email History</p>
                <EmailThread emailAddress={selectedRsvp.email} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
