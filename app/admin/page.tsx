import { CountdownCard } from './components/CountdownCard'
import { colors } from './design-system'
import { Plus_Jakarta_Sans } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
})

export default async function AdminDashboard() {
  return (
    <div className="space-y-8 pt-6">
      <div>
        <h1
          className={`text-2xl font-bold ${jakarta.className}`}
          style={{ color: colors.textPrimary }}
        >
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: colors.textTertiary }}>
          Welcome to your Sagefield School admin portal
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CountdownCard
          programName="Summer Program"
          date="2026-05-26"
          accentColor={colors.warning}
          iconBgColor={colors.warningBg}
          delay={0}
        />
        <CountdownCard
          programName="School Year Program"
          date="2026-09-08"
          accentColor={colors.accent}
          iconBgColor={colors.accentLight}
          delay={0.1}
        />
      </div>
    </div>
  )
}
