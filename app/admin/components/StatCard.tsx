'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { colors, radius, shadows, spacing } from '../design-system'
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="p-6 cursor-pointer"
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: shadows.soft,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-sm font-medium mb-2"
            style={{ color: colors.textSecondary }}
          >
            {title}
          </p>
          <p
            className="text-3xl font-semibold"
            style={{ color: colors.textPrimary }}
          >
            {value}
          </p>
        </div>
        <div
          className="p-3"
          style={{
            backgroundColor: iconBgColor,
            color: iconColor,
            borderRadius: '12px',
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
