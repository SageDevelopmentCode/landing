'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { colors, radius, shadows } from '../design-system'
import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: number | string
  icon: ReactNode
  iconColor: string
  iconBgColor: string
  href?: string
  delay?: number
}

export function StatCard({
  title,
  value,
  icon,
  iconColor,
  iconBgColor,
  href,
  delay = 0,
}: StatCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className="p-5 cursor-pointer"
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
            className="text-xs font-medium mb-2 uppercase tracking-wide"
            style={{ color: colors.textTertiary }}
          >
            {title}
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: colors.textPrimary }}
          >
            {value}
          </p>
        </div>
        <div
          className="p-2.5"
          style={{
            backgroundColor: iconBgColor,
            color: iconColor,
            borderRadius: radius.md,
          }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
