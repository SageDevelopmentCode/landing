// admin-2: Dark Professional Design System
// Inspired by Linear, Vercel, Raycast

export const colors = {
  bg:           '#0D0D0D',
  surface:      '#141414',
  elevated:     '#1A1A1A',
  border:       '#262626',
  borderHover:  '#333333',

  accent:       '#7C3AED',
  accentBright: '#8B5CF6',
  accentGlow:   'rgba(124, 58, 237, 0.15)',

  textPrimary:   '#F5F5F5',
  textSecondary: '#A3A3A3',
  textTertiary:  '#525252',
  textInverse:   '#0D0D0D',

  success:     '#22C55E',
  successBg:   'rgba(34, 197, 94, 0.08)',
  warning:     '#F59E0B',
  warningBg:   'rgba(245, 158, 11, 0.08)',
  danger:      '#EF4444',
  dangerBg:    'rgba(239, 68, 68, 0.08)',
  info:        '#38BDF8',
  infoBg:      'rgba(56, 189, 248, 0.08)',

  chart: ['#7C3AED', '#38BDF8', '#22C55E', '#F59E0B', '#EF4444', '#EC4899'],
} as const

export const shadows = {
  card:     '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
  elevated: '0 4px 16px rgba(0,0,0,0.5)',
  glow:     '0 0 0 1px rgba(124,58,237,0.4), 0 0 20px rgba(124,58,237,0.1)',
} as const

export const radius = {
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  full: '9999px',
} as const
