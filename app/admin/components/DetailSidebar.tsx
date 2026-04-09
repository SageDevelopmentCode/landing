'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cssColors as colors, radius, cssShadows as shadows } from '../design-system'

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
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
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
            className="fixed inset-0 h-[100dvh] z-40 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.15)' }}
            onClick={onClose}
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[500px] z-50 flex flex-col overflow-hidden"
            style={{
              background: colors.elevated,
              borderLeft: `1px solid ${colors.border}`,
              boxShadow: shadows.large,
            }}
          >
            {/* Header */}
            {title && (
              <div
                className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between flex-shrink-0"
                style={{
                  background: colors.elevated,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <h2
                  className="text-base font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-colors duration-150"
                  style={{ color: colors.textTertiary }}
                  aria-label="Close sidebar"
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.elevated)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

            {/* Footer */}
            {footer && (
              <div
                className="flex-shrink-0 px-6 py-4"
                style={{
                  background: colors.elevated,
                  borderTop: `1px solid ${colors.border}`,
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
