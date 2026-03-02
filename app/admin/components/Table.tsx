'use client'

import { motion } from 'framer-motion'
import { colors, radius, shadows } from '../design-system'
import { ReactNode } from 'react'

interface TableProps {
  headers: string[]
  children: ReactNode
}

interface TableRowProps {
  children: ReactNode
  index?: number
}

export function Table({ headers, children }: TableProps) {
  return (
    <div
      className="overflow-hidden"
      style={{
        backgroundColor: 'white',
        borderRadius: radius.lg,
        boxShadow: shadows.soft,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr style={{ backgroundColor: colors.warmLinen }}>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-sm font-semibold"
                  style={{
                    color: colors.mistyForest,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
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
                  staggerChildren: 0.05,
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

export function TableRow({ children, index = 0 }: TableRowProps) {
  return (
    <motion.tr
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="transition-colors duration-150"
      style={{
        borderBottom: `1px solid ${colors.divider}`,
      }}
      whileHover={{
        backgroundColor: colors.warmLinen + '40', // 40 is hex for 25% opacity
      }}
    >
      {children}
    </motion.tr>
  )
}

interface TableCellProps {
  children: ReactNode
  className?: string
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return (
    <td
      className={`px-6 py-5 text-sm ${className}`}
      style={{ color: colors.textPrimary }}
    >
      {children}
    </td>
  )
}
