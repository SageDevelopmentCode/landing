import { cssColors as colors } from "../../design-system";
import {
  categoryBreakdown,
  formatUsd,
  formatUsdCompact,
  sumItems,
} from "../budget-math";
import type { BudgetItem, Scenario } from "../types";
import { Card } from "./ui";

export function CategoryBreakdown({
  items,
  scenario,
  selected,
  onSelect,
}: {
  items: BudgetItem[];
  scenario: Scenario;
  selected: string | null;
  onSelect: (category: string | null) => void;
}) {
  const rows = categoryBreakdown(items, scenario);
  const total = sumItems(items, scenario);
  const scaleMax = Math.max(1, ...rows.map((row) => row.difficult));

  return (
    <Card
      title="Where the money goes"
      subtitle="Work cost by category, before contingency. Click a category to filter the timeline and list."
      action={
        selected ? (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs font-medium cursor-pointer whitespace-nowrap"
            style={{ color: colors.accent }}
          >
            Show all
          </button>
        ) : null
      }
    >
      <div className="space-y-1">
        {rows.map((row) => {
          const share = total > 0 ? (row.amount / total) * 100 : 0;
          const dimmed = selected !== null && selected !== row.category;
          const isSelected = selected === row.category;
          return (
            <button
              key={row.category}
              type="button"
              onClick={() => onSelect(isSelected ? null : row.category)}
              className="w-full text-left rounded-lg px-2 py-2 transition-all cursor-pointer"
              style={{
                opacity: dimmed ? 0.4 : 1,
                backgroundColor: isSelected ? colors.elevated : "transparent",
              }}
              title={`Range ${formatUsd(row.favorable)} – ${formatUsd(row.difficult)}`}
            >
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  {row.category}
                  <span
                    className="text-xs font-normal"
                    style={{ color: colors.textTertiary }}
                  >
                    {row.count} {row.count === 1 ? "item" : "items"}
                  </span>
                </span>
                <span className="flex items-baseline gap-2 tabular-nums">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    {formatUsd(row.amount)}
                  </span>
                  <span
                    className="text-xs w-10 text-right"
                    style={{ color: colors.textTertiary }}
                  >
                    {share.toFixed(0)}%
                  </span>
                </span>
              </div>
              <div
                className="relative h-3 rounded-full"
                style={{ backgroundColor: colors.elevated }}
              >
                <div
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${(row.favorable / scaleMax) * 100}%`,
                    width: `${((row.difficult - row.favorable) / scaleMax) * 100}%`,
                    backgroundColor: `${row.color}2E`,
                  }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                  style={{
                    width: `${(row.amount / scaleMax) * 100}%`,
                    backgroundColor: row.color,
                  }}
                />
                {row.spent > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${(Math.min(row.spent, scaleMax) / scaleMax) * 100}%`,
                      backgroundImage:
                        "repeating-linear-gradient(135deg, rgba(0,0,0,0.28) 0 3px, transparent 3px 6px)",
                    }}
                  />
                )}
              </div>
              <div
                className="flex justify-between mt-1 text-[11px] tabular-nums"
                style={{ color: colors.textQuaternary }}
              >
                <span>
                  {row.spent > 0 ? `${formatUsdCompact(row.spent)} spent` : ""}
                </span>
                <span>
                  {formatUsdCompact(row.favorable)} – {formatUsdCompact(row.difficult)} range
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 text-[11px]"
        style={{ borderTop: `1px solid ${colors.border}`, color: colors.textTertiary }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-5 rounded-full"
            style={{ backgroundColor: colors.textTertiary }}
          />
          Selected scenario
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-5 rounded-full"
            style={{ backgroundColor: colors.border }}
          />
          Favorable to difficult range
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-5 rounded-full"
            style={{
              backgroundColor: colors.textTertiary,
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(0,0,0,0.35) 0 3px, transparent 3px 6px)",
            }}
          />
          Actually spent
        </span>
      </div>
    </Card>
  );
}
