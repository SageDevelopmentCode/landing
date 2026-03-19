'use client'

import { useState } from 'react'
import { Merriweather } from 'next/font/google'
import { colors, radius, shadows, spacing } from '../design-system'
import { OpenHouseTable } from './OpenHouseTable'
import type { OpenHouseRsvp } from './page'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

type SubMenuItem = 'open-house'

const subMenuItems: { id: SubMenuItem; label: string; sublabel: string }[] = [
  { id: 'open-house', label: 'Open House', sublabel: 'April 25' },
]

export function MarketingClient({ rsvps }: { rsvps: OpenHouseRsvp[] }) {
  const [active, setActive] = useState<SubMenuItem>('open-house')

  return (
    <div
      className="-mx-3 sm:-mx-4 lg:-mx-6"
      style={{ display: 'flex', height: '100%', minHeight: '100vh' }}
    >
      {/* Sub-sidebar */}
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
          Events
        </p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {subMenuItems.map((item) => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
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

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px',
          backgroundColor: colors.softCloud,
        }}
      >
        {active === 'open-house' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1
                className={merriweather.className}
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: colors.textPrimary,
                  marginBottom: '6px',
                }}
              >
                Open House — April 25
              </h1>
              <p style={{ fontSize: '13px', color: colors.textSecondary }}>
                RSVPs from the landing page form
              </p>
            </div>
            <OpenHouseTable rsvps={rsvps} />
          </div>
        )}
      </main>
    </div>
  )
}
