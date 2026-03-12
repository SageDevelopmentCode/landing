'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { colors, radius, shadows } from '../design-system'

interface CountdownCardProps {
  programName: string
  date: string // ISO date string e.g. "2026-05-26"
  accentColor: string
  iconBgColor: string
  delay?: number
}

function getDaysRemaining(isoDate: string): number | null {
  const target = new Date(isoDate)
  const now = new Date()
  // Zero out time portions for a clean day diff
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function CountdownCard({
  programName,
  date,
  accentColor,
  iconBgColor,
  delay = 0,
}: CountdownCardProps) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  useEffect(() => {
    setDaysRemaining(getDaysRemaining(date))
  }, [date])

  const started = daysRemaining !== null && daysRemaining <= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="p-6"
      style={{
        backgroundColor: 'white',
        borderRadius: radius.lg,
        boxShadow: shadows.soft,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-sm font-medium mb-1"
            style={{ color: colors.textSecondary }}
          >
            {programName}
          </p>
          <p
            className="text-xs mb-3"
            style={{ color: colors.textTertiary }}
          >
            {formatDate(date)}
          </p>
          {started ? (
            <p
              className="text-lg font-semibold"
              style={{ color: accentColor }}
            >
              Program started
            </p>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <p
                className="text-3xl font-semibold"
                style={{ color: colors.textPrimary }}
              >
                {daysRemaining ?? '—'}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: colors.textSecondary }}
              >
                days
              </p>
            </div>
          )}
        </div>
        <div
          className="p-3"
          style={{
            backgroundColor: iconBgColor,
            color: accentColor,
            borderRadius: '12px',
          }}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
    </motion.div>
  )
}
