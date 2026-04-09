'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { colors, radius, shadows } from '../design-system'

interface TableProps {
  headers: string[]
  children: ReactNode
}

interface TableRowProps {
  children: ReactNode
  index?: number
  onClick?: () => void
  style?: React.CSSProperties
}

export function Table({ headers, children }: TableProps) {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        boxShadow: shadows.card,
      }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: colors.textTertiary }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.04,
                },
              },
            }}
          >
            {children}
          </motion.tbody>
        </table>
      </div>
    </div>
  )
}

export function TableRow({ children, index = 0, onClick, style }: TableRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      style={style}
      className={`transition-colors duration-100 ${onClick ? 'cursor-pointer' : ''}`}
      whileHover={{
        backgroundColor: colors.elevated,
        transition: { duration: 0.1 },
      }}
    >
      {children}
    </motion.tr>
  )
}

interface TableCellProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function TableCell({ children, className = '', style }: TableCellProps) {
  return (
    <td
      className={`px-3 py-2 text-xs whitespace-nowrap ${className}`}
      style={{ color: colors.textSecondary, borderBottom: `1px solid ${colors.border}`, ...style }}
    >
      {children}
    </td>
  )
}
