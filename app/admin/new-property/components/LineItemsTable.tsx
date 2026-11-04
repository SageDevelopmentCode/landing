"use client";

import { useMemo } from "react";
import { Pencil } from "lucide-react";
import { cssColors as colors, radius } from "../../design-system";
import {
  PRIORITIES,
  STATUSES,
  STATUS_ORDER,
  categoryColor,
  formatUsd,
  formatWeekRange,
  itemAmount,
  sumItems,
  sumSpent,
} from "../budget-math";
import type { BudgetItem, ItemStatus, Scenario } from "../types";
import { Card, Pill, ProgressBar } from "./ui";

export function LineItemsTable({
  items,
  categories,
  scenario,
  projectStartDate,
  categoryFilter,
  onCategoryFilterChange,
  onEdit,
  onStatusChange,
  onIncludedChange,
}: {
  items: BudgetItem[];
  categories: string[];
  scenario: Scenario;
  projectStartDate: string;
  categoryFilter: string | null;
  onCategoryFilterChange: (category: string | null) => void;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: ItemStatus) => void;
  onIncludedChange: (id: string, includedInBudget: boolean) => void;
}) {
  const groups = useMemo(() => {
    const visible = categoryFilter
      ? items.filter((item) => item.category === categoryFilter)
      : items;
    return categories
      .map((category) => ({
        category,
        items: visible.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [items, categories, categoryFilter]);

  return (
    <Card
      title="Line items"
      subtitle="Turn off Include to keep a line item but remove it from totals. Estimates use the selected scenario."
      action={
        <select
          value={categoryFilter ?? ""}
          onChange={(e) => onCategoryFilterChange(e.target.value || null)}
          className="text-xs px-2 py-1.5 outline-none cursor-pointer"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            color: colors.textPrimary,
          }}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      }
    >
      <div className="overflow-x-auto -mx-5">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr
              className="text-left text-[11px] uppercase tracking-wider"
              style={{ color: colors.textTertiary }}
            >
              <th className="font-semibold py-2 pl-5 pr-1 w-14 text-center">
                Include
              </th>
              <th className="font-semibold py-2 pr-2">Item</th>
              <th className="font-semibold py-2 px-2">Priority</th>
              <th className="font-semibold py-2 px-2">When</th>
              <th className="font-semibold py-2 px-2 text-right">Estimate</th>
              <th className="font-semibold py-2 px-2 w-44">Spent</th>
              <th className="font-semibold py-2 px-2">Status</th>
              <th className="py-2 pl-2 pr-5" />
            </tr>
          </thead>
          {groups.map((group) => {
            const groupTotal = sumItems(group.items, scenario);
            const groupSpent = sumSpent(group.items);
            return (
              <tbody key={group.category}>
                <tr style={{ backgroundColor: colors.elevated }}>
                  <td className="py-2 pl-5" />
                  <td colSpan={3} className="py-2 pr-2">
                    <span
                      className="flex items-center gap-2 text-xs font-semibold"
                      style={{ color: colors.textPrimary }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: categoryColor(group.category) }}
                      />
                      {group.category}
                    </span>
                  </td>
                  <td
                    className="py-2 px-2 text-right text-xs font-semibold tabular-nums"
                    style={{ color: colors.textPrimary }}
                  >
                    {formatUsd(groupTotal)}
                  </td>
                  <td
                    className="py-2 px-2 text-xs tabular-nums"
                    style={{ color: colors.textSecondary }}
                  >
                    {groupSpent > 0 ? formatUsd(groupSpent) : ""}
                  </td>
                  <td colSpan={2} />
                </tr>
                {group.items.map((item) => {
                  const amount = itemAmount(item, scenario);
                  const priority = PRIORITIES[item.priorityCode];
                  const status = STATUSES[item.status];
                  const excluded = !item.includedInBudget;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onEdit(item.id)}
                      className="cursor-pointer transition-colors hover:bg-[var(--admin-elevated)]"
                      style={{
                        borderTop: `1px solid ${colors.border}`,
                        opacity: excluded ? 0.55 : 1,
                      }}
                    >
                      <td
                        className="py-2.5 pl-5 pr-1 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={item.includedInBudget}
                          onChange={(e) =>
                            onIncludedChange(item.id, e.target.checked)
                          }
                          aria-label={`Include ${item.code} in budget totals`}
                          className="h-4 w-4 cursor-pointer accent-[var(--admin-accent)]"
                        />
                      </td>
                      <td className="py-2.5 pr-2 max-w-[320px]">
                        <div
                          className="font-medium truncate flex items-center gap-2 flex-wrap"
                          style={{ color: colors.textPrimary }}
                        >
                          <span
                            className="text-xs"
                            style={{ color: colors.textTertiary }}
                          >
                            {item.code}
                          </span>
                          {excluded && (
                            <Pill color={colors.textTertiary}>Excluded</Pill>
                          )}
                          <span className="truncate">{item.scope}</span>
                        </div>
                        {item.notes && (
                          <div
                            className="text-xs truncate"
                            style={{ color: colors.textTertiary }}
                          >
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap"
                          style={{ color: colors.textSecondary }}
                        >
                          <span
                            className="flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: priority.color }}
                          >
                            {item.priorityCode}
                          </span>
                          {priority.label}
                        </span>
                      </td>
                      <td
                        className="py-2.5 px-2 text-xs whitespace-nowrap"
                        style={{ color: colors.textSecondary }}
                      >
                        {formatWeekRange(
                          projectStartDate,
                          item.startWeek,
                          item.endWeek,
                        )}
                        <div style={{ color: colors.textQuaternary }}>
                          Weeks {item.startWeek}–{item.endWeek}
                        </div>
                      </td>
                      <td
                        className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap"
                        style={{ color: colors.textPrimary }}
                      >
                        <span
                          className={excluded ? "line-through opacity-60" : "font-semibold"}
                        >
                          {formatUsd(amount)}
                        </span>
                        {excluded && (
                          <div
                            className="text-[10px] font-normal"
                            style={{ color: colors.textTertiary }}
                          >
                            not in total
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <div
                          className="text-xs tabular-nums mb-1"
                          style={{
                            color:
                              item.actualSpentUsd > amount && amount > 0
                                ? colors.error
                                : colors.textSecondary,
                          }}
                        >
                          {item.actualSpentUsd > 0
                            ? `${formatUsd(item.actualSpentUsd)} of ${formatUsd(amount)}`
                            : "—"}
                        </div>
                        {item.actualSpentUsd > 0 && (
                          <ProgressBar
                            value={item.actualSpentUsd}
                            max={amount}
                            color={colors.chart[0]}
                            height={4}
                          />
                        )}
                      </td>
                      <td
                        className="py-2.5 px-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={item.status}
                          onChange={(e) =>
                            onStatusChange(item.id, e.target.value as ItemStatus)
                          }
                          aria-label={`Status for ${item.code}`}
                          className="text-xs font-medium pl-2 pr-1 py-1 outline-none cursor-pointer"
                          style={{
                            backgroundColor: `${status.color}1F`,
                            border: `1px solid ${status.color}55`,
                            borderRadius: radius.full,
                            color: status.color,
                          }}
                        >
                          {STATUS_ORDER.map((value) => (
                            <option key={value} value={value}>
                              {STATUSES[value].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 pl-2 pr-5">
                        <Pencil
                          className="w-3.5 h-3.5"
                          style={{ color: colors.textQuaternary }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
    </Card>
  );
}
