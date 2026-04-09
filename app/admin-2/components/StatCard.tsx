'use client'

import { motion } from 'framer-motion'
import { colors, radius, shadows } from '../design-system'
import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string
  delta?: string
  deltaPositive?: boolean
  icon?: ReactNode
  delay?: number
}

export function StatCard({ title, value, delta, deltaPositive, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="relative overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: '20px',
        boxShadow: shadows.card,
      }}
    >
      {icon && (
        <div
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: colors.accentGlow }}
        >
          <span style={{ color: colors.accent }}>{icon}</span>
        </div>
      )}
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: colors.textTertiary }}
      >
        {title}
      </p>
      <p
        className="text-3xl font-bold tabular-nums tracking-tight"
        style={{ color: colors.textPrimary }}
      >
        {value}
      </p>
      {delta && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className="text-xs font-semibold"
            style={{ color: deltaPositive ? colors.success : colors.danger }}
          >
            {deltaPositive ? '▲' : '▼'} {delta}
          </span>
        </div>
      )}
    </motion.div>
  )
}
