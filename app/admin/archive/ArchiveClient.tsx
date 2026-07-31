'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Poppins } from 'next/font/google'
import { cssColors as colors, radius } from '../design-system'
import CalendarClient from '../calendar/CalendarClient'
import { WeekSwapClient } from '../week-swap/WeekSwapClient'
import { DaySwapClient } from '../day-swap/DaySwapClient'
import type { WeekSwapStudent } from '../week-swap/types'
import type { DaySwapStudent } from '../day-swap/types'
import type { ArchiveTab } from './page'

const merriweather = Poppins({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

const subMenuItems: { id: ArchiveTab; label: string; sublabel: string }[] = [
  { id: 'calendar', label: 'Calendar', sublabel: 'Admin events' },
  { id: 'week-swap', label: 'Week Swap', sublabel: 'Summer weekly plan' },
  { id: 'day-swap', label: 'Day Swap', sublabel: 'Homeschool drop-in' },
]

export function ArchiveClient({
  initialTab,
  currentUser,
  initialEvents,
  usersMap,
  weekSwapStudents,
  daySwapStudents,
}: {
  initialTab: ArchiveTab
  currentUser: { full_name: string; role: string; id: string } | null
  initialEvents: Parameters<typeof CalendarClient>[0]['initialEvents']
  usersMap: Record<string, string>
  weekSwapStudents: WeekSwapStudent[]
  daySwapStudents: DaySwapStudent[]
}) {
  const router = useRouter()
  const [active, setActive] = useState<ArchiveTab>(initialTab)

  useEffect(() => {
    setActive(initialTab)
  }, [initialTab])

  function selectTab(tab: ArchiveTab) {
    setActive(tab)
    router.replace(`/admin/archive?tab=${tab}`, { scroll: false })
  }

  return (
    <div
      className="-mx-3 sm:-mx-4 lg:-mx-6"
      style={{ display: 'flex', height: '100%', minHeight: '100vh' }}
    >
      <aside
        style={{
          width: '220px',
          flexShrink: 0,
          backgroundColor: 'white',
          borderRight: `1px solid ${colors.border}`,
          padding: '24px 12px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <p
          className={merriweather.className}
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: colors.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
            paddingLeft: '8px',
          }}
        >
          Archive
        </p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {subMenuItems.map((item) => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => selectTab(item.id)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: radius.md,
                  border: 'none',
                  backgroundColor: isActive ? colors.pastelSage : 'transparent',
                  color: isActive ? colors.mistyForest : colors.textSecondary,
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                  lineHeight: 1.3,
                }}
              >
                <span style={{ display: 'block' }}>{item.label}</span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 400,
                    color: isActive ? colors.mistyForest : colors.textTertiary,
                    marginTop: '2px',
                  }}
                >
                  {item.sublabel}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main
        style={{
          flex: 1,
          overflowY: active === 'calendar' ? 'hidden' : 'auto',
          padding: active === 'calendar' ? 0 : '32px',
          backgroundColor: colors.softCloud,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {active === 'calendar' && (
          <CalendarClient
            currentUser={currentUser}
            initialEvents={initialEvents}
            usersMap={usersMap}
          />
        )}

        {active === 'week-swap' && (
          <div className={merriweather.className} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '28px' }}>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: colors.textPrimary,
                  marginBottom: '6px',
                }}
              >
                Summer Week Swap
              </h1>
              <p style={{ fontSize: '13px', color: colors.textSecondary }}>
                Swap a parent&apos;s paid summer week for a different one (weekly-plan only).
              </p>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', minHeight: '400px' }}>
              <WeekSwapClient students={weekSwapStudents} />
            </div>
          </div>
        )}

        {active === 'day-swap' && (
          <div className={merriweather.className} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '28px' }}>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: colors.textPrimary,
                  marginBottom: '6px',
                }}
              >
                Homeschool Day Swap
              </h1>
              <p style={{ fontSize: '13px', color: colors.textSecondary }}>
                Swap a parent&apos;s paid homeschool drop-in day for a different date.
              </p>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', minHeight: '400px' }}>
              <DaySwapClient students={daySwapStudents} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
