'use client'

import { useState, useEffect } from 'react'
import { colors, radius } from '../design-system'

interface EmailMessage {
  messageId: string
  fromAddress: string
  toAddress: string
  ccAddress?: string
  bccAddress?: string
  subject: string
  content: string
  summary: string
  time: number
  hasAttachment: boolean
  attachments?: Array<{
    attachmentName: string
    attachmentSize: number
    attachmentPath: string
  }>
}

interface EmailThreadProps {
  emailAddress: string
}

export function EmailThread({ emailAddress }: EmailThreadProps) {
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadEmailThread() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/zoho/thread?email=${encodeURIComponent(emailAddress)}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch email thread')
        }

        const data = await response.json()
        setEmails(data.data || [])
      } catch (err) {
        console.error('Error loading email thread:', err)
        setError(err instanceof Error ? err.message : 'Failed to load emails')
      } finally {
        setLoading(false)
      }
    }

    loadEmailThread()
  }, [emailAddress])

  const toggleEmail = (messageId: string) => {
    setExpandedEmails((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  const formatDate = (timestamp: number) => {
    // Zoho timestamps are in milliseconds
    const now = Date.now()
    const emailDate = new Date(timestamp)
    const diffMs = now - timestamp
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    // Relative time
    if (diffSeconds < 60) {
      return 'Just now'
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    } else {
      // For older emails, show the date
      return emailDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  if (loading) {
    return (
      <div
        className="p-4 text-center"
        style={{
          backgroundColor: colors.softCloud,
          borderRadius: radius.md,
          border: `1px solid ${colors.divider}`,
        }}
      >
        <div className="flex items-center justify-center space-x-2">
          <div
            className="animate-spin rounded-full h-4 w-4 border-b-2"
            style={{ borderColor: colors.mistyForest }}
          ></div>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Loading email thread...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="p-4"
        style={{
          backgroundColor: '#fff3cd',
          borderRadius: radius.md,
          border: '1px solid #ffeaa7',
        }}
      >
        <p className="text-sm" style={{ color: '#856404' }}>
          {error.includes('not configured')
            ? 'Zoho Mail is not configured. Email thread unavailable.'
            : `Error loading emails: ${error}`}
        </p>
      </div>
    )
  }

  if (emails.length === 0) {
    return (
      <div
        className="p-4 text-center"
        style={{
          backgroundColor: colors.softCloud,
          borderRadius: radius.md,
          border: `1px solid ${colors.divider}`,
        }}
      >
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          No email history found with this contact.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => {
        const isExpanded = expandedEmails.has(email.messageId)
        // Safely check if email is sent (from sagefield.co) or received
        const fromAddr = email.fromAddress?.toLowerCase() || ''
        const isSent = fromAddr.includes('sagefield')

        return (
          <div
            key={email.messageId}
            className="overflow-hidden cursor-pointer transition-all hover:shadow-sm"
            style={{
              backgroundColor: colors.softCloud,
              borderRadius: radius.md,
              border: `1px solid ${colors.divider}`,
            }}
            onClick={() => toggleEmail(email.messageId)}
          >
            <div className="p-3">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1">
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
                    style={{
                      backgroundColor: isSent ? colors.paleMarigold : colors.powderBlue,
                      color: colors.textPrimary,
                    }}
                  >
                    {isSent ? 'Sent' : 'Received'}
                  </span>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>
                    {formatDate(email.time)}
                  </p>
                </div>
                {email.hasAttachment && (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: colors.textSecondary }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                )}
              </div>

              {/* Subject */}
              <h4
                className="text-sm font-semibold mb-1"
                style={{ color: colors.mistyForest }}
              >
                {email.subject || '(No subject)'}
              </h4>

              {/* From/To */}
              <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                {isSent ? `To: ${email.toAddress || 'Unknown'}` : `From: ${email.fromAddress || 'Unknown'}`}
              </p>

              {/* Preview or Full Content */}
              {isExpanded ? (
                <div>
                  <div
                    className="text-sm prose prose-sm max-w-none mt-3 pt-3"
                    style={{
                      color: colors.textPrimary,
                      borderTop: `1px solid ${colors.divider}`,
                    }}
                    dangerouslySetInnerHTML={{ __html: email.content || '<p>No content available</p>' }}
                  />
                  {email.attachments && email.attachments.length > 0 && (
                    <div
                      className="mt-3 pt-3"
                      style={{ borderTop: `1px solid ${colors.divider}` }}
                    >
                      <p
                        className="text-xs font-medium mb-2"
                        style={{ color: colors.textSecondary }}
                      >
                        Attachments:
                      </p>
                      <ul className="space-y-1">
                        {email.attachments.map((attachment, idx) => (
                          <li key={idx} className="text-xs" style={{ color: colors.textPrimary }}>
                            📎 {attachment.attachmentName} ({Math.round(attachment.attachmentSize / 1024)}KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p
                  className="text-sm line-clamp-2"
                  style={{ color: colors.textPrimary }}
                >
                  {stripHtml(email.summary || email.content || 'No preview available')}
                </p>
              )}

              {/* Expand indicator */}
              <div className="mt-2 text-xs text-center" style={{ color: colors.textTertiary }}>
                {isExpanded ? '▲ Click to collapse' : '▼ Click to expand'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
