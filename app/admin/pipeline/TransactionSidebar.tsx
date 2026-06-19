'use client'

import { useState } from 'react'
import { DetailSidebar } from '../components/DetailSidebar'
import { EmailThread } from '../components/EmailThread'
import { cssColors as colors, radius } from '../design-system'

type Transaction = {
  id: string
  stripe_session_id: string
  payment_type: string
  status: string
  amount_cents: number
  payer_email: string | null
  payer_name: string | null
  application_id: string | null
  parent_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

type EmailLog = {
  id: string
  application_id: string | null
  to_address: string
  subject: string
  status: 'success' | 'error'
  error_message: string | null
  sent_at: string
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  registration_fee: 'Registration Fee',
  summer_tuition: 'Summer Tuition',
  aftercare_tuition: 'Aftercare',
  fun_friday_tuition: 'Fun Friday',
  homeschool_dropin: 'Homeschool Drop-In',
  shadow_day_fee: 'Shadow Day',
  beach_bash_fee: 'Beach Bash',
  custom_tuition: 'Custom Tuition',
  one_time_payment: 'One-Time Payment',
  donation: 'Donation',
}

function formatUSD(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10,
      fontWeight: 600,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      marginBottom: 4,
      marginTop: 0,
    }}>
      {children}
    </p>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {children}
    </div>
  )
}

interface TransactionSidebarProps {
  row: { tx: Transaction; email: EmailLog | null; emailStatus: 'sent' | 'error' | 'missing' } | null
  onClose: () => void
}

