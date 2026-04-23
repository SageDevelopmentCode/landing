'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'
import { Table, TableRow, TableCell } from '../components/Table'
import type { OpenHouseRsvp } from './page'
import { AddRsvpSidebar } from './AddRsvpSidebar'
import { EmailThread } from '../components/EmailThread'
import { sendOpenHouseReminderEmail } from '../../actions/sendOpenHouseReminderEmail'
import { sendInfoSessionInviteEmail } from '../../actions/sendInfoSessionInviteEmail'
import { sendParkingEmail } from '../../actions/sendParkingEmail'
import { sendOpenHouseTwoDayReminderEmail } from '../../actions/sendOpenHouseTwoDayReminderEmail'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function OpenHouseTable({ rsvps, enrolledEmailsArr }: { rsvps: OpenHouseRsvp[], enrolledEmailsArr: { email: string; status: string }[] }) {
  const [localRsvps, setLocalRsvps] = useState(rsvps)
  const [showSubmitted, setShowSubmitted] = useState(false)
  const [selectedRsvp, setSelectedRsvp] = useState<OpenHouseRsvp | null>(null)
  const [showAddSidebar, setShowAddSidebar] = useState(false)
  const [reminderSending, setReminderSending] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const [reminderError, setReminderError] = useState<string | null>(null)
  const [infoEmailSending, setInfoEmailSending] = useState(false)
  const [infoEmailSent, setInfoEmailSent] = useState(false)
  const [infoEmailError, setInfoEmailError] = useState<string | null>(null)
  const [parkingEmailSending, setParkingEmailSending] = useState(false)
  const [parkingEmailSent, setParkingEmailSent] = useState(false)
  const [parkingEmailError, setParkingEmailError] = useState<string | null>(null)
  const [reminder2Sending, setReminder2Sending] = useState(false)
  const [reminder2Sent, setReminder2Sent] = useState(false)
  const [reminder2Error, setReminder2Error] = useState<string | null>(null)
  const enrollmentMap = new Map(enrolledEmailsArr.map(({ email, status }) => [email, status]))
  const getEnrollmentStatus = (email: string) => enrollmentMap.get(email.toLowerCase()) ?? null
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

  const handleSendReminder2 = async (rsvp: OpenHouseRsvp) => {
    if (reminder2Sending || reminder2Sent) return
    setReminder2Sending(true)
    setReminder2Error(null)
    const result = await sendOpenHouseTwoDayReminderEmail({ name: rsvp.name, email: rsvp.email })
    setReminder2Sending(false)
    if (result.success) {
      setReminder2Sent(true)
      setTimeout(() => setReminder2Sent(false), 3000)
    } else {
      setReminder2Error(result.error ?? 'Failed to send email')
    }
  }

  const handleSendInfoSessionEmail = async (rsvp: OpenHouseRsvp) => {
    if (infoEmailSending || infoEmailSent) return
    setInfoEmailSending(true)
    setInfoEmailError(null)
    const result = await sendInfoSessionInviteEmail({ name: rsvp.name, email: rsvp.email })
    setInfoEmailSending(false)
    if (result.success) {
      setInfoEmailSent(true)
      setTimeout(() => setInfoEmailSent(false), 3000)
    } else {
      setInfoEmailError(result.error ?? 'Failed to send email')
    }
  }

  const handleSendParkingEmail = async (rsvp: OpenHouseRsvp) => {
    if (parkingEmailSending || parkingEmailSent) return
    setParkingEmailSending(true)
    setParkingEmailError(null)
    const result = await sendParkingEmail({ name: rsvp.name, email: rsvp.email })
    setParkingEmailSending(false)
    if (result.success) {
      setParkingEmailSent(true)
      setTimeout(() => setParkingEmailSent(false), 3000)
    } else {
      setParkingEmailError(result.error ?? 'Failed to send email')
    }
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
        headers={['Name', 'Status', 'Email', 'Phone', 'Adults', 'Children', 'Notes', ...(showSubmitted ? ['Submitted'] : [])]}
      >
        {localRsvps.map((rsvp, i) => (
          <TableRow key={rsvp.id} index={i} onClick={() => { setSelectedRsvp(rsvp); setReminderSent(false); setReminderError(null); setReminder2Sent(false); setReminder2Error(null); setInfoEmailSent(false); setInfoEmailError(null); setParkingEmailSent(false); setParkingEmailError(null) }} style={{ cursor: 'pointer' }}>
            <TableCell>
              <span style={{ fontWeight: 500, color: colors.textPrimary }}>
                {rsvp.name}
              </span>
            </TableCell>
            <TableCell>
              {(() => {
                const s = getEnrollmentStatus(rsvp.email)
                if (!s) return null
                const isEnrolled = s === 'enrolled'
                return (
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: isEnrolled ? colors.successBg : 'rgba(59, 130, 246, 0.08)',
                    color: isEnrolled ? colors.successText : '#3B82F6',
                    border: `1px solid ${isEnrolled ? colors.successBorder : 'rgba(59, 130, 246, 0.25)'}`,
                    borderRadius: radius.full,
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}>
                    {isEnrolled ? 'Enrolled' : 'Enrolling'}
                  </span>
                )
              })()}
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

              {(() => {
                const s = getEnrollmentStatus(selectedRsvp.email)
                if (!s) return null
                const isEnrolled = s === 'enrolled'
                return (
                  <div style={{ borderBottom: `1px solid ${colors.divider}`, paddingBottom: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      display: 'inline-block',
                      backgroundColor: isEnrolled ? colors.successBg : 'rgba(59, 130, 246, 0.08)',
                      color: isEnrolled ? colors.successText : '#3B82F6',
                      border: `1px solid ${isEnrolled ? colors.successBorder : 'rgba(59, 130, 246, 0.25)'}`,
                      borderRadius: radius.full,
                      padding: '3px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>{isEnrolled ? 'Enrolled' : 'Enrolling'}</span>
                    <span style={{ fontSize: '12px', color: colors.textSecondary }}>Active application found</span>
                  </div>
                )
              })()}

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
                  <button
                    onClick={() => handleSendReminder2(selectedRsvp)}
                    disabled={reminder2Sending || reminder2Sent}
                    style={{
                      backgroundColor: '#2C5F2E',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: reminder2Sending || reminder2Sent ? 'not-allowed' : 'pointer',
                      opacity: reminder2Sending || reminder2Sent ? 0.5 : 1,
                    }}
                  >
                    {reminder2Sending ? 'Sending…' : reminder2Sent ? '✓ Sent!' : 'Send Reminder 2'}
                  </button>
                  {reminder2Error && <span style={{ fontSize: '12px', color: '#DC2626' }}>{reminder2Error}</span>}
                  <button
                    onClick={() => handleSendInfoSessionEmail(selectedRsvp)}
                    disabled={infoEmailSending || infoEmailSent}
                    style={{
                      backgroundColor: '#2C5F2E',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: infoEmailSending || infoEmailSent ? 'not-allowed' : 'pointer',
                      opacity: infoEmailSending || infoEmailSent ? 0.5 : 1,
                    }}
                  >
                    {infoEmailSending ? 'Sending…' : infoEmailSent ? '✓ Sent!' : 'Send Info Session Invite'}
                  </button>
                  {infoEmailError && <span style={{ fontSize: '12px', color: '#DC2626' }}>{infoEmailError}</span>}
                  <button
                    onClick={() => handleSendParkingEmail(selectedRsvp)}
                    disabled={parkingEmailSending || parkingEmailSent}
                    style={{
                      backgroundColor: '#2C5F2E',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: parkingEmailSending || parkingEmailSent ? 'not-allowed' : 'pointer',
                      opacity: parkingEmailSending || parkingEmailSent ? 0.5 : 1,
                    }}
                  >
                    {parkingEmailSending ? 'Sending…' : parkingEmailSent ? '✓ Sent!' : 'Send Parking Email'}
                  </button>
                  {parkingEmailError && <span style={{ fontSize: '12px', color: '#DC2626' }}>{parkingEmailError}</span>}
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
