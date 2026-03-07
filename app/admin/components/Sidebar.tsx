'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { colors, radius, shadows, spacing } from '../design-system'
import { Tooltip } from './Tooltip'
import { Merriweather } from 'next/font/google'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Leads',
    href: '/admin/leads',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    name: 'Contracts',
    href: '/admin/contracts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: 'Applications',
    href: '/admin/applications',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{
          backgroundColor: colors.warmLinen,
          boxShadow: shadows.soft,
        }}
        aria-label="Toggle menu"
      >
        <motion.div
          animate={isMobileMenuOpen ? 'open' : 'closed'}
          className="w-6 h-5 flex flex-col justify-between"
        >
          <motion.span
            className="w-full h-0.5 block origin-left"
            style={{ backgroundColor: colors.mistyForest }}
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: 45, y: -1 },
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="w-full h-0.5 block"
            style={{ backgroundColor: colors.mistyForest }}
            variants={{
              closed: { opacity: 1 },
              open: { opacity: 0 },
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="w-full h-0.5 block origin-left"
            style={{ backgroundColor: colors.mistyForest }}
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: -45, y: 1 },
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Icon Only */}
      <aside
        className="hidden lg:flex flex-col w-20 h-screen sticky top-0 py-6"
        style={{
          backgroundColor: colors.warmLinen,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/assets/Logo.png"
            alt="Sagefield School Logo"
            width={32}
            height={32}
            priority
          />
        </div>

        <nav className="flex-1 flex flex-col items-center justify-center space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Tooltip key={item.href} content={item.name} side="right">
                <Link
                  href={item.href}
                  className="flex items-center justify-center p-3 transition-all duration-200"
                  style={{
                    backgroundColor: active ? colors.pastelSage : 'transparent',
                    color: active ? colors.mistyForest : colors.textSecondary,
                    borderRadius: '12px',
                  }}
                >
                  {item.icon}
                </Link>
              </Tooltip>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 w-64 z-50 p-6"
            style={{
              backgroundColor: colors.warmLinen,
              borderRight: `1px solid ${colors.border}`,
              boxShadow: shadows.large,
            }}
          >
            <div className="mb-10 mt-16 flex flex-col items-center">
              <Image
                src="/assets/Logo.png"
                alt="Sagefield School Logo"
                width={48}
                height={48}
                priority
              />
              <p
                className={`text-sm mt-3 ${merriweather.className}`}
                style={{ color: colors.textSecondary }}
              >
                Admin Portal
              </p>
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-all duration-200"
                    style={{
                      backgroundColor: active ? colors.pastelSage : 'transparent',
                      color: active ? colors.mistyForest : colors.textSecondary,
                      fontWeight: active ? 600 : 500,
                      borderRadius: '12px',
                    }}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
