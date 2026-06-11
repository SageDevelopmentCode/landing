'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Poppins } from 'next/font/google'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'
import { Table, TableRow, TableCell } from '../components/Table'
import {
  updateTestimonialStatus,
  updateTestimonialGiftCard,
  updateTestimonialNotes,
} from '@/app/actions/updateTestimonial'
import type { Testimonial } from './page'

const poppins = Poppins({ weight: ['300', '400', '700', '900'], subsets: ['latin'] })

const STATUS_STYLES: Record<
  Testimonial['status'],
  { bg: string; text: string; label: string }
> = {
  pending:  { bg: colors.warningBg,  text: colors.warning,     label: 'Pending' },
  approved: { bg: colors.successBg,  text: colors.success,     label: 'Approved' },
  featured: { bg: colors.pastelSage, text: colors.mistyForest,  label: 'Featured' },
  declined: { bg: colors.softCloud,  text: colors.textSecondary, label: 'Declined' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function TestimonialsView({ testimonials: initial }: { testimonials: Testimonial[] }) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initial)
  const [selected, setSelected] = useState<Testimonial | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [giftCardSaving, setGiftCardSaving] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  function openPanel(t: Testimonial) {
    setSelected(t)
    setNotesDraft(t.admin_notes ?? '')
    setNotesSaved(false)
  }

  function closePanel() {
    setSelected(null)
  }

  function patchLocal(id: string, patch: Partial<Testimonial>) {
    setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev))
  }

  async function handleStatusChange(id: string, status: string) {
    setStatusSaving(true)
    patchLocal(id, { status: status as Testimonial['status'] })
    await updateTestimonialStatus(id, status)
    setStatusSaving(false)
  }

  async function handleGiftCardToggle(id: string, current: boolean) {
    setGiftCardSaving(true)
    patchLocal(id, { gift_card_sent: !current })
    await updateTestimonialGiftCard(id, !current)
    setGiftCardSaving(false)
  }

  async function handleSaveNotes(id: string) {
    setNotesSaving(true)
    patchLocal(id, { admin_notes: notesDraft })
    await updateTestimonialNotes(id, notesDraft)
    setNotesSaving(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2500)
  }

  const pendingCount = testimonials.filter((t) => t.status === 'pending').length
  const giftCardSentCount = testimonials.filter((t) => t.gift_card_sent).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1
          className={poppins.className}
          style={{ fontSize: '22px', fontWeight: 900, color: colors.textPrimary, marginBottom: '6px' }}
        >
          Testimonials
        </h1>
        <p style={{ fontSize: '13px', color: colors.textSecondary }}>
          Parent experience submissions — review, approve, and send gift cards
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: testimonials.length },
          { label: 'Pending Review', value: pendingCount },
          { label: 'Gift Cards Sent', value: giftCardSentCount },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: 'white',
              borderRadius: radius.md,
              boxShadow: shadows.soft,
              border: `1px solid ${colors.border}`,
              padding: '14px 20px',
              minWidth: '110px',
            }}
          >
            <p style={{ fontSize: '22px', fontWeight: 700, color: colors.mistyForest, lineHeight: 1 }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {testimonials.length === 0 && (
        <div
          style={{
            borderRadius: radius.md,
            padding: '40px 20px',
            textAlign: 'center',
            fontSize: '13px',
            backgroundColor: 'white',
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            boxShadow: shadows.soft,
          }}
        >
          No testimonials submitted yet.
        </div>
      )}

      {/* Table */}
      {testimonials.length > 0 && (
        <Table headers={['Parent', 'Child', 'Testimonial', 'Status', 'Gift Card', 'Submitted']}>
          {testimonials.map((t, i) => {
            const style = STATUS_STYLES[t.status]
            return (
              <TableRow key={t.id} index={i} onClick={() => openPanel(t)} style={{ cursor: 'pointer' }}>
                <TableCell>
                  <p style={{ fontWeight: 500, fontSize: '13px', color: colors.textPrimary }}>
                    {t.parent_name}
                  </p>
                  <p style={{ fontSize: '12px', color: colors.textSecondary }}>{t.parent_email}</p>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: '13px', color: colors.textPrimary }}>{t.child_name}</span>
                </TableCell>
                <TableCell>
                  <span
                    style={{
                      display: 'block',
                      maxWidth: '260px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '13px',
                      color: colors.textSecondary,
                    }}
                  >
                    {t.testimonial}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    style={{
                      backgroundColor: style.bg,
                      color: style.text,
                      borderRadius: radius.full,
                      padding: '3px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {style.label}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    style={{
                      backgroundColor: t.gift_card_sent ? colors.successBg : colors.warningBg,
                      color: t.gift_card_sent ? colors.success : colors.warning,
                      borderRadius: radius.full,
                      padding: '3px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.gift_card_sent ? 'Sent' : 'Pending'}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: '12px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                    {formatDate(t.created_at)}
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </Table>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={closePanel}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.25)',
                zIndex: 40,
              }}
            />
            <motion.div
              key="panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '420px',
                height: '100vh',
                backgroundColor: 'white',
                boxShadow: shadows.strong,
                zIndex: 50,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: `1px solid ${colors.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                    Testimonial
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary }}>
                    {selected.parent_name}
                  </p>
                </div>
                <button
                  onClick={closePanel}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: colors.textSecondary,
                    padding: '4px 8px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>

                {/* Parent info */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Parent
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Row label="Name" value={selected.parent_name} />
                    <Row label="Email" value={selected.parent_email} />
                    <Row label="Child" value={selected.child_name} />
                    <Row label="Submitted" value={formatDate(selected.created_at)} />
                  </div>
                </div>

                {/* Testimonial text */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Testimonial
                  </p>
                  <div
                    style={{
                      backgroundColor: colors.softCloud,
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.md,
                      padding: '14px 16px',
                      fontSize: '13px',
                      color: colors.textPrimary,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selected.testimonial}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Status
                  </p>
                  <select
                    value={selected.status}
                    disabled={statusSaving}
                    onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: radius.md,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: 'white',
                      fontSize: '13px',
                      color: colors.textPrimary,
                      cursor: statusSaving ? 'not-allowed' : 'pointer',
                      opacity: statusSaving ? 0.6 : 1,
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="featured">Featured</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                {/* Gift card */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Gift Card
                  </p>
                  <button
                    onClick={() => handleGiftCardToggle(selected.id, selected.gift_card_sent)}
                    disabled={giftCardSaving}
                    style={{
                      padding: '9px 18px',
                      borderRadius: radius.md,
                      border: `1px solid ${selected.gift_card_sent ? colors.successBorder : colors.border}`,
                      backgroundColor: selected.gift_card_sent ? colors.successBg : 'white',
                      color: selected.gift_card_sent ? colors.success : colors.textSecondary,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: giftCardSaving ? 'not-allowed' : 'pointer',
                      opacity: giftCardSaving ? 0.6 : 1,
                      transition: 'all 150ms ease-out',
                    }}
                  >
                    {selected.gift_card_sent ? '✓ Gift card sent' : 'Mark gift card sent'}
                  </button>
                </div>

                {/* Admin notes */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Admin Notes
                  </p>
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={3}
                    placeholder="Internal notes…"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: radius.md,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: 'white',
                      fontSize: '13px',
                      color: colors.textPrimary,
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => handleSaveNotes(selected.id)}
                    disabled={notesSaving}
                    style={{
                      marginTop: '8px',
                      padding: '8px 16px',
                      borderRadius: radius.md,
                      border: 'none',
                      backgroundColor: notesSaved ? colors.successBg : colors.mistyForest,
                      color: notesSaved ? colors.success : 'white',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: notesSaving ? 'not-allowed' : 'pointer',
                      opacity: notesSaving ? 0.6 : 1,
                      transition: 'all 150ms ease-out',
                    }}
                  >
                    {notesSaving ? 'Saving…' : notesSaved ? '✓ Saved' : 'Save notes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
      <span style={{ color: colors.textTertiary, minWidth: '72px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: colors.textPrimary }}>{value}</span>
    </div>
  )
}
