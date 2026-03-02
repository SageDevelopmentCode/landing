// Nature-Inspired Design System for Sagefield School Admin Portal
// Blend of Notion simplicity, Stripe clarity, and organic warmth

export const colors = {
  // Primary Palette - Soft Pastels
  pastelSage: '#BFD8C0',
  mistyForest: '#5E7C68',
  warmLinen: '#F6F1E8',
  softCloud: '#FBFAF7',

  // Secondary / Accent Pastels
  dustyRose: '#E6B7B2',
  powderBlue: '#C7DBE6',
  paleMarigold: '#F6DFA6',
  lightClay: '#EBC5A3',

  // Functional Colors (Muted)
  success: '#CDE8D0',
  successText: '#4A7C59',
  warning: '#F5E3B3',
  warningText: '#8B7355',
  error: '#F2C6C6',
  errorText: '#A55858',
  info: '#D6EAF5',
  infoText: '#5B7C8F',

  // Neutral Tones
  textPrimary: '#3D3D3D',
  textSecondary: '#6B6B6B',
  textTertiary: '#9B9B9B',
  border: '#E8E4DF',
  divider: '#F0EDE8',
} as const

export const shadows = {
  soft: '0 2px 8px rgba(94, 124, 104, 0.08)',
  medium: '0 4px 16px rgba(94, 124, 104, 0.12)',
  large: '0 8px 24px rgba(94, 124, 104, 0.15)',
  inner: 'inset 0 2px 4px rgba(94, 124, 104, 0.06)',
} as const

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
} as const

export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const

export const transitions = {
  fast: '150ms ease-out',
  base: '200ms ease-out',
  slow: '300ms ease-out',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

export const animations = {
  fadeIn: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
} as const
