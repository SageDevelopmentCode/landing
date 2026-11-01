import type { ReactNode } from "react";
import { CalendarCheck, CheckCircle2, PiggyBank, Wallet } from "lucide-react";
import { cssColors as colors, cssShadows as shadows } from "../../design-system";
import {
  SCENARIOS,
  formatShortDate,
  formatUsd,
  itemsInBudget,
  openingWeek,
  scenarioTotals,
  sumSpent,
  weekEndDate,
} from "../budget-math";
import type {
  BudgetItem,
  ProjectSettings,
  Scenario,
  TimelinePhase,
} from "../types";
import { ProgressBar } from "./ui";

function StatCard({
  icon,
  label,
  value,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.soft,
      }}
    >
      <div
        className="flex items-center gap-2 text-xs font-medium"
        style={{ color: colors.textTertiary }}
      >
        <span style={{ color: colors.accent }}>{icon}</span>
        {label}
      </div>
      <div
        className="text-2xl font-semibold tabular-nums"
        style={{ color: colors.textPrimary }}
      >
        {value}
      </div>
      {children}
    </div>
  );
}

export function SummaryCards({
  items,
  phases,
  settings,
  scenario,
}: {
  items: BudgetItem[];
  phases: TimelinePhase[];
  settings: ProjectSettings;
  scenario: Scenario;
}) {
  const totals = scenarioTotals(items, settings, scenario);
  const active = itemsInBudget(items);
  const spent = sumSpent(items);
  const excludedCount = items.length - active.length;
  const done = active.filter((item) => item.status === "done").length;
  const inProgress = active.filter(
    (item) => item.status === "in_progress",
  ).length;
  const openWeek = openingWeek(phases);
  const openDate = weekEndDate(settings.projectStartDate, openWeek);
  const scenarioLabel = SCENARIOS.find((s) => s.id === scenario)?.label;
  const remaining = totals.total - spent;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        icon={<Wallet className="w-4 h-4" />}
        label={`Total budget · ${scenarioLabel}`}
        value={formatUsd(totals.total)}
      >
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          {formatUsd(totals.subtotal)} work +{" "}
          {formatUsd(totals.contingency)} contingency (
          {Math.round(totals.rate * 100)}%)
          {excludedCount > 0
            ? ` · ${excludedCount} item${excludedCount === 1 ? "" : "s"} excluded`
            : ""}
        </p>
      </StatCard>

      <StatCard
        icon={<PiggyBank className="w-4 h-4" />}
        label="Spent so far"
        value={formatUsd(spent)}
      >
        <ProgressBar value={spent} max={totals.total} color={colors.chart[0]} />
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          {remaining >= 0
            ? `${formatUsd(remaining)} left of total budget`
            : `${formatUsd(-remaining)} over total budget`}
        </p>
      </StatCard>

      <StatCard
        icon={<CheckCircle2 className="w-4 h-4" />}
        label="Work items done"
        value={`${done} of ${active.length}`}
      >
        <ProgressBar
          value={done}
          max={Math.max(active.length, 1)}
          color="#22C55E"
        />
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          {inProgress} in progress
          {excludedCount > 0
            ? ` · ${excludedCount} excluded from budget`
            : ""}
        </p>
      </StatCard>

      <StatCard
        icon={<CalendarCheck className="w-4 h-4" />}
        label="Target opening"
        value={formatShortDate(openDate, true)}
      >
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          End of week {openWeek}, after move-in and rehearsal
        </p>
      </StatCard>
    </div>
  );
}
