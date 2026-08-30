'use client'

import { useState } from 'react'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'
import { Table, TableRow, TableCell } from '../components/Table'
import { CommunityGardenDayRsvpDetailSidebar } from './CommunityGardenDayRsvpDetailSidebar'
import type { CommunityGardenDayRsvp } from './page'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function parseAttendeeCount(value: string): number {
  const match = value.trim().match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

const FAMILY_LABELS: Record<string, string> = {
  yes: 'Yes',
  no: 'No',
  interested: 'Interested',
}

const HEAR_LABELS: Record<string, string> = {
  friend: 'Friend / Word of Mouth',
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Google',
  nextdoor: 'Nextdoor',
  other: 'Other',
}

export function CommunityGardenDayRSVPsView({
  rsvps,
}: {
  rsvps: CommunityGardenDayRsvp[]
}) {
  const [selectedRsvp, setSelectedRsvp] = useState<CommunityGardenDayRsvp | null>(
    null,
  )

  const totalAdults = rsvps.reduce(
    (sum, r) => sum + parseAttendeeCount(r.adults_attending),
    0,
  )
  const totalChildren = rsvps.reduce(
    (sum, r) => sum + parseAttendeeCount(r.children_attending),
    0,
  )
  const totalPeople = totalAdults + totalChildren

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
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'RSVPs', value: rsvps.length },
          { label: 'Adults', value: totalAdults },
          { label: 'Children', value: totalChildren },
          { label: 'Total Attendees', value: totalPeople },
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

      <Table
        headers={[
          'Submitted',
          'Parent',
          'Email',
          'Phone',
          'Adults',
          'Children',
          'Sage Field?',
          'How Heard',
          'Status',
        ]}
      >
        {rsvps.map((rsvp, i) => (
          <TableRow
            key={rsvp.id}
            index={i}
            onClick={() => setSelectedRsvp(rsvp)}
            style={{ cursor: 'pointer' }}
          >
            <TableCell className="whitespace-nowrap text-gray-400 text-xs">
              {formatDate(rsvp.created_at)}
            </TableCell>
            <TableCell className="font-medium max-w-[140px] truncate">
              {rsvp.parent_name}
            </TableCell>
            <TableCell className="max-w-[180px] truncate text-gray-500 text-xs">
              {rsvp.email}
            </TableCell>
            <TableCell className="whitespace-nowrap text-gray-400 text-xs">
              {rsvp.phone ?? '—'}
            </TableCell>
            <TableCell className="max-w-[80px] truncate text-xs">
              {rsvp.adults_attending}
            </TableCell>
            <TableCell className="max-w-[80px] truncate text-xs">
              {rsvp.children_attending}
            </TableCell>
            <TableCell className="text-xs">
              {FAMILY_LABELS[rsvp.is_sage_field_family] ?? rsvp.is_sage_field_family}
            </TableCell>
            <TableCell className="max-w-[120px] truncate text-xs text-gray-500">
              {rsvp.hear_about_us
                ? (HEAR_LABELS[rsvp.hear_about_us] ?? rsvp.hear_about_us)
                : '—'}
            </TableCell>
            <TableCell>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: rsvp.status === 'pending' ? '#fef9c3' : '#dcfce7',
                  color: rsvp.status === 'pending' ? '#854d0e' : '#166534',
                }}
              >
                {rsvp.status}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      {selectedRsvp && (
        <CommunityGardenDayRsvpDetailSidebar
          key={selectedRsvp.id}
          rsvp={selectedRsvp}
          onClose={() => setSelectedRsvp(null)}
        />
      )}
    </div>
  )
}
