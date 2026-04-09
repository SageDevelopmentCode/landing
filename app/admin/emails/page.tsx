'use client'

import { useState, useEffect } from 'react'
import { Table, TableRow, TableCell } from '../components/Table'
import { EmailDetailSidebar } from '../components/EmailDetailSidebar'
import { cssColors as colors, cssShadows as shadows } from '../design-system'
import { Poppins } from 'next/font/google'

const merriweather = Poppins({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

type ZohoEmailContent = {
  messageId: string
  fromAddress: string
  toAddress: string
  ccAddress?: string
  bccAddress?: string
  subject: string
  content: string
  summary: string
  time: string
  hasAttachment: boolean
  attachments?: { attachmentName: string; attachmentSize: number; attachmentPath: string }[]
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours   = Math.floor(minutes / 60)
  const days    = Math.floor(hours / 24)
  const months  = Math.floor(days / 30)
  const years   = Math.floor(days / 365)

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (seconds < 60)  return rtf.format(-seconds, 'second')
  if (minutes < 60)  return rtf.format(-minutes, 'minute')
  if (hours < 24)    return rtf.format(-hours,   'hour')
  if (days < 30)     return rtf.format(-days,    'day')
  if (months < 12)   return rtf.format(-months,  'month')
  return rtf.format(-years, 'year')
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<ZohoEmailContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<ZohoEmailContent | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/zoho/emails')
        if (!res.ok) throw new Error(`Failed to fetch emails (${res.status})`)
        const json = await res.json()
        setEmails(json.data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className={`text-2xl font-bold ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          Sent Emails
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          All emails sent via Zoho Mail
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl animate-pulse"
              style={{ backgroundColor: colors.pastelSage, opacity: 0.4 }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          className="rounded-xl px-5 py-4 text-sm"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            boxShadow: shadows.soft,
          }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && emails.length === 0 && (
        <div
          className="rounded-xl px-5 py-10 text-center text-sm"
          style={{
            backgroundColor: 'white',
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            boxShadow: shadows.soft,
          }}
        >
          No sent emails found.
        </div>
      )}

      {/* Table */}
      {!loading && !error && emails.length > 0 && (
        <Table headers={['To', 'Subject', 'Preview', 'Date']}>
          {emails.map((email) => (
            <TableRow
              key={email.messageId}
              onClick={() => setSelectedEmail(email)}
            >
              <TableCell className="font-medium max-w-[160px] truncate">
                {email.toAddress}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {email.subject}
              </TableCell>
              <TableCell className="max-w-[240px] truncate text-gray-400">
                {email.summary}
              </TableCell>
              <TableCell className="whitespace-nowrap text-gray-400">
                {timeAgo(Number(email.time))}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Detail sidebar */}
      <EmailDetailSidebar
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
      />
    </div>
  )
}
