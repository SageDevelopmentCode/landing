'use client'

import { DetailSidebar } from './DetailSidebar'
import { SidebarField, SidebarSection } from '../../components/SidebarPrimitives'

type EmailAttachment = {
  attachmentName: string
  attachmentSize: number
  attachmentPath: string
}

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
  attachments?: EmailAttachment[]
}

interface EmailDetailSidebarProps {
  email: ZohoEmailContent | null
  onClose: () => void
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function EmailDetailSidebar({ email, onClose }: EmailDetailSidebarProps) {
  if (!email) return null

  const sentAt = timeAgo(Number(email.time))

  return (
    <DetailSidebar
      isOpen={true}
      onClose={onClose}
      title="Email Details"
    >
      <div className="space-y-4">
        <SidebarSection title="Message Info">
          <SidebarField label="To" value={email.toAddress} />
          <SidebarField label="From" value={email.fromAddress} />
          {email.ccAddress && <SidebarField label="CC" value={email.ccAddress} />}
          {email.bccAddress && <SidebarField label="BCC" value={email.bccAddress} />}
          <SidebarField label="Subject" value={email.subject} />
          <SidebarField label="Sent" value={sentAt} />
        </SidebarSection>

        <SidebarSection title="Body">
          <iframe
            srcDoc={email.content}
            sandbox="allow-same-origin"
            className="w-full rounded-lg border border-gray-200"
            style={{ height: '400px', minHeight: '200px' }}
            title="Email body"
          />
        </SidebarSection>

        {email.hasAttachment && email.attachments && email.attachments.length > 0 && (
          <SidebarSection title="Attachments">
            <div className="space-y-2">
              {email.attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <span className="text-sm text-gray-800 truncate">{att.attachmentName}</span>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatBytes(att.attachmentSize)}</span>
                </div>
              ))}
            </div>
          </SidebarSection>
        )}
      </div>
    </DetailSidebar>
  )
}