export function TransactionSidebar({ row, onClose }: TransactionSidebarProps) {
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [emailThreadKey, setEmailThreadKey] = useState(0)
  const [showResendForm, setShowResendForm] = useState(false)
  const [resendEmail, setResendEmail] = useState('')

  const tx = row?.tx ?? null
  const emailStatus = row?.emailStatus ?? 'missing'
  const emailLog = row?.email ?? null

  const handleResend = async (overrideEmail?: string) => {
    if (!tx || sending) return
    setSending(true)
    setSendResult(null)
    setSendError(null)
    try {
      const res = await fetch('/api/admin/resend-payment-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: tx.id, ...(overrideEmail?.trim() ? { overrideEmail: overrideEmail.trim() } : {}) }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSendResult('error')
        setSendError(json.error ?? 'Something went wrong.')
      } else {
        setSendResult('success')
        setEmailThreadKey((k) => k + 1)
      }
    } catch {
      setSendResult('error')
      setSendError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const canResend = tx && tx.payer_email && emailStatus !== 'sent'

  return (
    <DetailSidebar
      isOpen={!!row}
      onClose={onClose}
      title={tx ? (PAYMENT_TYPE_LABELS[tx.payment_type] ?? tx.payment_type) : 'Transaction'}
    >
      {tx && (
        <>
          {/* Payment Details */}
          <Section>
            <Label>Payment Details</Label>
            <div style={{
              backgroundColor: colors.elevated,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>Amount</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{formatUSD(tx.amount_cents)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>Date</span>
                <span style={{ fontSize: 13, color: colors.textPrimary }}>{formatDate(tx.created_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>Type</span>
                <span style={{ fontSize: 13, color: colors.textPrimary }}>{PAYMENT_TYPE_LABELS[tx.payment_type] ?? tx.payment_type}</span>
              </div>
              {tx.payer_name && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: colors.textSecondary }}>Payer</span>
                  <span style={{ fontSize: 13, color: colors.textPrimary }}>{tx.payer_name}</span>
                </div>
              )}
              {tx.payer_email && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: colors.textSecondary }}>Email</span>
                  <span style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace' }}>{tx.payer_email}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>Email status</span>
                {emailStatus === 'sent' ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.success }}>✓ Sent</span>
                ) : emailStatus === 'error' ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.error }}>✕ Error</span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.warning }}>⚠ Missing</span>
                )}
              </div>
            </div>
          </Section>

          {/* Resend Email */}
          <Section>
            <Label>Confirmation Email</Label>
            {canResend ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 11.5, color: colors.textTertiary, margin: 0, lineHeight: 1.5 }}>
                  Our system has no record of sending this — check the Zoho email history below before resending, in case it was already delivered.
                </p>
                <button
                  onClick={() => handleResend()}
                  disabled={sending || sendResult === 'success'}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: sendResult === 'success' ? colors.success : colors.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: radius.md,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: sending || sendResult === 'success' ? 'default' : 'pointer',
                    opacity: sending ? 0.7 : 1,
                    transition: 'background-color 0.15s',
                  }}
                >
                  {sending ? 'Sending…' : sendResult === 'success' ? '✓ Email sent!' : 'Resend confirmation email'}
                </button>
                {sendResult === 'error' && sendError && (
                  <p style={{ fontSize: 12, color: colors.error, margin: 0 }}>{sendError}</p>
                )}
                {emailLog && (
                  <p style={{ fontSize: 11, color: colors.textTertiary, margin: 0 }}>
                    Last attempt: {formatDate(emailLog.sent_at)} — {emailLog.status === 'error' ? (emailLog.error_message ?? 'Error') : emailLog.subject}
                  </p>
                )}
              </div>
            ) : emailStatus === 'sent' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: colors.elevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.md,
                }}>
                  <p style={{ fontSize: 13, color: colors.success, margin: 0 }}>
                    ✓ Confirmation email was sent
                  </p>
                  {emailLog && (
                    <p style={{ fontSize: 11, color: colors.textTertiary, marginTop: 4, marginBottom: 0 }}>
                      {formatDate(emailLog.sent_at)} · {emailLog.subject}
                    </p>
                  )}
                  {emailLog?.to_address && (
                    <p style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2, marginBottom: 0 }}>
                      Sent to: <span style={{ fontFamily: 'monospace' }}>{emailLog.to_address}</span>
                    </p>
                  )}
                </div>
                {!showResendForm ? (
                  <button
                    onClick={() => { setShowResendForm(true); setResendEmail(tx.payer_email ?? ''); setSendResult(null); setSendError(null); }}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: 12,
                      color: colors.textSecondary,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Resend to a different address
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Email address"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: 13,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.md,
                        backgroundColor: colors.elevated,
                        color: colors.textPrimary,
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleResend(resendEmail)}
                        disabled={sending || !resendEmail.trim() || sendResult === 'success'}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: sendResult === 'success' ? colors.success : colors.accent,
                          color: '#fff',
                          border: 'none',
                          borderRadius: radius.md,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: sending || !resendEmail.trim() || sendResult === 'success' ? 'default' : 'pointer',
                          opacity: sending || !resendEmail.trim() ? 0.6 : 1,
                        }}
                      >
                        {sending ? 'Sending…' : sendResult === 'success' ? '✓ Sent!' : 'Send'}
                      </button>
                      <button
                        onClick={() => { setShowResendForm(false); setSendResult(null); setSendError(null); }}
                        style={{
                          padding: '8px 12px',
                          background: 'none',
                          border: `1px solid ${colors.border}`,
                          borderRadius: radius.md,
                          fontSize: 13,
                          color: colors.textSecondary,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    {sendResult === 'error' && sendError && (
                      <p style={{ fontSize: 12, color: colors.error, margin: 0 }}>{sendError}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: '10px 14px',
                backgroundColor: colors.elevated,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
              }}>
                <p style={{ fontSize: 13, color: colors.textTertiary, margin: 0 }}>No email address on file — cannot resend.</p>
              </div>
            )}
          </Section>

          {/* Email History */}
          {tx.payer_email && (
            <Section>
              <Label>Zoho Email History</Label>
              <EmailThread key={emailThreadKey} emailAddress={tx.payer_email} />
            </Section>
          )}

          {/* Stripe Session */}
          <Section>
            <Label>Stripe Session</Label>
            <div style={{
              backgroundColor: colors.elevated,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              padding: '10px 12px',
            }}>
              <p style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' }}>
                {tx.stripe_session_id}
              </p>
            </div>
          </Section>

          {/* Stripe Metadata */}
          <Section>
            <Label>Stripe Metadata</Label>
            <pre style={{
              fontSize: 11,
              color: colors.textSecondary,
              backgroundColor: colors.elevated,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              padding: '10px 12px',
              overflow: 'auto',
              maxHeight: 280,
              margin: 0,
              fontFamily: 'monospace',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {JSON.stringify(tx.metadata, null, 2)}
            </pre>
          </Section>
        </>
      )}
    </DetailSidebar>
  )
}
