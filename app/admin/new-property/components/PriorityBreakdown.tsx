import { cssColors as colors } from "../../design-system";
import {
  POWERED_GATES_UPGRADE_USD,
  formatUsd,
  openingPackages,
  priorityBreakdown,
  sumItems,
} from "../budget-math";
import type { BudgetItem, ProjectSettings, Scenario } from "../types";
import { Card } from "./ui";

export function PriorityBreakdown({
  items,
  settings,
  scenario,
}: {
  items: BudgetItem[];
  settings: ProjectSettings;
  scenario: Scenario;
}) {
  const groups = priorityBreakdown(items, scenario);
  const total = sumItems(items, scenario);
  const packages = openingPackages(items, settings, scenario);
  const packageMax = Math.max(1, ...packages.map((p) => p.total));
  const gatesWithContingency = Math.round(
    POWERED_GATES_UPGRADE_USD * (1 + settings.contingency[scenario]),
  );

  return (
    <Card
      title="What has to happen before opening"
      subtitle="Work cost by priority, before contingency"
      className="h-full"
    >
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {groups.map((group) =>
          group.amount > 0 ? (
            <div
              key={group.code}
              className="h-full transition-all duration-300"
              style={{
                width: `${(group.amount / Math.max(total, 1)) * 100}%`,
                backgroundColor: group.color,
              }}
              title={`${group.label}: ${formatUsd(group.amount)}`}
            />
          ) : null,
        )}
      </div>

      <ul className="mt-4 space-y-2.5">
        {groups.map((group) => (
          <li key={group.code} className="flex items-start gap-2.5">
            <span
              className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[11px] font-bold text-white"
              style={{ backgroundColor: group.color }}
            >
              {group.code}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {group.label}
                </span>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: colors.textPrimary }}
                >
                  {formatUsd(group.amount)}
                </span>
              </div>
              <p className="text-xs" style={{ color: colors.textTertiary }}>
                {group.description} · {group.count}{" "}
                {group.count === 1 ? "item" : "items"} ·{" "}
                {total > 0 ? Math.round((group.amount / total) * 100) : 0}%
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
        <h3
          className="text-[11px] font-semibold uppercase tracking-wider mb-3"
          style={{ color: colors.textTertiary }}
        >
          How much to open? (with contingency)
        </h3>
        <div className="space-y-2.5">
          {packages.map((pkg, i) => (
            <div key={pkg.label}>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span
                  className="text-xs font-medium"
                  style={{ color: colors.textPrimary }}
                  title={pkg.detail}
                >
                  {pkg.label}
                </span>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: colors.textPrimary }}
                >
                  {formatUsd(pkg.total)}
                </span>
              </div>
              <div
                className="h-2 rounded-full"
                style={{ backgroundColor: colors.elevated }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(pkg.total / packageMax) * 100}%`,
                    backgroundColor: colors.chart[0],
                    opacity: 1 - i * 0.18,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px]" style={{ color: colors.textTertiary }}>
          Optional: powered gates instead of manual adds{" "}
          {formatUsd(gatesWithContingency)}. Packages are illustrative, not a
          validated opening minimum.
        </p>
      </div>
    </Card>
  );
}
