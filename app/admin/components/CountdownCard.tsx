'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="p-5"
      style={{
        backgroundColor: colors.elevated,
        borderRadius: radius.lg,
        boxShadow: shadows.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wide mb-1"
            style={{ color: colors.textTertiary }}
          >
            {programName}
          </p>
          <p
            className="text-xs mb-3"
            style={{ color: colors.textQuaternary }}
          >
            {formatDate(date)}
          </p>
          {started ? (
            <p
              className="text-base font-semibold"
              style={{ color: accentColor }}
            >
              Program started
            </p>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <p
                className="text-3xl font-bold"
                style={{ color: colors.textPrimary }}
              >
                {daysRemaining ?? '—'}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: colors.textTertiary }}
              >
                days away
              </p>
            </div>
          )}
        </div>
        <div
          className="p-2.5"
          style={{
            backgroundColor: iconBgColor,
            color: accentColor,
            borderRadius: radius.md,
          }}
        >
          <CalendarDays className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  )
}
