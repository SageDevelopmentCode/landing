'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colors, shadows } from '../design-system'

interface DetailSidebarProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
  footer?: React.ReactNode
}

export function DetailSidebar({
  isOpen,
  onClose,
  children,
  title,
  footer,
}: DetailSidebarProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[500px] z-50 bg-white flex flex-col overflow-hidden"
            style={{
              boxShadow: shadows.large,
              borderLeft: `1px solid ${colors.border}`,
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between border-b flex-shrink-0"
              style={{
                backgroundColor: colors.warmLinen,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <h2
                className="text-xl font-semibold"
                style={{ color: colors.mistyForest }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-all duration-200 hover:bg-white/50"
                aria-label="Close sidebar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: colors.textSecondary }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

            {/* Footer */}
            {footer && (
              <div
                className="flex-shrink-0 px-6 py-4"
                style={{
                  borderTop: `1px solid ${colors.border}`,
                  backgroundColor: colors.warmLinen,
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
