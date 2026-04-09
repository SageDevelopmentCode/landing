'use client'

import { motion } from 'framer-motion'
import { colors } from '../design-system'

interface ProgressRingProps {
  value: number
  label: string
  sublabel?: string
  size?: number
  strokeWidth?: number
  color?: string
  delay?: number
}

export function ProgressRing({
  value,
  label,
  sublabel,
  size = 56,
  strokeWidth = 5,
  color = colors.accent,
  delay = 0,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(value, 100) / 100)

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colors.border}
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay, ease: 'easeOut' }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold tabular-nums"
            style={{ fontSize: size < 60 ? '11px' : '14px', color: colors.textPrimary }}
          >
            {value}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{label}</p>
        {sublabel && (
          <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{sublabel}</p>
        )}
      </div>
    </div>
  )
}
