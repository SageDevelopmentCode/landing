'use client'

import { useState, useEffect } from 'react'
import { Poppins } from 'next/font/google'
import { cssColors as colors, radius, cssShadows as shadows, spacing } from '../design-system'
import { OpenHouseTable } from './OpenHouseTable'
import { TourUnavailabilityView } from './TourUnavailabilityView'
import { InfoSessionTable } from './InfoSessionTable'
import { InfoSessionFAQView } from './InfoSessionFAQView'
import { ShadowDayBookingsView } from './ShadowDayBookingsView'
import { TestimonialsView } from './TestimonialsView'
import { MeetMissJoyRSVPsView } from './MeetMissJoyRSVPsView'
import { EmailDetailSidebar } from '../components/EmailDetailSidebar'
import { Table, TableRow, TableCell } from '../components/Table'
import type { OpenHouseRsvp, TourBooking, InfoSessionRsvp, ShadowDayBooking, Testimonial, MeetMissJoyRsvp } from './page'
import type { TourUnavailability } from '@/app/actions/tourUnavailability'

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

function EmailsView() {
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
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1
          className={merriweather.className}
          style={{ fontSize: '22px', fontWeight: 900, color: colors.textPrimary, marginBottom: '6px' }}
        >
          Sent Emails
        </h1>
        <p style={{ fontSize: '13px', color: colors.textSecondary }}>All emails sent via Zoho Mail</p>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{ height: '48px', borderRadius: radius.md, backgroundColor: colors.pastelSage, opacity: 0.4 }}
              className="animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            borderRadius: radius.md,
            padding: '16px 20px',
            fontSize: '13px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            boxShadow: shadows.soft,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && emails.length === 0 && (
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
          No sent emails found.
        </div>
      )}

      {!loading && !error && emails.length > 0 && (
        <Table headers={['To', 'Subject', 'Preview', 'Date']}>
          {emails.map((email) => (
            <TableRow key={email.messageId} onClick={() => setSelectedEmail(email)}>
              <TableCell className="font-medium max-w-[160px] truncate">{email.toAddress}</TableCell>
              <TableCell className="max-w-[200px] truncate">{email.subject}</TableCell>
              <TableCell className="max-w-[240px] truncate text-gray-400">{email.summary}</TableCell>
              <TableCell className="whitespace-nowrap text-gray-400">{timeAgo(Number(email.time))}</TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <EmailDetailSidebar email={selectedEmail} onClose={() => setSelectedEmail(null)} />
    </div>
  )
}

const merriweather = Poppins({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

type SubMenuItem = 'open-house' | 'tour-unavailability' | 'info-session' | 'info-session-faq' | 'shadow-day' | 'emails' | 'testimonials' | 'meet-miss-joy'

const subMenuItems: { id: SubMenuItem; label: string; sublabel: string }[] = [
  { id: 'open-house', label: 'Open House', sublabel: 'April 25' },
  { id: 'tour-unavailability', label: 'Campus Tours', sublabel: 'Manage availability' },
  { id: 'shadow-day', label: 'Shadow Day', sublabel: 'Bookings & payments' },
  { id: 'info-session', label: 'Info Session', sublabel: 'April 18 RSVPs' },
  { id: 'meet-miss-joy', label: 'Meet Miss Joy', sublabel: 'July 13 RSVPs' },
  { id: 'info-session-faq', label: 'Session FAQ', sublabel: 'April 18 prep' },
  { id: 'testimonials', label: 'Testimonials', sublabel: 'Parent submissions' },
  { id: 'emails', label: 'Sent Emails', sublabel: 'Via Zoho Mail' },
]

export function MarketingClient({
  rsvps,
  tourUnavailability,
  tourBookings,
  enrolledEmailsArr,
  infoSessionRsvps,
  shadowDayBookings,
  testimonials,
  meetMissJoyRsvps,
}: {
  rsvps: OpenHouseRsvp[]
  tourUnavailability: TourUnavailability[]
  tourBookings: TourBooking[]
  enrolledEmailsArr: { email: string; status: string }[]
  infoSessionRsvps: InfoSessionRsvp[]
  shadowDayBookings: ShadowDayBooking[]
  testimonials: Testimonial[]
  meetMissJoyRsvps: MeetMissJoyRsvp[]
}) {
  const [active, setActive] = useState<SubMenuItem>('open-house')

  return (
    <div
      className="-mx-3 sm:-mx-4 lg:-mx-6"
      style={{ display: 'flex', height: '100%', minHeight: '100vh' }}
    >
      {/* Sub-sidebar */}
      <aside
        style={{
          width: '220px',
          flexShrink: 0,
          backgroundColor: 'white',
          borderRight: `1px solid ${colors.border}`,
          padding: '24px 12px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <p
          className={merriweather.className}
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: colors.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
            paddingLeft: '8px',
          }}
        >
          Marketing
        </p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {subMenuItems.map((item) => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: radius.md,
                  border: 'none',
                  backgroundColor: isActive ? colors.pastelSage : 'transparent',
                  color: isActive ? colors.mistyForest : colors.textSecondary,
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                  lineHeight: 1.3,
                }}
              >
                <span style={{ display: 'block' }}>{item.label}</span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 400,
                    color: isActive ? colors.mistyForest : colors.textTertiary,
                    marginTop: '2px',
                  }}
                >
                  {item.sublabel}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px',
          backgroundColor: colors.softCloud,
        }}
      >
        {active === 'open-house' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1
                className={merriweather.className}
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: colors.textPrimary,
                  marginBottom: '6px',
                }}
              >
                Open House — April 25
              </h1>
              <p style={{ fontSize: '13px', color: colors.textSecondary }}>
                RSVPs from the landing page form
              </p>
            </div>
            <OpenHouseTable rsvps={rsvps} enrolledEmailsArr={enrolledEmailsArr} />
          </div>
        )}

        {active === 'tour-unavailability' && (
          <TourUnavailabilityView initial={tourUnavailability} tourBookings={tourBookings} />
        )}

        {active === 'shadow-day' && (
          <ShadowDayBookingsView bookings={shadowDayBookings} />
        )}

        {active === 'info-session' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1
                className={merriweather.className}
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: colors.textPrimary,
                  marginBottom: '6px',
                }}
              >
                Info Session — April 18
              </h1>
              <p style={{ fontSize: '13px', color: colors.textSecondary }}>
                RSVPs from the parent info session form
              </p>
            </div>
            <InfoSessionTable rsvps={infoSessionRsvps} />
          </div>
        )}

        {active === 'meet-miss-joy' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1
                className={merriweather.className}
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: colors.textPrimary,
                  marginBottom: '6px',
                }}
              >
                Meet Miss Joy — July 13
              </h1>
              <p style={{ fontSize: '13px', color: colors.textSecondary }}>
                RSVPs from the Meet Miss Joy event page
              </p>
            </div>
            <MeetMissJoyRSVPsView rsvps={meetMissJoyRsvps} />
          </div>
        )}

        {active === 'info-session-faq' && <InfoSessionFAQView />}

        {active === 'testimonials' && <TestimonialsView testimonials={testimonials} />}

        {active === 'emails' && <EmailsView />}
      </main>
    </div>
  )
}
