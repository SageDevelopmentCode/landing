import { colors } from '../design-system'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div
      className="flex items-center justify-between pb-5 mb-6"
      style={{ borderBottom: `1px solid ${colors.border}` }}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: colors.textPrimary }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: colors.textTertiary }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
