import { CountdownCard } from './components/CountdownCard'
import { colors } from './design-system'
import { Merriweather } from 'next/font/google'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
})

export default async function AdminDashboard() {
  return (
    <div className="space-y-8 pt-6">
      <div>
        <h1
          className={`text-3xl font-bold ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          Dashboard
        </h1>
        <p className="mt-2" style={{ color: colors.textSecondary }}>
          Welcome to your Sagefield School admin dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <CountdownCard
          programName="Summer Program"
          date="2026-05-26"
          accentColor={colors.warningText}
          iconBgColor={colors.paleMarigold}
          delay={0}
        />
        <CountdownCard
          programName="School Year Program"
          date="2026-09-08"
          accentColor={colors.infoText}
          iconBgColor={colors.powderBlue}
          delay={0.1}
        />
      </div>
    </div>
  )
}
