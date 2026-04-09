'use client'

import { motion } from 'framer-motion'
import { colors, radius, shadows } from '../design-system'

const DOT_COLORS: Record<string, string> = {
  purple:  '#8B5CF6',
  success: '#22C55E',
  info:    '#38BDF8',
  warning: '#F59E0B',
  danger:  '#EF4444',
}

interface ActivityEvent {
  id: string
  type: string
  text: string
  time: string
  color: string
}

interface ActivityFeedProps {
  events: ActivityEvent[]
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <div
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: '20px',
        boxShadow: shadows.card,
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: colors.textTertiary }}>
        Recent Activity
      </p>
      <div className="relative pl-4" style={{ borderLeft: `2px solid ${colors.border}` }}>
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            className="relative flex items-start gap-3 mb-4 last:mb-0"
          >
            {/* Dot on the left border line */}
            <span
              className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: DOT_COLORS[event.color] ?? '#525252' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug" style={{ color: colors.textSecondary }}>
                {event.text}
              </p>
            </div>
            <span className="text-[11px] flex-shrink-0" style={{ color: colors.textTertiary }}>
              {event.time}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
