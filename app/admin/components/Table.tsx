'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface TableProps {
  headers: string[]
  children: ReactNode
}

interface TableRowProps {
  children: ReactNode
  index?: number
  onClick?: () => void
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 font-body"
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

export function TableRow({ children, index = 0, onClick }: TableRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      className={`transition-colors duration-150 border-b border-gray-100 ${onClick ? 'cursor-pointer' : ''}`}
      whileHover={{
        backgroundColor: '#F9FAFB',
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
    <td className={`px-4 py-3 text-sm text-gray-700 font-body ${className}`} style={style}>
      {children}
    </td>
  )
}
