import { QuickActionsBar } from './components/QuickActionsBar'
import { DashboardWidgets } from './components/DashboardWidgets'
import { getDashboardSnapshot } from '@/app/actions/getDashboardSnapshot'
import { cssColors as colors } from './design-system'

export default async function AdminDashboard() {
  const snapshot = await getDashboardSnapshot()

  return (
    <div className="space-y-8 pt-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: colors.textPrimary }}
        >
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: colors.textTertiary }}>
          Welcome to your Sage Field School admin portal
        </p>
      </div>

      <QuickActionsBar />

      <DashboardWidgets
        initialSnapshot={snapshot}
        programs={[
          { name: "Summer Program",      date: "2026-05-26", accentColor: colors.warning },
          { name: "School Year Program", date: "2026-09-08", accentColor: colors.accent  },
        ]}
      />
    </div>
  )
}
