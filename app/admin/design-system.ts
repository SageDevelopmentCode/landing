// Dark Professional Design System for Sage Field School Admin Portal
// admin-2 scheme with sage green accent instead of purple

export const colors = {
  // Background & Surface
  bg:           '#0D0D0D',
  surface:      '#141414',
  elevated:     '#1A1A1A',
  border:       '#262626',
  borderStrong: '#333333',
  borderHover:  '#333333',

  // Primary Accent (Sage Green — replaces admin-2 violet)
  accent:      '#5E7C68',
  accentBright: '#6E9478',
  accentLight: 'rgba(94, 124, 104, 0.15)',
  accentMid:   '#BFD8C0',
  accentDark:  '#4A6354',
  accentGlow:  'rgba(94, 124, 104, 0.15)',

  // Text
  textPrimary:    '#F5F5F5',
  textSecondary:  '#A3A3A3',
  textTertiary:   '#525252',
  textQuaternary: '#404040',
  textInverse:    '#0D0D0D',

  // Status Colors
  success:       '#22C55E',
  successText:   '#FFFFFF',
  successBg:     'rgba(34, 197, 94, 0.08)',
  successBorder: 'rgba(34, 197, 94, 0.25)',

  warning:       '#F59E0B',
  warningText:   '#FFFFFF',
  warningBg:     'rgba(245, 158, 11, 0.08)',
  warningBorder: 'rgba(245, 158, 11, 0.25)',

  error:         '#EF4444',
  errorText:     '#FFFFFF',
  errorBg:       'rgba(239, 68, 68, 0.08)',
  errorBorder:   'rgba(239, 68, 68, 0.25)',

  danger:    '#EF4444',
  dangerBg:  'rgba(239, 68, 68, 0.08)',

  info:      '#38BDF8',
  infoText:  '#FFFFFF',
  infoBg:    'rgba(56, 189, 248, 0.08)',
  infoBorder:'rgba(56, 189, 248, 0.25)',

  // Purple (sage green in this theme)
  purple:       '#5E7C68',
  purpleBg:     'rgba(94, 124, 104, 0.08)',
  purpleBorder: 'rgba(94, 124, 104, 0.25)',

  // Legacy aliases (keep for pages still referencing old token names)
  pastelSage:   'rgba(94, 124, 104, 0.15)',  // accentLight
  mistyForest:  '#5E7C68',                   // accent
  warmLinen:    '#1A1A1A',                   // elevated
  softCloud:    '#0D0D0D',                   // bg
  dustyRose:    'rgba(239, 68, 68, 0.08)',   // errorBg
  powderBlue:   'rgba(56, 189, 248, 0.08)',  // infoBg
  paleMarigold: 'rgba(245, 158, 11, 0.08)',  // warningBg
  lightClay:    'rgba(94, 124, 104, 0.08)',  // purpleBg
  divider:      '#262626',                   // border

  chart: ['#5E7C68', '#38BDF8', '#22C55E', '#F59E0B', '#EF4444', '#EC4899'],
} as const

export const shadows = {
  soft:     '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
  card:     '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
  medium:   '0 4px 16px rgba(0,0,0,0.5)',
  large:    '0 8px 32px rgba(0,0,0,0.6)',
  elevated: '0 4px 16px rgba(0,0,0,0.5)',
  glow:     '0 0 0 1px rgba(94,124,104,0.4), 0 0 20px rgba(94,124,104,0.1)',
  focus:    '0 0 0 3px rgba(94,124,104,0.3)',
  inner:    'inset 0 1px 2px rgba(0,0,0,0.3)',
} as const

export const radius = {
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  full: '9999px',
} as const

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const

export const transitions = {
  fast:   '150ms ease-out',
  base:   '200ms ease-out',
  slow:   '300ms ease-out',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

// CSS-variable-based tokens — use these so components respond to the
// data-admin-theme attribute toggled by ThemeProvider.
export const cssColors = {
  bg:              'var(--admin-bg)',
  surface:         'var(--admin-surface)',
  elevated:        'var(--admin-elevated)',
  border:          'var(--admin-border)',
  borderStrong:    'var(--admin-border-strong)',
  borderHover:     'var(--admin-border-hover)',
  accent:          'var(--admin-accent)',
  accentBright:    'var(--admin-accent-bright)',
  accentLight:     'var(--admin-accent-light)',
  accentMid:       'var(--admin-accent-mid)',
  accentDark:      'var(--admin-accent-dark)',
  accentGlow:      'var(--admin-accent-glow)',
  textPrimary:     'var(--admin-text-primary)',
  textSecondary:   'var(--admin-text-secondary)',
  textTertiary:    'var(--admin-text-tertiary)',
  textQuaternary:  'var(--admin-text-quaternary)',
  textInverse:     'var(--admin-text-inverse)',
  success:         'var(--admin-success)',
  successText:     'var(--admin-success-text)',
  successBg:       'var(--admin-success-bg)',
  successBorder:   'var(--admin-success-border)',
  warning:         'var(--admin-warning)',
  warningText:     'var(--admin-warning-text)',
  warningBg:       'var(--admin-warning-bg)',
  warningBorder:   'var(--admin-warning-border)',
  error:           'var(--admin-error)',
  errorText:       'var(--admin-error-text)',
  errorBg:         'var(--admin-error-bg)',
  errorBorder:     'var(--admin-error-border)',
  danger:          'var(--admin-danger)',
  dangerBg:        'var(--admin-danger-bg)',
  info:            'var(--admin-info)',
  infoText:        'var(--admin-info-text)',
  infoBg:          'var(--admin-info-bg)',
  infoBorder:      'var(--admin-info-border)',
  purple:          'var(--admin-purple)',
  purpleBg:        'var(--admin-purple-bg)',
  purpleBorder:    'var(--admin-purple-border)',
  // Legacy aliases
  pastelSage:      'var(--admin-accent-light)',
  mistyForest:     'var(--admin-accent)',
  warmLinen:       'var(--admin-elevated)',
  softCloud:       'var(--admin-bg)',
  dustyRose:       'var(--admin-error-bg)',
  powderBlue:      'var(--admin-info-bg)',
  paleMarigold:    'var(--admin-warning-bg)',
  lightClay:       'var(--admin-purple-bg)',
  divider:         'var(--admin-border)',
  // chart stays hardcoded — SVG presentation attrs don't resolve CSS vars in all browsers
  chart: ['#5E7C68', '#38BDF8', '#22C55E', '#F59E0B', '#EF4444', '#EC4899'],
} as const

export const cssShadows = {
  soft:     'var(--admin-shadow-soft)',
  card:     'var(--admin-shadow-soft)',
  medium:   'var(--admin-shadow-medium)',
  large:    'var(--admin-shadow-large)',
  elevated: 'var(--admin-shadow-medium)',
  glow:     '0 0 0 1px var(--admin-accent-glow), 0 0 20px var(--admin-accent-glow)',
  focus:    '0 0 0 3px var(--admin-accent-light)',
  inner:    'inset 0 1px 2px rgba(0,0,0,0.1)',
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
