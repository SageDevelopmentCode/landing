'use client'

import { useState } from 'react'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'
import { Table, TableRow, TableCell } from '../components/Table'
import { FieldFridaySignupDetailSidebar } from './FieldFridaySignupDetailSidebar'
import type { SchoolYearFieldFridaySignup } from '@/app/lib/admin-school-year-field-friday-signups'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFridaySummary(dates: string[]): string {
  if (dates.length === 0) return '—'
  if (dates.length <= 2) {
    return dates
      .map((d) => {
        const [y, m, day] = d.split('-').map(Number)
        return new Date(y, m - 1, day).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      })
      .join(', ')
  }
  return `${dates.length} Fridays`
}

const SOURCE_LABELS: Record<SchoolYearFieldFridaySignup['signupSource'], string> = {
  parent_portal: 'Parent portal',
  friday_page: '/friday',
  both: 'Both',
}

function PaymentBadge({ status }: { status: 'paid' | 'pending' }) {
  const paid = status === 'paid'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: paid ? '#dcfce7' : '#fef9c3',
        color: paid ? '#166534' : '#854d0e',
      }}
    >
      {paid ? 'Paid' : 'Pending'}
    </span>
  )
}

export function FieldFridaySignupsView({
  signups,
}: {
  signups: SchoolYearFieldFridaySignup[]
}) {
  const [selected, setSelected] = useState<SchoolYearFieldFridaySignup | null>(
    null,
  )

  const uniqueParentEmails = new Set(
    signups.map((s) => s.parentEmail?.toLowerCase()).filter(Boolean),
  ).size
  const totalPaidFridays = signups.reduce(
    (sum, s) => sum + s.paidFridays.length,
    0,
  )

  if (signups.length === 0) {
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
          No Field Friday signups yet (parent portal or /friday page).
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
          { label: 'Students', value: signups.length },
          { label: 'Families', value: uniqueParentEmails },
          { label: 'Paid Friday Days', value: totalPaidFridays },
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
          'Last Activity',
          'Parent',
          'Email',
          'Child',
          'Source',
          'Payment',
          'Paid Fridays',
        ]}
      >
        {signups.map((signup, i) => (
          <TableRow
            key={signup.studentId}
            index={i}
            onClick={() => setSelected(signup)}
            style={{ cursor: 'pointer' }}
          >
            <TableCell className="whitespace-nowrap text-gray-400 text-xs">
              {formatDate(signup.lastPaymentAt)}
            </TableCell>
            <TableCell className="font-medium max-w-[140px] truncate">
              {signup.parentName ?? '—'}
            </TableCell>
            <TableCell className="max-w-[180px] truncate text-gray-500 text-xs">
              {signup.parentEmail}
            </TableCell>
            <TableCell className="max-w-[120px] truncate">
              {signup.childName}
            </TableCell>
            <TableCell className="text-xs text-gray-600 max-w-[90px]">
              {SOURCE_LABELS[signup.signupSource]}
            </TableCell>
            <TableCell>
              <PaymentBadge status={signup.paymentStatus} />
            </TableCell>
            <TableCell className="text-xs text-gray-600">
              {formatFridaySummary(signup.paidFridays)}
            </TableCell>
          </TableRow>
        ))}
      </Table>

      {selected && (
        <FieldFridaySignupDetailSidebar
          key={selected.studentId}
          signup={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
