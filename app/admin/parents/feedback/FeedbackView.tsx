'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Poppins } from 'next/font/google'
import { cssColors as colors, radius, cssShadows as shadows } from '../../design-system'
import { Table, TableRow, TableCell } from '../../components/Table'
import type { ParentFeedback } from '../../marketing/page'

const poppins = Poppins({ weight: ['300', '400', '700', '900'], subsets: ['latin'] })

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: '13px', letterSpacing: '1px' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export function FeedbackView({ feedback: initial }: { feedback: ParentFeedback[] }) {
  const [feedback] = useState<ParentFeedback[]>(initial)
  const [selected, setSelected] = useState<ParentFeedback | null>(null)

  const avgRating = feedback.length
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : '—'
  const followUpCount = feedback.filter((f) => f.allow_follow_up).length

  function closePanel() {
    setSelected(null)
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: feedback.length },
          { label: 'Avg Rating', value: avgRating },
          { label: 'Allow Follow-up', value: followUpCount },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: colors.surface,
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
      {feedback.length === 0 && (
        <div
          style={{
            borderRadius: radius.md,
            padding: '40px 20px',
            textAlign: 'center',
            fontSize: '13px',
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            boxShadow: shadows.soft,
          }}
        >
          No feedback submitted yet.
        </div>
      )}

      {/* Table */}
      {feedback.length > 0 && (
        <Table headers={['Parent', 'Email', 'Rating', 'Categories', 'Date']}>
          {feedback.map((f, i) => (
            <TableRow key={f.id} index={i} onClick={() => setSelected(f)} style={{ cursor: 'pointer' }}>
              <TableCell>
                <span style={{ fontWeight: 500, fontSize: '13px', color: colors.textPrimary }}>
                  {f.parent_name ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {f.parent_email ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                <span style={{ color: '#F59E0B' }}>
                  <StarRating rating={f.rating} />
                </span>
              </TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {f.categories.map((cat) => (
                    <span
                      key={cat}
                      style={{
                        backgroundColor: colors.accentLight,
                        color: colors.accent,
                        borderRadius: radius.full,
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                  {f.categories.length === 0 && (
                    <span style={{ color: colors.textTertiary, fontSize: '12px' }}>—</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span style={{ fontSize: '12px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                  {formatDate(f.created_at)}
                </span>
              </TableCell>
            </TableRow>
          ))}
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
                backgroundColor: colors.surface,
                boxShadow: shadows.large,
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
                    Feedback
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary }}>
                    {selected.parent_name ?? 'Unknown'}
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
                    <Row label="Name" value={selected.parent_name ?? '—'} />
                    <Row label="Email" value={selected.parent_email ?? '—'} />
                    <Row label="Submitted" value={formatDate(selected.created_at)} />
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Rating
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '22px', color: '#F59E0B', letterSpacing: '2px' }}>
                      {'★'.repeat(selected.rating)}{'☆'.repeat(5 - selected.rating)}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                      {selected.rating}/5
                    </span>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Categories
                  </p>
                  {selected.categories.length > 0 ? (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {selected.categories.map((cat) => (
                        <span
                          key={cat}
                          style={{
                            backgroundColor: colors.accentLight,
                            color: colors.accent,
                            borderRadius: radius.full,
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '13px', color: colors.textTertiary }}>None selected</span>
                  )}
                </div>

                {/* Message */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Message
                  </p>
                  {selected.message ? (
                    <div
                      style={{
                        backgroundColor: colors.elevated,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.md,
                        padding: '14px 16px',
                        fontSize: '13px',
                        color: colors.textPrimary,
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {selected.message}
                    </div>
                  ) : (
                    <span style={{ fontSize: '13px', color: colors.textTertiary }}>No message provided</span>
                  )}
                </div>

                {/* Follow-up */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Follow-up
                  </p>
                  <span
                    style={{
                      backgroundColor: selected.allow_follow_up ? colors.successBg : colors.elevated,
                      color: selected.allow_follow_up ? colors.success : colors.textSecondary,
                      borderRadius: radius.full,
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: `1px solid ${selected.allow_follow_up ? colors.successBorder : colors.border}`,
                    }}
                  >
                    {selected.allow_follow_up ? '✓ Allows follow-up' : 'No follow-up'}
                  </span>
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
