'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colors, radius, shadows } from '../design-system'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'right' | 'left' | 'top' | 'bottom'
}

export function Tooltip({ content, children, side = 'right' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const getPositionStyles = () => {
    switch (side) {
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '12px',
        }
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '12px',
        }
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '12px',
        }
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '12px',
        }
      default:
        return {}
    }
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 px-3 py-2 text-sm font-medium whitespace-nowrap pointer-events-none"
            style={{
              ...getPositionStyles(),
              backgroundColor: 'white',
              color: colors.textPrimary,
              borderRadius: radius.md,
              boxShadow: shadows.medium,
              border: `1px solid ${colors.border}`,
            }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
