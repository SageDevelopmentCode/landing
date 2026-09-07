"use client";

import { Fragment, useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  cssColors as colors,
  radius,
  cssShadows as shadows,
} from "../design-system";
import type { Tables } from "../../types/database.types";
import {
  buildProfitAndLoss,
  formatPnlCurrency,
  profitAndLossToCsv,
  type PnlDateRange,
  type StripeTransactionForPnl,
} from "@/app/lib/budget/profit-and-loss";

type BudgetExpense = Tables<{ schema: "budget" }, "expenses">;

const cardStyle = {
  backgroundColor: "white",
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  boxShadow: shadows.soft,
};

const inputStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  padding: "6px 10px",
  fontSize: "14px",
  color: colors.textPrimary,
  backgroundColor: "white",
  outline: "none",
};

const presetBtnStyle = {
  backgroundColor: "transparent",
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  borderRadius: "99px",
  padding: "4px 12px",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
};

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function shiftMonth(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

type ProfitAndLossTabProps = {
  stripeTransactions: StripeTransactionForPnl[];
  expenses: BudgetExpense[];
};

function PnlAmountCell({
  amount,
  bold = false,
  color,
}: {
  amount: number;
  bold?: boolean;
  color?: string;
}) {
  return (
    <td
      className="py-2 px-4 text-right tabular-nums"
      style={{
        fontWeight: bold ? 700 : 400,
        color: color ?? colors.textPrimary,
        fontSize: "13px",
        whiteSpace: "nowrap",
      }}
    >
      {formatPnlCurrency(amount)}
    </td>
  );
}

function PnlLabelCell({
  label,
  bold = false,
  indent = false,
  uppercase = false,
}: {
  label: string;
  bold?: boolean;
  indent?: boolean;
  uppercase?: boolean;
}) {
  return (
    <td
      className="py-2 px-4"
      style={{
        fontWeight: bold ? 700 : 400,
        color: uppercase ? colors.textSecondary : colors.textPrimary,
        fontSize: uppercase ? "11px" : "13px",
        paddingLeft: indent ? "2rem" : undefined,
        textTransform: uppercase ? "uppercase" : undefined,
        letterSpacing: uppercase ? "0.05em" : undefined,
      }}
    >
      {label}
    </td>
  );
}

function SubtotalRow({
  label,
  amount,
  color,
}: {
  label: string;
  amount: number;
  color?: string;
}) {
  return (
    <tr style={{ borderTop: `2px solid ${colors.border}` }}>
      <PnlLabelCell label={label} bold />
      <PnlAmountCell amount={amount} bold color={color} />
    </tr>
  );
}

export function ProfitAndLossTab({
  stripeTransactions,
  expenses,
}: ProfitAndLossTabProps) {
  const [startMonth, setStartMonth] = useState(currentMonthKey);
  const [endMonth, setEndMonth] = useState(currentMonthKey);
  const [activePreset, setActivePreset] = useState<string | null>("this-month");

  const dateRange: PnlDateRange = useMemo(
    () => ({
      startMonth: startMonth <= endMonth ? startMonth : endMonth,
      endMonth: startMonth <= endMonth ? endMonth : startMonth,
    }),
    [startMonth, endMonth],
  );

  const report = useMemo(
    () => buildProfitAndLoss(stripeTransactions, expenses, dateRange),
    [stripeTransactions, expenses, dateRange],
  );

  const netColor = report.netIncome >= 0 ? colors.success : colors.error;

  function applyPreset(
    preset: string,
    range: { startMonth: string; endMonth: string },
  ) {
    setStartMonth(range.startMonth);
    setEndMonth(range.endMonth);
    setActivePreset(preset);
  }

  function handleStartMonthChange(value: string) {
    setStartMonth(value);
    if (value > endMonth) setEndMonth(value);
    setActivePreset(null);
  }

  function handleEndMonthChange(value: string) {
    const nextEnd = value < startMonth ? startMonth : value;
    setEndMonth(nextEnd);
    setActivePreset(null);
  }

  function handleExportCsv() {
    const csv = profitAndLossToCsv(report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `profit-and-loss-${report.rangeKey}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const year = new Date().getFullYear();
  const presets = [
    {
      id: "this-month",
      label: "This month",
      range: { startMonth: currentMonthKey(), endMonth: currentMonthKey() },
    },
    {
      id: "last-3-months",
      label: "Last 3 months",
      range: {
        startMonth: shiftMonth(currentMonthKey(), -2),
        endMonth: currentMonthKey(),
      },
    },
    {
      id: "jun-sep",
      label: "Jun–Sep",
      range: {
        startMonth: `${year}-06`,
        endMonth: `${year}-09`,
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
            From
            <input
              type="month"
              value={startMonth}
              onChange={(e) => handleStartMonthChange(e.target.value)}
              style={{ ...inputStyle, width: "150px" }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
            To
            <input
              type="month"
              value={endMonth}
              onChange={(e) => handleEndMonthChange(e.target.value)}
              style={{ ...inputStyle, width: "150px" }}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id, preset.range)}
                style={{
                  ...presetBtnStyle,
                  backgroundColor:
                    activePreset === preset.id ? colors.mistyForest : "transparent",
                  color:
                    activePreset === preset.id ? "white" : colors.textSecondary,
                  borderColor:
                    activePreset === preset.id ? colors.mistyForest : colors.border,
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "transparent",
            color: colors.textSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.sm,
            padding: "6px 12px",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div style={{ ...cardStyle, padding: "32px", maxWidth: "720px" }}>
        <div className="text-center mb-8">
          <p
            className="text-lg font-bold mb-1"
            style={{ color: colors.textPrimary }}
          >
            Sage Field School
          </p>
          <p
            className="text-base font-semibold mb-1"
            style={{ color: colors.textPrimary }}
          >
            Profit and Loss
          </p>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            {report.dateRange}
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Cash Basis
          </p>
        </div>

        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
              <th
                className="py-2 px-4 text-left"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Account
              </th>
              <th
                className="py-2 px-4 text-right"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <PnlLabelCell label="Income" bold uppercase />
              <td />
            </tr>
            {report.income.lines.length === 0 ? (
              <tr>
                <PnlLabelCell label="No income recorded" indent />
                <PnlAmountCell amount={0} />
              </tr>
            ) : (
              report.income.lines.map((line) => (
                <tr key={line.label}>
                  <PnlLabelCell label={line.label} indent />
                  <PnlAmountCell amount={line.amount} />
                </tr>
              ))
            )}
            <SubtotalRow
              label="Total Income"
              amount={report.income.subtotal}
              color={colors.success}
            />

            <tr>
              <td colSpan={2} className="py-3" />
            </tr>

            <tr>
              <PnlLabelCell label="Expenses" bold uppercase />
              <td />
            </tr>
            {report.expenses.length === 0 ? (
              <tr>
                <PnlLabelCell label="No expenses recorded" indent />
                <PnlAmountCell amount={0} />
              </tr>
            ) : (
              report.expenses.map((section) => (
                <Fragment key={section.title}>
                  <tr>
                    <PnlLabelCell label={section.title} bold indent />
                    <td />
                  </tr>
                  {section.lines.map((line) => (
                    <tr key={`${section.title}-${line.label}`}>
                      <PnlLabelCell label={line.label} indent />
                      <PnlAmountCell amount={line.amount} />
                    </tr>
                  ))}
                </Fragment>
              ))
            )}
            <SubtotalRow
              label="Total Expenses"
              amount={report.totalExpenses}
              color={colors.error}
            />

            <tr>
              <td colSpan={2} className="py-2" />
            </tr>

            <tr
              style={{
                borderTop: `2px solid ${colors.mistyForest}44`,
                backgroundColor: colors.mistyForest + "12",
              }}
            >
              <PnlLabelCell label="Net Income" bold />
              <PnlAmountCell amount={report.netIncome} bold color={netColor} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
