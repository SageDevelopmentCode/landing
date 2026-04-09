'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, TrendingUp, GraduationCap, ClipboardList,
  BookOpen, CreditCard, DollarSign, CalendarDays, Megaphone,
  Users, Menu, X, ChevronRight,
} from 'lucide-react'
import { colors, radius, shadows } from '../design-system'

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard',     href: '/admin-2',              icon: LayoutDashboard },
      { name: 'Leads',         href: '/admin-2/leads',        icon: TrendingUp,    badge: 7    },
      { name: 'Students',      href: '/admin-2/students',     icon: GraduationCap              },
      { name: 'Applications',  href: '/admin-2/applications', icon: ClipboardList, badge: 3, badgeRed: true },
      { name: 'Programs',      href: '/admin-2/programs',     icon: BookOpen                   },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Transactions',  href: '/admin-2/transactions', icon: CreditCard   },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Calendar',      href: '/admin-2/calendar',     icon: CalendarDays },
      { name: 'Marketing',     href: '/admin-2/marketing',    icon: Megaphone    },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/admin-2' ? pathname === '/admin-2' : pathname?.startsWith(href)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 mb-2"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBright})`, color: '#fff' }}
          >
            S
          </div>
          <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            Sagefield
          </span>
        </div>
        <kbd
          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.borderHover}`,
            color: colors.textTertiary,
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-5 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1"
              style={{ color: colors.textTertiary }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group"
                    style={{
                      backgroundColor: active ? colors.elevated : 'transparent',
                      color: active ? colors.textPrimary : colors.textTertiary,
                      fontWeight: active ? 500 : 400,
                      borderLeft: active ? `2px solid ${colors.accent}` : '2px solid transparent',
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {'badge' in item && item.badge && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: item.badgeRed ? colors.dangerBg : colors.accentGlow,
                          color: item.badgeRed ? colors.danger : colors.accentBright,
                          border: `1px solid ${item.badgeRed ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)'}`,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div
        className="px-3 py-3 mx-3 mb-3 rounded-lg flex items-center gap-3"
        style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBright})`, color: '#fff' }}
        >
          A
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>Admin</p>
          <p className="text-[10px] truncate" style={{ color: colors.textTertiary }}>admin@sagefield.co</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <Menu className="w-5 h-5" style={{ color: colors.textSecondary }} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-60 overflow-hidden"
            style={{ backgroundColor: colors.surface, borderRight: `1px solid ${colors.border}` }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-md"
              style={{ color: colors.textTertiary }}
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0 overflow-hidden"
        style={{ backgroundColor: colors.surface, borderRight: `1px solid ${colors.border}` }}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
