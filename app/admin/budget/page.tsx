"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { Poppins } from "next/font/google";
import {
  cssColors as colors,
  radius,
  cssShadows as shadows,
} from "../design-system";
import type { Tables } from "../../types/database.types";
type BudgetLineItem = Tables<{ schema: "budget" }, "line_items">;
type BudgetExpense = Tables<{ schema: "budget" }, "expenses">;
type BudgetIncome = Tables<{ schema: "budget" }, "income">;
import { Table, TableRow, TableCell } from "../components/Table";
import { DetailSidebar } from "../components/DetailSidebar";
import {
  MercuryDetailSidebar,
  type MercuryTransaction,
} from "../components/MercuryDetailSidebar";
import { IncomeDetailSidebar } from "../components/IncomeDetailSidebar";
import {
  TransactionDetailSidebar,
  formatPaymentType,
  formatCents,
} from "../components/TransactionDetailSidebar";
import { getStripeTransactions } from "@/app/actions/getStripeTransactions";
import { Upload, Trash2, FileText, Download, X } from "lucide-react";
import { uploadExpenseReceipt } from "@/app/actions/uploadExpenseReceipt";
import { deleteExpenseReceipt } from "@/app/actions/deleteExpenseReceipt";
import { listExpenseReceipts } from "@/app/actions/listExpenseReceipts";
import { getExpenseReceiptUrl } from "@/app/actions/getExpenseReceiptUrl";
import { fetchBudgetStudents } from "@/app/actions/fetchBudgetStudents";
import { fetchBudgetParents } from "@/app/actions/fetchBudgetParents";
import type { FileObject } from "@supabase/storage-js";

type StripeTransaction = {
  id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_type: string;
  status: string;
  amount_cents: number;
  intended_amount_cents: number | null;
  currency: string;
  cover_fees: boolean | null;
  payer_name: string | null;
  payer_email: string | null;
  description: string | null;
  student_id: string | null;
  application_id: string | null;
  parent_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  is_deleted: boolean;
  exclude_from_revenue: boolean;
};

const merriweather = Poppins({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

const TABS = [
  "Overview",
  "Budget",
  "Expenses",
  "Revenue",
  "Taxes",
  "Analysis",
  "Summer Program Analysis",
  "Mercury",
] as const;
type Tab = (typeof TABS)[number];

const CATEGORIES = [
  // Income-related
  "Tuition",
  "Donations",
  // Personnel
  "Teacher Pay",
  "Staff Pay",
  "Contractor / 1099",
  "Payroll Taxes",
  // Facilities
  "Rent",
  "Utilities",
  "Maintenance & Repairs",
  "Furniture & Equipment",
  // Program
  "Supplies & Materials",
  "Curriculum",
  "Field Trips",
  "Technology & Software",
  // Operations
  "Insurance",
  "Marketing",
  "Professional Services",
  "Administrative",
  // Other
  "Savings",
  "Other",
];

const CATEGORY_EMOJI: Record<string, string> = {
  Tuition: "🎓",
  Donations: "🎁",
  "Teacher Pay": "👩‍🏫",
  "Staff Pay": "👥",
  "Contractor / 1099": "🔧",
  "Payroll Taxes": "📋",
  Rent: "🏠",
  Utilities: "💡",
  "Maintenance & Repairs": "🛠️",
  "Furniture & Equipment": "🪑",
  "Supplies & Materials": "📦",
  Curriculum: "📚",
  "Field Trips": "🚌",
  "Technology & Software": "💻",
  Insurance: "🛡️",
  Marketing: "📣",
  "Professional Services": "💼",
  Administrative: "📁",
  Savings: "🏦",
  Other: "📎",
};

// ─── Reusable styles ────────────────────────────────────────────────────────

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
  width: "100%",
};

const btnPrimary = {
  backgroundColor: colors.mistyForest,
  color: "white",
  border: "none",
  borderRadius: radius.sm,
  padding: "7px 14px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const btnGhost = {
  backgroundColor: "transparent",
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  padding: "6px 12px",
  fontSize: "13px",
  cursor: "pointer",
};

const btnDanger = {
  backgroundColor: colors.error,
  color: "#ffffff",
  border: "none",
  borderRadius: radius.sm,
  padding: "6px 10px",
  fontSize: "12px",
  cursor: "pointer",
};

// ─── Mini Stat Card ──────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  color,
  delay = 0,
}: {
  label: string;
  value: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      style={{ ...cardStyle, padding: "20px 24px" }}
    >
      <p
        className="text-xs font-medium mb-1"
        style={{ color: colors.textSecondary }}
      >
        {label}
      </p>
      <p className="text-2xl font-semibold" style={{ color }}>
        {value}
      </p>
    </motion.div>
  );
}

// ─── Category Budget Rings ───────────────────────────────────────────────────

const RING_R = 36;
const RING_CIRC = 2 * Math.PI * RING_R;

function CategoryBudgetRings({
  lineItems,
  monthExpenses,
}: {
  lineItems: BudgetLineItem[];
  monthExpenses: BudgetExpense[];
}) {
  const plannedByCategory = lineItems.reduce<Record<string, number>>(
    (acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + Number(i.planned_amount);
      return acc;
    },
    {},
  );

  const actualByCategory = monthExpenses.reduce<Record<string, number>>(
    (acc, e) => {
      const cat = e.category ?? "Other";
      acc[cat] = (acc[cat] ?? 0) + Number(e.amount);
      return acc;
    },
    {},
  );

  const rows = Object.entries(plannedByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, planned]) => {
      const actual = actualByCategory[cat] ?? 0;
      const variance = planned - actual;
      const pct = planned > 0 ? actual / planned : 0;
      const over = actual > planned;
      return { cat, planned, actual, variance, pct, over };
    });

  if (rows.length === 0) return null;

  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <p
        className="text-sm font-semibold mb-4"
        style={{ color: colors.textPrimary }}
      >
        Budget Usage by Category
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {rows.map((row, i) => {
          const emoji = CATEGORY_EMOJI[row.cat] ?? "💰";
          const clampedPct = Math.min(row.pct, 1);
          const dashLen = clampedPct * RING_CIRC;
          const displayOver = row.cat === "Savings" ? !row.over : row.over;
          const strokeColor = displayOver
            ? colors.error
            : SLICE_COLORS[i % SLICE_COLORS.length];
          const textColor = "#ffffff";
          const bgColor = displayOver ? colors.error : colors.success;

          return (
            <motion.div
              key={row.cat}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              style={{
                ...cardStyle,
                padding: "16px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                textAlign: "center",
              }}
            >
              {/* Ring chart */}
              <div style={{ position: "relative", width: 92, height: 92 }}>
                <svg width={92} height={92}>
                  {/* Track */}
                  <circle
                    cx={46}
                    cy={46}
                    r={RING_R}
                    fill="none"
                    stroke={colors.warmLinen}
                    strokeWidth={10}
                  />
                  {/* Over-budget full ring fill */}
                  {row.over && (
                    <circle
                      cx={46}
                      cy={46}
                      r={RING_R}
                      fill="none"
                      stroke={colors.error}
                      strokeWidth={10}
                    />
                  )}
                  {/* Progress arc, starts at 12 o'clock */}
                  <motion.circle
                    cx={46}
                    cy={46}
                    r={RING_R}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={`${dashLen} ${RING_CIRC}`}
                    strokeDashoffset={0}
                    transform="rotate(-90 46 46)"
                    initial={{ strokeDasharray: `0 ${RING_CIRC}` }}
                    animate={{ strokeDasharray: `${dashLen} ${RING_CIRC}` }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.04,
                      ease: "easeOut" as const,
                    }}
                  />
                </svg>
                {/* Emoji center */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                  }}
                >
                  {emoji}
                </div>
              </div>

              {/* Category name */}
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: colors.textPrimary,
                  lineHeight: 1.3,
                }}
              >
                {row.cat}
              </p>

              {/* Usage % */}
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: textColor,
                }}
              >
                {(clampedPct * 100).toFixed(0)}%
              </p>

              {/* Planned / Actual */}
              <div
                style={{
                  fontSize: "11px",
                  color: colors.textSecondary,
                  width: "100%",
                }}
              >
                <div className="flex justify-between">
                  <span>Plan</span>
                  <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
                    {fmt(row.planned)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Actual</span>
                  <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
                    {fmt(row.actual)}
                  </span>
                </div>
              </div>

              {/* Over / Under badge */}
              <div
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  borderRadius: radius.sm,
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {row.over
                  ? `▲ ${fmt(Math.abs(row.variance))} over`
                  : `▼ ${fmt(Math.abs(row.variance))} left`}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Revenue vs Expenses Line Chart ──────────────────────────────────────────

function RevenueExpensesLineChart({
  stripeTransactions,
  expenses,
}: {
  stripeTransactions: StripeTransaction[];
  expenses: BudgetExpense[];
}) {
  const PAD = { top: 20, right: 24, bottom: 40, left: 72 };
  const SVG_W = 800;
  const SVG_H = 220;
  const chartW = SVG_W - PAD.left - PAD.right;
  const chartH = SVG_H - PAD.top - PAD.bottom;

  // Collect all months from both data sources
  const monthSet = new Set<string>();
  stripeTransactions.forEach((tx) => monthSet.add(tx.created_at.slice(0, 7)));
  expenses.forEach((e) => monthSet.add(e.expense_date.slice(0, 7)));
  const allMonths = Array.from(monthSet).sort();

  // Need at least 2 points to draw lines
  if (allMonths.length < 2) return null;

  const data = allMonths.map((m) => {
    const revenue = stripeTransactions
      .filter(
        (tx) => !tx.exclude_from_revenue && tx.created_at.slice(0, 7) === m,
      )
      .reduce((s, tx) => {
        const net = tx.cover_fees
          ? (tx.intended_amount_cents ?? tx.amount_cents)
          : tx.amount_cents;
        return s + net / 100;
      }, 0);
    const expenseTotal = expenses
      .filter((e) => e.expense_date.startsWith(m) && e.category !== "Savings")
      .reduce((s, e) => s + Number(e.amount), 0);
    return { month: m, revenue, expenses: expenseTotal };
  });

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.revenue, d.expenses)),
    1,
  );

  const x = (i: number) =>
    allMonths.length > 1
      ? PAD.left + (i / (allMonths.length - 1)) * chartW
      : PAD.left + chartW / 2;

  const y = (val: number) => PAD.top + chartH - (val / maxVal) * chartH;

  const revPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.revenue)}`)
    .join(" ");
  const expPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.expenses)}`)
    .join(" ");

  // Area fill under revenue line back to baseline
  const revArea =
    `M ${x(0)} ${y(data[0].revenue)} ` +
    data
      .slice(1)
      .map((d, i) => `L ${x(i + 1)} ${y(d.revenue)}`)
      .join(" ") +
    ` L ${x(data.length - 1)} ${PAD.top + chartH} L ${x(0)} ${PAD.top + chartH} Z`;

  const fmtMo = (m: string) =>
    new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1).toLocaleString(
      "default",
      {
        month: "short",
      },
    );

  const GRIDLINES = 4;
  const gridVals = Array.from(
    { length: GRIDLINES + 1 },
    (_, i) => (maxVal / GRIDLINES) * i,
  );

  const fmtShort = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
    return `$${n.toFixed(0)}`;
  };

  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-sm font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Revenue vs. Expenses
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: colors.success,
              }}
            />
            <span style={{ fontSize: "12px", color: colors.textSecondary }}>
              Revenue
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: colors.error,
              }}
            />
            <span style={{ fontSize: "12px", color: colors.textSecondary }}>
              Expenses
            </span>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.success} stopOpacity={0.18} />
            <stop offset="100%" stopColor={colors.success} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Gridlines + Y-axis labels */}
        {gridVals.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              y1={y(v)}
              x2={PAD.left + chartW}
              y2={y(v)}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <text
              x={PAD.left - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize={10}
              fill={colors.textSecondary}
            >
              {fmtShort(v)}
            </text>
          </g>
        ))}

        {/* Revenue area fill */}
        <path d={revArea} fill="url(#revGrad)" />

        {/* Expense line */}
        <motion.path
          d={expPath}
          fill="none"
          stroke={colors.error}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
        />

        {/* Revenue line (drawn on top) */}
        <motion.path
          d={revPath}
          fill="none"
          stroke={colors.success}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.1 }}
        />

        {/* Dots */}
        {data.map((d, i) => (
          <g key={d.month}>
            <circle cx={x(i)} cy={y(d.revenue)} r={4} fill={colors.success} />
            <circle cx={x(i)} cy={y(d.expenses)} r={4} fill={colors.error} />
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={d.month}
            x={x(i)}
            y={PAD.top + chartH + 18}
            textAnchor="middle"
            fontSize={10}
            fill={colors.textSecondary}
          >
            {fmtMo(d.month)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Revenue Trend ────────────────────────────────────────────────────────────

function RevenueTrend({
  stripeTransactions,
}: {
  stripeTransactions: StripeTransaction[];
}) {
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const data = months.map((m) => {
    const total = stripeTransactions
      .filter(
        (tx) => !tx.exclude_from_revenue && tx.created_at.slice(0, 7) === m,
      )
      .reduce((s, tx) => {
        const net = tx.cover_fees
          ? (tx.intended_amount_cents ?? tx.amount_cents)
          : tx.amount_cents;
        return s + net / 100;
      }, 0);
    return { month: m, total };
  });

  const maxVal = Math.max(...data.map((d) => d.total), 1);

  const fmtMo = (m: string) =>
    new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1).toLocaleString(
      "default",
      { month: "short" },
    );

  const BAR_MAX_PX = 80;

  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <p
        className="text-sm font-semibold mb-4"
        style={{ color: colors.textPrimary }}
      >
        Revenue Trend (6 months)
      </p>

      {/* Amount labels */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
        {data.map((d) => (
          <div
            key={d.month}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "9px",
              color: colors.textSecondary,
              minHeight: "14px",
            }}
          >
            {d.total > 0 ? fmt(d.total) : "—"}
          </div>
        ))}
      </div>

      {/* Bars */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "6px",
          height: `${BAR_MAX_PX}px`,
        }}
      >
        {data.map((d, i) => {
          const barH =
            d.total > 0 ? Math.max((d.total / maxVal) * BAR_MAX_PX, 4) : 0;
          return (
            <motion.div
              key={d.month}
              initial={{ height: 0 }}
              animate={{ height: barH }}
              transition={{
                duration: 0.5,
                delay: i * 0.07,
                ease: "easeOut" as const,
              }}
              style={{
                flex: 1,
                borderRadius: "4px 4px 0 0",
                backgroundColor: colors.mistyForest,
              }}
            />
          );
        })}
      </div>

      {/* Baseline */}
      <div
        style={{
          height: "1px",
          backgroundColor: colors.border,
          marginBottom: "4px",
        }}
      />

      {/* Month labels */}
      <div style={{ display: "flex", gap: "6px" }}>
        {data.map((d) => (
          <div
            key={d.month}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "10px",
              color: colors.textSecondary,
            }}
          >
            {fmtMo(d.month)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MonthPicker ─────────────────────────────────────────────────────────────

const MONTH_ABBRS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function MonthPicker({
  value,
  onChange,
  placeholder = "Select month",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const parsed = value
    ? { y: Number(value.slice(0, 4)), m: Number(value.slice(5, 7)) - 1 }
    : null;
  const [viewYear, setViewYear] = React.useState(
    parsed?.y ?? new Date().getFullYear(),
  );

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = parsed ? `${MONTH_ABBRS[parsed.m]} ${parsed.y}` : placeholder;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (parsed) setViewYear(parsed.y);
        }}
        style={{
          ...inputStyle,
          width: "140px",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: parsed ? colors.textPrimary : colors.textSecondary,
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: "10px", color: colors.textSecondary }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 200,
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            boxShadow: shadows.soft,
            padding: "12px",
            minWidth: "200px",
          }}
        >
          {/* Year nav */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: colors.textSecondary,
                fontSize: "14px",
                padding: "2px 6px",
              }}
            >
              ‹
            </button>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: colors.textPrimary,
              }}
            >
              {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: colors.textSecondary,
                fontSize: "14px",
                padding: "2px 6px",
              }}
            >
              ›
            </button>
          </div>
          {/* Month grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "4px",
            }}
          >
            {MONTH_ABBRS.map((abbr, idx) => {
              const isSelected = parsed?.y === viewYear && parsed?.m === idx;
              return (
                <button
                  key={abbr}
                  type="button"
                  onClick={() => {
                    onChange(`${viewYear}-${String(idx + 1).padStart(2, "0")}`);
                    setOpen(false);
                  }}
                  style={{
                    padding: "6px 4px",
                    borderRadius: radius.sm,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected ? colors.accent : "transparent",
                    color: isSelected ? "#fff" : colors.textPrimary,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = colors.accentLight;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "transparent";
                  }}
                >
                  {abbr}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DatePicker ──────────────────────────────────────────────────────────────

function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const parsed = value
    ? {
        y: Number(value.slice(0, 4)),
        m: Number(value.slice(5, 7)) - 1,
        d: Number(value.slice(8, 10)),
      }
    : null;
  const today = new Date();
  const [viewY, setViewY] = React.useState(parsed?.y ?? today.getFullYear());
  const [viewM, setViewM] = React.useState(parsed?.m ?? today.getMonth());

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = parsed
    ? `${MONTH_ABBRS[parsed.m]} ${parsed.d}, ${parsed.y}`
    : "Select date";

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const firstDow = new Date(viewY, viewM, 1).getDay();

  const prevMonth = () => {
    if (viewM === 0) {
      setViewM(11);
      setViewY((y) => y - 1);
    } else setViewM((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewM === 11) {
      setViewM(0);
      setViewY((y) => y + 1);
    } else setViewM((m) => m + 1);
  };

  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "block", width: "100%" }}
    >
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (parsed) {
            setViewY(parsed.y);
            setViewM(parsed.m);
          }
        }}
        style={{
          ...inputStyle,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: parsed ? colors.textPrimary : colors.textSecondary,
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: "10px", color: colors.textSecondary }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 200,
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            boxShadow: shadows.soft,
            padding: "12px",
            minWidth: "220px",
          }}
        >
          {/* Month/year nav */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <button
              type="button"
              onClick={prevMonth}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: colors.textSecondary,
                fontSize: "14px",
                padding: "2px 6px",
              }}
            >
              ‹
            </button>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: colors.textPrimary,
              }}
            >
              {MONTH_ABBRS[viewM]} {viewY}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: colors.textSecondary,
                fontSize: "14px",
                padding: "2px 6px",
              }}
            >
              ›
            </button>
          </div>
          {/* Weekday headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "2px",
              marginBottom: "4px",
            }}
          >
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: "10px",
                  color: colors.textTertiary,
                  padding: "2px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>
          {/* Day grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "2px",
            }}
          >
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                parsed?.y === viewY && parsed?.m === viewM && parsed?.d === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onChange(
                      `${viewY}-${String(viewM + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
                    );
                    setOpen(false);
                  }}
                  style={{
                    padding: "5px 0",
                    borderRadius: radius.sm,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    textAlign: "center",
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected ? colors.accent : "transparent",
                    color: isSelected ? "#fff" : colors.textPrimary,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = colors.accentLight;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "transparent";
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({
  lineItems,
  expenses,
  stripeTransactions,
}: {
  lineItems: BudgetLineItem[];
  expenses: BudgetExpense[];
  stripeTransactions: StripeTransaction[];
}) {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );

  const totalBudget = lineItems.reduce(
    (s, i) => s + Number(i.planned_amount),
    0,
  );

  const monthExpenses = expenses.filter(
    (e) =>
      e.expense_date.startsWith(selectedMonth) && e.category !== "Savings",
  );
  const monthExpensesAll = expenses.filter((e) =>
    e.expense_date.startsWith(selectedMonth),
  );
  const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const monthTransactions = stripeTransactions.filter(
    (tx) => tx.created_at.slice(0, 7) === selectedMonth,
  );
  const totalRevenue = monthTransactions
    .filter((tx) => !tx.exclude_from_revenue)
    .reduce((s, tx) => {
      const net = tx.cover_fees
        ? (tx.intended_amount_cents ?? tx.amount_cents)
        : tx.amount_cents;
      return s + net / 100;
    }, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitColor = netProfit >= 0 ? colors.success : colors.error;

  // All-time totals (unfiltered)
  const allTimeRevenue = stripeTransactions
    .filter((tx) => !tx.exclude_from_revenue)
    .reduce((s, tx) => {
      const net = tx.cover_fees
        ? (tx.intended_amount_cents ?? tx.amount_cents)
        : tx.amount_cents;
      return s + net / 100;
    }, 0);
  const allTimeExpenses = expenses
    .filter((e) => e.category !== "Savings")
    .reduce((s, e) => s + Number(e.amount), 0);
  const allTimeNet = allTimeRevenue - allTimeExpenses;
  const allTimeNetColor = allTimeNet >= 0 ? colors.success : colors.error;

  const monthLabel = new Date(
    Number(selectedMonth.slice(0, 4)),
    Number(selectedMonth.slice(5, 7)) - 1,
  ).toLocaleString("default", { month: "long", year: "numeric" });

  // Category breakdown for budget (used by BudgetPieChart)
  const byCategory = lineItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] =
      (acc[item.category] ?? 0) + Number(item.planned_amount);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Month picker */}
      <div className="flex items-center gap-3">
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Revenue vs Expenses line chart */}
      <RevenueExpensesLineChart
        stripeTransactions={stripeTransactions}
        expenses={expenses}
      />

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat
          label={`Planned Budget · ${monthLabel}`}
          value={fmt(totalBudget)}
          color={colors.textPrimary}
          delay={0}
        />
        <MiniStat
          label={`Actual Expenses · ${monthLabel}`}
          value={fmt(totalExpenses)}
          color={colors.error}
          delay={0.05}
        />
        <MiniStat
          label={`Revenue · ${monthLabel}`}
          value={fmt(totalRevenue)}
          color={colors.success}
          delay={0.1}
        />
        <MiniStat
          label={`Net Profit / Loss · ${monthLabel}`}
          value={fmt(netProfit)}
          color={profitColor}
          delay={0.15}
        />
      </div>

      {/* Category ring charts */}
      <CategoryBudgetRings
        lineItems={lineItems}
        monthExpenses={monthExpensesAll}
      />

      {/* Budget allocation donut + Revenue trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetPieChart byCategory={byCategory} total={totalBudget} />
        <div className="space-y-4">
          <RevenueTrend stripeTransactions={stripeTransactions} />
          {/* P&L Summary — monthly + all-time */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                title: "This Month",
                revenue: totalRevenue,
                expenses: totalExpenses,
                net: netProfit,
                netColor: profitColor,
              },
              {
                title: "All Time",
                revenue: allTimeRevenue,
                expenses: allTimeExpenses,
                net: allTimeNet,
                netColor: allTimeNetColor,
              },
            ].map(({ title, revenue, expenses: exp, net, netColor }) => (
              <div key={title} style={{ ...cardStyle, padding: "16px" }}>
                <p
                  className="text-xs font-semibold mb-3"
                  style={{
                    color: colors.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {title}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>Revenue</span>
                    <span style={{ color: colors.success, fontWeight: 600 }}>
                      {fmt(revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>
                      Expenses
                    </span>
                    <span style={{ color: colors.error, fontWeight: 600 }}>
                      {fmt(exp)}
                    </span>
                  </div>
                  <div
                    className="flex justify-between pt-2 mt-1"
                    style={{
                      borderTop: `1px solid ${colors.border}`,
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ color: colors.textPrimary }}>Net</span>
                    <span style={{ color: netColor }}>
                      {net < 0 ? `-${fmt(Math.abs(net))}` : fmt(net)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget vs. Actual table */}
      <BudgetVsActual lineItems={lineItems} expenses={expenses} />

      {/* Break-even + Tax Reserve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div style={{ ...cardStyle, padding: "24px" }}>
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: colors.textPrimary }}
          >
            Break-even Analysis
          </p>
          <div
            className="space-y-1 text-sm"
            style={{ color: colors.textSecondary }}
          >
            <p>
              At $1,095/mo (Full Enroll 1–4):{" "}
              <strong style={{ color: colors.textPrimary }}>
                {Math.ceil(totalBudget / 1095)} students
              </strong>
            </p>
            <p>
              At $1,195/mo (Primary):{" "}
              <strong style={{ color: colors.textPrimary }}>
                {Math.ceil(totalBudget / 1195)} students
              </strong>
            </p>
            <p>
              At $375/mo (After Care):{" "}
              <strong style={{ color: colors.textPrimary }}>
                {Math.ceil(totalBudget / 375)} students
              </strong>
            </p>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: "24px" }}>
          <p
            className="text-sm font-semibold mb-2"
            style={{ color: colors.textPrimary }}
          >
            Tax Reserve (25% of profit)
          </p>
          <p
            className="text-xl font-semibold"
            style={{ color: colors.warning }}
          >
            {fmt(Math.max(netProfit * 0.25, 0))}
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Set aside monthly from any profit
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Budget Pie Chart ─────────────────────────────────────────────────────────

const SLICE_COLORS = [
  "#5E7C68",
  "#BFD8C0",
  "#E6B7B2",
  "#C7DBE6",
  "#F6DFA6",
  "#EBC5A3",
  "#A8C5DA",
  "#D4B8A8",
];

const RADIUS = 80;
const CIRC = 2 * Math.PI * RADIUS;

function BudgetPieChart({
  byCategory,
  total,
}: {
  byCategory: Record<string, number>;
  total: number;
}) {
  const cx = 110,
    cy = 110;
  const entries = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  let cumulative = 0;
  const slices = entries.map(([cat, val], i) => {
    const pct = total > 0 ? val / total : 0;
    const dashLen = pct * CIRC;
    const offset = CIRC - cumulative - CIRC / 4;
    cumulative += dashLen;
    return {
      cat,
      val,
      pct,
      dashLen,
      offset,
      color: SLICE_COLORS[i % SLICE_COLORS.length],
    };
  });

  if (total === 0) return null;

  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <p
        className="text-sm font-semibold mb-4"
        style={{ color: colors.textPrimary }}
      >
        Budget Breakdown
      </p>
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Donut SVG */}
        <div style={{ flexShrink: 0 }}>
          <svg width={220} height={220}>
            <circle
              cx={cx}
              cy={cy}
              r={RADIUS}
              fill="none"
              stroke={colors.warmLinen}
              strokeWidth={30}
            />
            {slices.map((slice, i) => (
              <motion.circle
                key={slice.cat}
                cx={cx}
                cy={cy}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeWidth={30}
                strokeDasharray={`${slice.dashLen} ${CIRC}`}
                strokeDashoffset={slice.offset}
                initial={{ strokeDasharray: `0 ${CIRC}` }}
                animate={{ strokeDasharray: `${slice.dashLen} ${CIRC}` }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.08,
                  ease: "easeOut" as const,
                }}
              />
            ))}
            <circle cx={cx} cy={cy} r={50} fill="white" />
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill={colors.textPrimary}
            >
              {fmt(total)}
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              fontSize="10"
              fill={colors.textSecondary}
            >
              monthly budget
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3" style={{ minWidth: 0 }}>
          {slices.map((slice) => (
            <div key={slice.cat} className="space-y-1">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: slice.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  className="text-sm flex-1"
                  style={{ color: colors.textSecondary }}
                >
                  {slice.cat}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {fmt(slice.val)}
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: colors.textTertiary,
                    minWidth: 40,
                    textAlign: "right",
                  }}
                >
                  {(slice.pct * 100).toFixed(1)}%
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 99,
                  backgroundColor: colors.warmLinen,
                  overflow: "hidden",
                  marginLeft: 22,
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${slice.pct * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" as const }}
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    backgroundColor: slice.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Budget vs. Actual ────────────────────────────────────────────────────────

function BudgetVsActual({
  lineItems,
  expenses,
}: {
  lineItems: BudgetLineItem[];
  expenses: BudgetExpense[];
}) {
  const [filterMonth, setFilterMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );

  const monthExpenses = expenses.filter((e) =>
    e.expense_date.startsWith(filterMonth),
  );

  const actualByCategory = monthExpenses.reduce<Record<string, number>>(
    (acc, e) => {
      const cat = e.category ?? "Uncategorized";
      acc[cat] = (acc[cat] ?? 0) + Number(e.amount);
      return acc;
    },
    {},
  );

  const plannedByCategory = lineItems.reduce<Record<string, number>>(
    (acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + Number(i.planned_amount);
      return acc;
    },
    {},
  );

  const rows = Object.entries(plannedByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, planned]) => {
      const actual = actualByCategory[cat] ?? 0;
      const variance = planned - actual;
      const pct = planned > 0 ? actual / planned : 0;
      const over = actual > planned;
      return { cat, planned, actual, variance, pct, over };
    });

  const totalPlanned = rows.reduce((s, r) => s + r.planned, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalVariance = totalPlanned - totalActual;

  if (rows.length === 0) return null;

  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-sm font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Budget vs. Actual
        </p>
        <MonthPicker value={filterMonth} onChange={setFilterMonth} />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
              {["Category", "Planned", "Actual", "Variance", "Usage"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left py-2 px-3"
                    style={{
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const displayOver = row.cat === "Savings" ? !row.over : row.over;
              return (
              <tr
                key={row.cat}
                style={{ borderBottom: `1px solid ${colors.border}` }}
              >
                <td className="py-3 px-3" style={{ color: colors.textPrimary }}>
                  {row.cat}
                </td>
                <td
                  className="py-3 px-3"
                  style={{ color: colors.textSecondary }}
                >
                  {fmt(row.planned)}
                </td>
                <td
                  className="py-3 px-3"
                  style={{ color: colors.textSecondary }}
                >
                  {fmt(row.actual)}
                </td>
                <td
                  className="py-3 px-3"
                  style={{
                    color: displayOver ? colors.error : colors.success,
                    fontWeight: 600,
                  }}
                >
                  {displayOver ? "-" : "+"}
                  {fmt(Math.abs(row.variance))}
                  {displayOver && " ⚠"}
                </td>
                <td className="py-3 px-3" style={{ minWidth: "140px" }}>
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        flex: 1,
                        height: "6px",
                        borderRadius: "99px",
                        backgroundColor: colors.warmLinen,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(row.pct, 1) * 100}%`,
                          height: "100%",
                          borderRadius: "99px",
                          backgroundColor: displayOver
                            ? colors.error
                            : SLICE_COLORS[i % SLICE_COLORS.length],
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        color: displayOver ? colors.error : colors.textSecondary,
                        fontSize: "12px",
                        minWidth: "38px",
                        textAlign: "right",
                      }}
                    >
                      {(row.pct * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: colors.warmLinen }}>
              <td
                className="py-3 px-3 font-bold"
                style={{ color: colors.textPrimary }}
              >
                Total
              </td>
              <td
                className="py-3 px-3 font-bold"
                style={{ color: colors.textPrimary }}
              >
                {fmt(totalPlanned)}
              </td>
              <td
                className="py-3 px-3 font-bold"
                style={{ color: colors.textPrimary }}
              >
                {fmt(totalActual)}
              </td>
              <td
                className="py-3 px-3 font-bold"
                style={{
                  color: totalVariance < 0 ? colors.error : colors.success,
                }}
              >
                {totalVariance < 0 ? "-" : "+"}
                {fmt(Math.abs(totalVariance))}
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      flex: 1,
                      height: "6px",
                      borderRadius: "99px",
                      backgroundColor: colors.border,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(totalPlanned > 0 ? totalActual / totalPlanned : 0, 1) * 100}%`,
                        height: "100%",
                        borderRadius: "99px",
                        backgroundColor:
                          totalActual > totalPlanned
                            ? colors.error
                            : colors.mistyForest,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: colors.textSecondary,
                      fontSize: "12px",
                      minWidth: "38px",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    {totalPlanned > 0
                      ? ((totalActual / totalPlanned) * 100).toFixed(1)
                      : "0"}
                    %
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Budget Tab ───────────────────────────────────────────────────────────────

function BudgetTab({
  lineItems,
  expenses,
  onRefresh,
}: {
  lineItems: BudgetLineItem[];
  expenses: BudgetExpense[];
  onRefresh: () => void;
}) {
  const db = supabase();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BudgetLineItem>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({
    category: CATEGORIES[0],
    item_name: "",
    planned_amount: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set());

  const toggleDisabled = (id: string) =>
    setDisabledIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const total = lineItems.reduce(
    (s, i) => (disabledIds.has(i.id) ? s : s + Number(i.planned_amount)),
    0,
  );

  const byCategory = lineItems.reduce<Record<string, BudgetLineItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {},
  );

  const byCategoryAmount = Object.fromEntries(
    Object.entries(byCategory).map(([cat, items]) => [
      cat,
      items.reduce((s, i) => s + Number(i.planned_amount), 0),
    ]),
  );

  async function saveEdit(id: string) {
    setSaving(true);
    await db
      .schema("budget")
      .from("line_items")
      .update({
        category: editValues.category,
        item_name: editValues.item_name,
        planned_amount: Number(editValues.planned_amount),
        notes: editValues.notes ?? null,
      })
      .eq("id", id);
    setSaving(false);
    setEditingId(null);
    onRefresh();
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this line item?")) return;
    await db.schema("budget").from("line_items").delete().eq("id", id);
    onRefresh();
  }

  async function addItem() {
    if (!newItem.item_name.trim()) return;
    setSaving(true);
    await db
      .schema("budget")
      .from("line_items")
      .insert({
        category: newItem.category,
        item_name: newItem.item_name,
        planned_amount: Number(newItem.planned_amount) || 0,
        notes: newItem.notes || null,
        sort_order: lineItems.length * 10,
      });
    setSaving(false);
    setShowAdd(false);
    setNewItem({
      category: CATEGORIES[0],
      item_name: "",
      planned_amount: "",
      notes: "",
    });
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Monthly planned budget — {lineItems.length} line items
        </p>
        <button style={btnPrimary} onClick={() => setShowAdd(true)}>
          + Add Item
        </button>
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...cardStyle, padding: "20px" }}
        >
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: colors.textPrimary }}
          >
            New Line Item
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label
                className="text-xs mb-1 block"
                style={{ color: colors.textSecondary }}
              >
                Category
              </label>
              <select
                style={{ ...inputStyle }}
                value={newItem.category}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, category: e.target.value }))
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-xs mb-1 block"
                style={{ color: colors.textSecondary }}
              >
                Item Name
              </label>
              <input
                style={inputStyle}
                placeholder="e.g. Supplies"
                value={newItem.item_name}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, item_name: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                className="text-xs mb-1 block"
                style={{ color: colors.textSecondary }}
              >
                Planned Amount ($)
              </label>
              <input
                style={inputStyle}
                type="number"
                placeholder="0.00"
                value={newItem.planned_amount}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, planned_amount: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                className="text-xs mb-1 block"
                style={{ color: colors.textSecondary }}
              >
                Notes
              </label>
              <input
                style={inputStyle}
                placeholder="Optional"
                value={newItem.notes}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button style={btnPrimary} onClick={addItem} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button style={btnGhost} onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <BudgetPieChart byCategory={byCategoryAmount} total={total} />

      <BudgetVsActual lineItems={lineItems} expenses={expenses} />

      <Table headers={["Category", "Item", "Planned Amount", "Notes", ""]}>
        {Object.entries(byCategory).map(([cat, items]) => {
          const catTotal = items.reduce(
            (s, i) =>
              disabledIds.has(i.id) ? s : s + Number(i.planned_amount),
            0,
          );
          return (
            <React.Fragment key={`cat-${cat}`}>
              <tr style={{ backgroundColor: "#F6F1E8" }}>
                <td
                  colSpan={5}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wide"
                  style={{
                    color: colors.mistyForest,
                    borderBottom: `1px solid #E8E4DF`,
                  }}
                >
                  {cat} — {fmt(catTotal)}
                </td>
              </tr>
              {items.map((item, i) => (
                <TableRow
                  key={item.id}
                  index={i}
                  style={{ opacity: disabledIds.has(item.id) ? 0.4 : 1 }}
                >
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>{fmt(Number(item.planned_amount))}</TableCell>
                  <TableCell>{item.notes ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        style={{
                          ...btnGhost,
                          padding: "4px 10px",
                          fontSize: "12px",
                        }}
                        onClick={() => toggleDisabled(item.id)}
                        title={
                          disabledIds.has(item.id)
                            ? "Re-enable"
                            : "Exclude from total"
                        }
                      >
                        {disabledIds.has(item.id) ? "Enable" : "Exclude"}
                      </button>
                      <button
                        style={{
                          ...btnGhost,
                          padding: "4px 10px",
                          fontSize: "12px",
                        }}
                        onClick={() => {
                          setEditingId(item.id);
                          setEditValues({
                            category: item.category,
                            item_name: item.item_name,
                            planned_amount: item.planned_amount,
                            notes: item.notes ?? "",
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        style={btnDanger}
                        onClick={() => deleteItem(item.id)}
                      >
                        Del
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          );
        })}
        <tr
          style={{ backgroundColor: "#F6F1E8", borderTop: `1px solid #E8E4DF` }}
        >
          <td
            colSpan={2}
            className="px-4 py-3 text-sm font-bold"
            style={{ color: colors.mistyForest }}
          >
            Total Monthly Budget
          </td>
          <td
            className="px-4 py-3 text-sm font-bold"
            style={{ color: colors.mistyForest }}
          >
            {fmt(total)}
          </td>
          <td colSpan={2} />
        </tr>
      </Table>

      <DetailSidebar
        isOpen={editingId !== null}
        onClose={() => {
          setEditingId(null);
          setEditValues({});
        }}
        title="Edit Budget Item"
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              style={btnGhost}
              onClick={() => {
                setEditingId(null);
                setEditValues({});
              }}
            >
              Cancel
            </button>
            <button
              style={btnPrimary}
              disabled={saving}
              onClick={() => saveEdit(editingId!)}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: colors.textSecondary }}
            >
              Category
            </label>
            <select
              style={inputStyle}
              value={editValues.category ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, category: e.target.value }))
              }
            >
              {Array.from(
                new Set([
                  ...(editValues.category &&
                  !CATEGORIES.includes(editValues.category)
                    ? [editValues.category]
                    : []),
                  ...CATEGORIES,
                ]),
              ).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: colors.textSecondary }}
            >
              Item Name
            </label>
            <input
              style={inputStyle}
              value={editValues.item_name ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, item_name: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: colors.textSecondary }}
            >
              Planned Amount ($)
            </label>
            <input
              style={inputStyle}
              type="number"
              value={editValues.planned_amount ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({
                  ...v,
                  planned_amount: Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: colors.textSecondary }}
            >
              Notes
            </label>
            <input
              style={inputStyle}
              value={editValues.notes ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, notes: e.target.value }))
              }
            />
          </div>
        </div>
      </DetailSidebar>
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────

function ExpensesTab({
  expenses,
  lineItems,
  onRefresh,
}: {
  expenses: BudgetExpense[];
  lineItems: BudgetLineItem[];
  onRefresh: () => void;
}) {
  const db = supabase();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BudgetExpense>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [filterMonth, setFilterMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [filterCat, setFilterCat] = useState("");
  const [view, setView] = useState<"monthly" | "daily" | "category" | "trend">(
    "monthly",
  );
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [collapsedCatMonths, setCollapsedCatMonths] = useState<Set<string>>(
    new Set(),
  );
  const [newExp, setNewExp] = useState({
    expense_name: "",
    category: CATEGORIES[0],
    amount: "",
    payment_method: "",
    expense_date: new Date().toISOString().slice(0, 10),
    notes: "",
    tax_deductible: false,
  });
  const [saving, setSaving] = useState(false);

  // Receipt upload state
  const [receiptFiles, setReceiptFiles] = useState<FileObject[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isDraggingReceipt, setIsDraggingReceipt] = useState(false);
  const [deletingReceiptPath, setDeletingReceiptPath] = useState<string | null>(
    null,
  );
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [loadingPreviewPath, setLoadingPreviewPath] = useState<string | null>(
    null,
  );
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [newPendingReceipts, setNewPendingReceipts] = useState<File[]>([]);
  const [isDraggingNewReceipt, setIsDraggingNewReceipt] = useState(false);
  const [newReceiptError, setNewReceiptError] = useState<string | null>(null);
  const newReceiptInputRef = useRef<HTMLInputElement>(null);
  const receiptCacheRef = useRef<Map<string, FileObject[]>>(new Map());

  const MAX_RECEIPT_FILES = 10;
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ACCEPTED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
  ];

  async function loadReceipts(expenseId: string) {
    setIsLoadingReceipts(true);
    setReceiptError(null);
    const result = await listExpenseReceipts(expenseId);
    if ("error" in result && result.error) {
      setReceiptError(result.error);
    } else {
      const files = result.files as FileObject[];
      receiptCacheRef.current.set(expenseId, files);
      setReceiptFiles(files);
    }
    setIsLoadingReceipts(false);
  }

  useEffect(() => {
    if (editingId === null) {
      setReceiptError(null);
      return;
    }
    if (receiptCacheRef.current.has(editingId)) {
      setReceiptFiles(receiptCacheRef.current.get(editingId)!);
      return;
    }
    loadReceipts(editingId);
  }, [editingId]);

  async function handleReceiptUpload(file: File) {
    if (!editingId) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setReceiptError(
        "File type not supported. Use PDF, JPEG, PNG, WEBP, or HEIC.",
      );
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setReceiptError("File exceeds 10 MB limit.");
      return;
    }
    if (receiptFiles.length >= MAX_RECEIPT_FILES) {
      setReceiptError(`Maximum ${MAX_RECEIPT_FILES} files allowed.`);
      return;
    }
    setReceiptError(null);
    setIsUploadingReceipt(true);
    const fd = new FormData();
    fd.append("expenseId", editingId);
    fd.append("file", file);
    const result = await uploadExpenseReceipt(fd);
    if ("error" in result && result.error) {
      setReceiptError(result.error);
    } else {
      await loadReceipts(editingId);
    }
    setIsUploadingReceipt(false);
  }

  async function handleReceiptDelete(path: string) {
    setDeletingReceiptPath(path);
    const result = await deleteExpenseReceipt(path);
    if ("error" in result && result.error) {
      setReceiptError(result.error);
    } else if (editingId) {
      await loadReceipts(editingId);
    }
    setDeletingReceiptPath(null);
  }

  async function handleReceiptDownload(path: string, fileName: string) {
    setLoadingPreviewPath(path);
    const result = await getExpenseReceiptUrl(path);
    if ("error" in result) {
      setReceiptError(result.error ?? "Unknown error");
    } else {
      const a = document.createElement("a");
      a.href = result.url;
      a.download = fileName.replace(/^\d+-/, "");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setLoadingPreviewPath(null);
  }

  const filtered = expenses.filter((e) => {
    if (filterMonth && !e.expense_date.startsWith(filterMonth)) return false;
    if (filterCat && e.category !== filterCat) return false;
    return true;
  });
  const total = filtered
    .filter((e) => e.category !== "Savings")
    .reduce((s, e) => s + Number(e.amount), 0);

  // Group by month for monthly view
  const byMonth = filtered.reduce<Record<string, BudgetExpense[]>>((acc, e) => {
    const key = e.expense_date.slice(0, 7);
    (acc[key] ??= []).push(e);
    return acc;
  }, {});
  const months = Object.keys(byMonth).sort().reverse();

  // Group by day for daily view
  const byDay = filtered.reduce<Record<string, BudgetExpense[]>>((acc, e) => {
    (acc[e.expense_date] ??= []).push(e);
    return acc;
  }, {});

  // All days in the selected month up to today (only days that have actually passed)
  const todayStr = new Date().toISOString().slice(0, 10);
  const daysInView: string[] = (() => {
    if (!filterMonth)
      return Object.keys(byDay)
        .filter((d) => d <= todayStr)
        .sort()
        .reverse();
    const [y, m] = filterMonth.split("-").map(Number);
    const count = new Date(y, m, 0).getDate();
    return Array.from({ length: count }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      return `${filterMonth}-${d}`;
    })
      .filter((d) => d <= todayStr)
      .reverse();
  })();

  function toggleDay(key: string) {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleMonth(key: string) {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleCatMonth(key: string) {
    setCollapsedCatMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function formatMonthLabel(key: string) {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  }

  // By category analytics
  const byCat = filtered.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category ?? "Uncategorized";
    acc[cat] = (acc[cat] ?? 0) + Number(e.amount);
    return acc;
  }, {});

  // Budget vs. actual by category
  const plannedByCat = lineItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] =
      (acc[item.category] ?? 0) + Number(item.planned_amount);
    return acc;
  }, {});

  const allBudgetCats = Array.from(
    new Set([...Object.keys(plannedByCat), ...Object.keys(byCat)]),
  );
  const budgetRows = allBudgetCats
    .map((cat) => {
      const actual = byCat[cat] ?? 0;
      const planned = plannedByCat[cat] ?? 0;
      const variance = planned - actual;
      const pct = planned > 0 ? actual / planned : null;
      const over = planned > 0 && actual > planned;
      return { cat, actual, planned, variance, pct, over };
    })
    .sort((a, b) => b.actual - a.actual)
    .map((row, i) => ({
      ...row,
      color: SLICE_COLORS[i % SLICE_COLORS.length],
    }));

  const totalBudgetPlanned = budgetRows.reduce((s, r) => s + r.planned, 0);
  const totalBudgetActual = budgetRows.reduce((s, r) => s + r.actual, 0);
  const totalBudgetVariance = totalBudgetPlanned - totalBudgetActual;

  // Trend: group by month across ALL months (ignore filterMonth), respect filterCat
  const trendFiltered = expenses.filter((e) => {
    if (e.is_deleted) return false;
    if (filterCat && e.category !== filterCat) return false;
    return true;
  });
  const trendByMonth = trendFiltered.reduce<Record<string, BudgetExpense[]>>(
    (acc, e) => {
      const key = e.expense_date.slice(0, 7);
      (acc[key] ??= []).push(e);
      return acc;
    },
    {},
  );
  const trendMonths = Object.keys(trendByMonth).sort();
  const maxMonthTotal = Math.max(
    ...trendMonths.map((m) =>
      trendByMonth[m].reduce((s, e) => s + Number(e.amount), 0),
    ),
    1,
  );

  async function saveEdit(id: string) {
    setSaving(true);
    await db
      .schema("budget")
      .from("expenses")
      .update({
        expense_name: editValues.expense_name,
        category: editValues.category,
        amount: Number(editValues.amount),
        payment_method: editValues.payment_method ?? null,
        expense_date: editValues.expense_date,
        notes: editValues.notes ?? null,
        tax_deductible: editValues.tax_deductible ?? false,
      })
      .eq("id", id);
    setSaving(false);
    setEditingId(null);
    onRefresh();
  }

  async function deleteExpense(id: string) {
    if (!confirm("Delete this expense?")) return;
    await db
      .schema("budget")
      .from("expenses")
      .update({ is_deleted: true })
      .eq("id", id);
    onRefresh();
  }

  async function addExpense() {
    if (!newExp.expense_name.trim()) return;
    setSaving(true);
    const { data } = await db
      .schema("budget")
      .from("expenses")
      .insert({
        expense_name: newExp.expense_name,
        category: newExp.category,
        amount: Number(newExp.amount) || 0,
        payment_method: newExp.payment_method || null,
        expense_date: newExp.expense_date,
        notes: newExp.notes || null,
        tax_deductible: newExp.tax_deductible,
      })
      .select("id")
      .single();

    if (data?.id && newPendingReceipts.length > 0) {
      for (const file of newPendingReceipts) {
        const fd = new FormData();
        fd.append("expenseId", data.id);
        fd.append("file", file);
        await uploadExpenseReceipt(fd);
      }
    }

    setSaving(false);
    setShowAdd(false);
    setNewExp({
      expense_name: "",
      category: CATEGORIES[0],
      amount: "",
      payment_method: "",
      expense_date: new Date().toISOString().slice(0, 10),
      notes: "",
      tax_deductible: false,
    });
    setNewPendingReceipts([]);
    setNewReceiptError(null);
    onRefresh();
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3">
          <MonthPicker
            value={filterMonth}
            onChange={setFilterMonth}
            placeholder="Filter month"
          />
          <select
            style={{ ...inputStyle, width: "160px" }}
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button style={btnPrimary} onClick={() => setShowAdd(true)}>
          + Add Expense
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.35)",
                zIndex: 40,
              }}
            />
            {/* Sidebar panel */}
            <motion.div
              key="sidebar"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                width: "420px",
                height: "100%",
                backgroundColor: "white",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <p
                  className="text-base font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  New Expense
                </p>
                <button
                  onClick={() => setShowAdd(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: colors.textSecondary,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                <div className="space-y-4">
                  {[
                    {
                      label: "Name",
                      key: "expense_name",
                      type: "text",
                      placeholder: "e.g. Zoho Mail",
                    },
                    {
                      label: "Amount ($)",
                      key: "amount",
                      type: "number",
                      placeholder: "0.00",
                    },
                    {
                      label: "Date",
                      key: "expense_date",
                      type: "date",
                      placeholder: "",
                    },
                    {
                      label: "Payment Method",
                      key: "payment_method",
                      type: "text",
                      placeholder: "Card / ACH / Check",
                    },
                    {
                      label: "Notes",
                      key: "notes",
                      type: "text",
                      placeholder: "Optional",
                    },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label
                        className="text-xs mb-1 block"
                        style={{ color: colors.textSecondary }}
                      >
                        {label}
                      </label>
                      {key === "expense_date" ? (
                        <DatePicker
                          value={
                            ((newExp as Record<string, unknown>)[
                              key
                            ] as string) ?? ""
                          }
                          onChange={(v) =>
                            setNewExp((p) => ({ ...p, [key]: v }))
                          }
                        />
                      ) : (
                        <input
                          style={inputStyle}
                          type={type}
                          placeholder={placeholder}
                          value={
                            (newExp as Record<string, unknown>)[key] as string
                          }
                          onChange={(e) =>
                            setNewExp((p) => ({ ...p, [key]: e.target.value }))
                          }
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="new-tax-deductible"
                      checked={newExp.tax_deductible}
                      onChange={(e) =>
                        setNewExp((p) => ({
                          ...p,
                          tax_deductible: e.target.checked,
                        }))
                      }
                    />
                    <label
                      htmlFor="new-tax-deductible"
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      Tax Deductible
                    </label>
                  </div>
                  <div>
                    <label
                      className="text-xs mb-1 block"
                      style={{ color: colors.textSecondary }}
                    >
                      Category
                    </label>
                    <select
                      style={inputStyle}
                      value={newExp.category}
                      onChange={(e) =>
                        setNewExp((p) => ({ ...p, category: e.target.value }))
                      }
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Receipts & Screenshots */}
                <div
                  style={{
                    borderTop: `1px solid ${colors.border}`,
                    paddingTop: 16,
                    marginTop: 4,
                  }}
                >
                  <p
                    className="text-xs font-semibold mb-3"
                    style={{
                      color: colors.textPrimary,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Receipts &amp; Screenshots
                  </p>

                  {/* Queued file list */}
                  {newPendingReceipts.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginBottom: 12,
                      }}
                    >
                      {newPendingReceipts.map((file, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 10px",
                            background: colors.softCloud,
                            border: `1px solid ${colors.border}`,
                            borderRadius: radius.sm,
                          }}
                        >
                          <FileText
                            size={14}
                            style={{
                              color: colors.textSecondary,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            className="text-xs"
                            style={{
                              color: colors.textPrimary,
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {file.name}
                          </span>
                          <button
                            onClick={() =>
                              setNewPendingReceipts((p) =>
                                p.filter((_, idx) => idx !== i),
                              )
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 2,
                              color: colors.textSecondary,
                              flexShrink: 0,
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drop zone */}
                  {newPendingReceipts.length < MAX_RECEIPT_FILES && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingNewReceipt(true);
                      }}
                      onDragLeave={() => setIsDraggingNewReceipt(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingNewReceipt(false);
                        const file = e.dataTransfer.files[0];
                        if (!file) return;
                        if (!ACCEPTED_TYPES.includes(file.type)) {
                          setNewReceiptError("File type not supported.");
                          return;
                        }
                        if (file.size > MAX_FILE_SIZE) {
                          setNewReceiptError("File exceeds 10 MB limit.");
                          return;
                        }
                        setNewReceiptError(null);
                        setNewPendingReceipts((p) => [...p, file]);
                      }}
                      onClick={() => newReceiptInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${isDraggingNewReceipt ? colors.mistyForest : colors.border}`,
                        borderRadius: radius.sm,
                        padding: "16px 12px",
                        textAlign: "center",
                        cursor: "pointer",
                        background: isDraggingNewReceipt
                          ? colors.pastelSage + "30"
                          : colors.softCloud,
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                    >
                      <Upload
                        size={18}
                        style={{
                          color: colors.textSecondary,
                          margin: "0 auto 6px",
                        }}
                      />
                      <p
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        Drop a file or click to upload
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          color: colors.textSecondary,
                          opacity: 0.6,
                          marginTop: 2,
                        }}
                      >
                        PDF, JPEG, PNG, WEBP, HEIC · max 10 MB
                      </p>
                    </div>
                  )}

                  <input
                    ref={newReceiptInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!ACCEPTED_TYPES.includes(file.type)) {
                        setNewReceiptError("File type not supported.");
                        return;
                      }
                      if (file.size > MAX_FILE_SIZE) {
                        setNewReceiptError("File exceeds 10 MB limit.");
                        return;
                      }
                      setNewReceiptError(null);
                      setNewPendingReceipts((p) => [...p, file]);
                      e.target.value = "";
                    }}
                  />

                  {newReceiptError && (
                    <p className="text-xs mt-2" style={{ color: "#ef4444" }}>
                      {newReceiptError}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: `1px solid ${colors.border}`,
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  style={btnPrimary}
                  onClick={addExpense}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Expense"}
                </button>
                <button style={btnGhost} onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* View toggle */}
      <div
        style={{
          display: "inline-flex",
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
          backgroundColor: colors.warmLinen,
        }}
      >
        {(["monthly", "daily", "category", "trend"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: view === v ? 600 : 400,
              border: "none",
              cursor: "pointer",
              backgroundColor: view === v ? colors.mistyForest : "transparent",
              color: view === v ? "white" : colors.textSecondary,
              transition: "all 0.15s",
            }}
          >
            {v === "monthly"
              ? "Monthly"
              : v === "daily"
                ? "Daily"
                : v === "category"
                  ? "By Category"
                  : "Trend"}
          </button>
        ))}
      </div>

      {/* Monthly view */}
      {view === "monthly" && (
        <Table
          headers={[
            "Expense Name",
            "Category",
            "Amount",
            "Payment Method",
            "Date",
            "Notes",
            "Tax Ded.",
            "Actions",
          ]}
        >
          {filtered.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-8 text-center text-sm text-gray-400"
              >
                No expenses found.
              </td>
            </tr>
          ) : (
            months.map((monthKey) => {
              const monthExps = byMonth[monthKey];
              const monthTotal = monthExps
                .filter((e) => e.category !== "Savings")
                .reduce((s, e) => s + Number(e.amount), 0);
              const isCollapsed = collapsedMonths.has(monthKey);
              return (
                <React.Fragment key={monthKey}>
                  {/* Month header row */}
                  <tr
                    style={{
                      backgroundColor: "#F6F1E8",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleMonth(monthKey)}
                  >
                    <td colSpan={8} style={{ padding: "10px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              color: colors.textSecondary,
                              transform: isCollapsed
                                ? "rotate(-90deg)"
                                : "rotate(0deg)",
                              display: "inline-block",
                              transition: "transform 0.2s",
                            }}
                          >
                            ▾
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: colors.textPrimary }}
                          >
                            {formatMonthLabel(monthKey)}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: colors.textSecondary }}
                          >
                            ({monthExps.length} expense
                            {monthExps.length !== 1 ? "s" : ""})
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ color: colors.error }}
                        >
                          {fmt(monthTotal)}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* Expense rows */}
                  {!isCollapsed &&
                    monthExps.map((exp, i) => (
                      <TableRow
                        key={exp.id}
                        index={i}
                        onClick={() => {
                          setEditingId(exp.id);
                          setEditValues({ ...exp });
                        }}
                      >
                        <TableCell style={{ maxWidth: "160px" }}>
                          <span
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={exp.expense_name}
                          >
                            {exp.expense_name}
                          </span>
                        </TableCell>
                        <TableCell>{exp.category ?? "—"}</TableCell>
                        <TableCell>{fmt(Number(exp.amount))}</TableCell>
                        <TableCell>{exp.payment_method ?? "—"}</TableCell>
                        <TableCell>{exp.expense_date}</TableCell>
                        <TableCell style={{ maxWidth: "140px" }}>
                          <span
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={exp.notes ?? undefined}
                          >
                            {exp.notes ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {exp.tax_deductible ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 items-center">
                            <button
                              title="Edit"
                              style={{
                                ...btnGhost,
                                padding: "4px 6px",
                                lineHeight: 1,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(exp.id);
                                setEditValues({ ...exp });
                              }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              title="Delete"
                              style={btnDanger}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteExpense(exp.id);
                              }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </React.Fragment>
              );
            })
          )}
          <tr
            style={{
              backgroundColor: "#F6F1E8",
              borderTop: `1px solid #E8E4DF`,
            }}
          >
            <td
              colSpan={2}
              className="px-4 py-3 text-sm font-bold"
              style={{ color: colors.textPrimary }}
            >
              Total
            </td>
            <td
              className="px-4 py-3 text-sm font-bold"
              style={{ color: colors.error }}
            >
              {fmt(total)}
            </td>
            <td colSpan={5} />
          </tr>
        </Table>
      )}

      {/* Daily view */}
      {view === "daily" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!filterMonth ? (
            <div style={{ ...cardStyle, padding: "24px" }}>
              <p
                className="text-sm text-center py-8"
                style={{ color: colors.textTertiary }}
              >
                Select a month above to view daily expenses.
              </p>
            </div>
          ) : daysInView.length === 0 ? (
            <div style={{ ...cardStyle, padding: "24px" }}>
              <p
                className="text-sm text-center py-8"
                style={{ color: colors.textTertiary }}
              >
                No days to show yet for this month.
              </p>
            </div>
          ) : (
            <>
              {/* Calendar grid picker */}
              {(() => {
                const [y, m] = filterMonth!.split("-").map(Number);
                // day-of-week the 1st falls on (0=Sun)
                const firstDow = new Date(y, m - 1, 1).getDay();
                const daysInMonth = new Date(y, m, 0).getDate();
                const DOW_LABELS = [
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ];

                // build cells: leading nulls + day numbers
                const cells: (number | null)[] = [
                  ...Array(firstDow).fill(null),
                  ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                ];
                // pad to full weeks
                while (cells.length % 7 !== 0) cells.push(null);

                return (
                  <div style={{ ...cardStyle, padding: "16px 20px" }}>
                    {/* "All" link */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: colors.textSecondary,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {new Date(y, m - 1, 1).toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <button
                        onClick={() => setSelectedDay(null)}
                        style={{
                          fontSize: 12,
                          fontWeight: selectedDay === null ? 700 : 400,
                          color:
                            selectedDay === null
                              ? colors.mistyForest
                              : colors.textSecondary,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {selectedDay === null
                          ? `All (${filtered.length})`
                          : "Show all"}
                      </button>
                    </div>

                    {/* DOW header */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: 4,
                        marginBottom: 4,
                      }}
                    >
                      {DOW_LABELS.map((d) => (
                        <div
                          key={d}
                          style={{
                            textAlign: "center",
                            fontSize: 10,
                            fontWeight: 600,
                            color: colors.textSecondary,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            padding: "2px 0",
                          }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Day cells */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: 4,
                      }}
                    >
                      {cells.map((dayNum, idx) => {
                        if (dayNum === null) {
                          return <div key={`empty-${idx}`} />;
                        }
                        const dayKey = `${filterMonth}-${String(dayNum).padStart(2, "0")}`;
                        const isFuture = dayKey > todayStr;
                        const isToday = dayKey === todayStr;
                        const isSelected = selectedDay === dayKey;
                        const dayExps = byDay[dayKey] ?? [];
                        const hasExpenses = dayExps.length > 0;

                        return (
                          <button
                            key={dayKey}
                            disabled={isFuture}
                            onClick={() =>
                              setSelectedDay(isSelected ? null : dayKey)
                            }
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "6px 4px",
                              borderRadius: radius.md,
                              border: `1px solid ${isSelected ? colors.mistyForest : isToday ? colors.mistyForest + "50" : colors.border}`,
                              backgroundColor: isSelected
                                ? colors.mistyForest
                                : isToday
                                  ? colors.mistyForest + "10"
                                  : "transparent",
                              cursor: isFuture ? "default" : "pointer",
                              opacity: isFuture ? 0.3 : 1,
                              transition: "all 0.15s",
                              minHeight: 52,
                              gap: 2,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                lineHeight: 1,
                                color: isSelected
                                  ? "white"
                                  : isToday
                                    ? colors.mistyForest
                                    : colors.textPrimary,
                              }}
                            >
                              {dayNum}
                            </span>
                            {hasExpenses ? (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  backgroundColor: isSelected
                                    ? "rgba(255,255,255,0.25)"
                                    : colors.warmLinen,
                                  color: isSelected
                                    ? "white"
                                    : colors.textSecondary,
                                  borderRadius: 8,
                                  padding: "1px 5px",
                                  lineHeight: 1.5,
                                  marginTop: 2,
                                }}
                              >
                                {dayExps.length}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: 10,
                                  lineHeight: 1.5,
                                  color: "transparent",
                                  marginTop: 2,
                                }}
                              >
                                ·
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Expense cards — filtered to selectedDay or all */}
              {(() => {
                const visibleDays = selectedDay ? [selectedDay] : daysInView;
                return visibleDays.map((dayKey) => {
                  const dayExps = byDay[dayKey] ?? [];
                  if (dayExps.length === 0) return null;
                  const dayTotal = dayExps.reduce(
                    (s, e) => s + Number(e.amount),
                    0,
                  );
                  const isToday = dayKey === todayStr;
                  const dateObj = new Date(dayKey + "T00:00:00");
                  const weekday = dateObj.toLocaleDateString("default", {
                    weekday: "long",
                  });
                  const dateLabel = dateObj.toLocaleDateString("default", {
                    month: "long",
                    day: "numeric",
                  });
                  return (
                    <div
                      key={dayKey}
                      style={{ ...cardStyle, overflow: "hidden" }}
                    >
                      {/* Day header */}
                      <div
                        style={{
                          padding: "12px 20px",
                          backgroundColor: isToday
                            ? colors.mistyForest
                            : "#F6F1E8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: radius.md,
                              backgroundColor: isToday
                                ? "rgba(255,255,255,0.2)"
                                : colors.border,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                lineHeight: 1,
                                color: isToday ? "white" : colors.textPrimary,
                              }}
                            >
                              {dateObj.getDate()}
                            </span>
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: isToday ? "white" : colors.textPrimary,
                                lineHeight: 1.2,
                              }}
                            >
                              {weekday}
                              {isToday && (
                                <span
                                  style={{
                                    marginLeft: 6,
                                    fontSize: 10,
                                    fontWeight: 500,
                                    backgroundColor: "rgba(255,255,255,0.25)",
                                    borderRadius: 4,
                                    padding: "1px 5px",
                                  }}
                                >
                                  Today
                                </span>
                              )}
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: isToday
                                  ? "rgba(255,255,255,0.75)"
                                  : colors.textSecondary,
                                marginTop: 1,
                              }}
                            >
                              {dateLabel} · {dayExps.length} expense
                              {dayExps.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: isToday ? "white" : colors.error,
                          }}
                        >
                          {fmt(dayTotal)}
                        </span>
                      </div>

                      {/* Expense items */}
                      <div style={{ padding: "8px 0" }}>
                        {dayExps.map((exp, i) => (
                          <div
                            key={exp.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "10px 20px",
                              borderBottom:
                                i < dayExps.length - 1
                                  ? `1px solid ${colors.border}`
                                  : "none",
                              cursor: "pointer",
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.backgroundColor = colors.warmLinen;
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.backgroundColor = "transparent";
                            }}
                            onClick={() => {
                              setEditingId(exp.id);
                              setEditValues({ ...exp });
                            }}
                          >
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor:
                                  SLICE_COLORS[
                                    CATEGORIES.indexOf(exp.category) %
                                      SLICE_COLORS.length
                                  ] ?? colors.textSecondary,
                                flexShrink: 0,
                                marginRight: 12,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: colors.textPrimary,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {exp.expense_name}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: colors.textSecondary,
                                  marginTop: 1,
                                }}
                              >
                                {exp.category ?? "Uncategorized"}
                                {exp.payment_method
                                  ? ` · ${exp.payment_method}`
                                  : ""}
                                {exp.tax_deductible ? " · Tax ded." : ""}
                              </p>
                            </div>
                            {exp.notes && (
                              <p
                                style={{
                                  fontSize: 11,
                                  color: colors.textTertiary,
                                  marginLeft: 12,
                                  maxWidth: 140,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  flexShrink: 0,
                                }}
                                title={exp.notes}
                              >
                                {exp.notes}
                              </p>
                            )}
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: colors.error,
                                marginLeft: 16,
                                flexShrink: 0,
                              }}
                            >
                              {fmt(Number(exp.amount))}
                            </span>
                            <div
                              className="flex gap-1 items-center"
                              style={{ marginLeft: 12, flexShrink: 0 }}
                            >
                              <button
                                title="Edit"
                                style={{
                                  ...btnGhost,
                                  padding: "4px 6px",
                                  lineHeight: 1,
                                }}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setEditingId(exp.id);
                                  setEditValues({ ...exp });
                                }}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                title="Delete"
                                style={btnDanger}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  deleteExpense(exp.id);
                                }}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Total bar */}
              <div
                style={{
                  ...cardStyle,
                  padding: "14px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#F6F1E8",
                }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  {selectedDay
                    ? `${new Date(selectedDay + "T00:00:00").toLocaleDateString("default", { month: "long", day: "numeric" })} total`
                    : `Month total`}{" "}
                  (
                  {(selectedDay ? (byDay[selectedDay] ?? []) : filtered).length}{" "}
                  expense
                  {(selectedDay ? (byDay[selectedDay] ?? []) : filtered)
                    .length !== 1
                    ? "s"
                    : ""}
                  )
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: colors.error }}
                >
                  {fmt(
                    selectedDay
                      ? (byDay[selectedDay] ?? []).reduce(
                          (s, e) => s + Number(e.amount),
                          0,
                        )
                      : total,
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Monthly view — Spend vs. Budget by Category */}
      {view === "monthly" && (
        <div style={{ ...cardStyle, padding: "24px" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: colors.textPrimary }}
              >
                Spend vs. Budget by Category
              </p>
              {filterMonth && (
                <p
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
                >
                  {new Date(
                    Number(filterMonth.slice(0, 4)),
                    Number(filterMonth.slice(5, 7)) - 1,
                  ).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
          {!filterMonth ? (
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Select a month above to compare spending against your monthly
              budget.
            </p>
          ) : budgetRows.length === 0 ? (
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              No expenses recorded for this month.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {["Category", "Budgeted", "Spent", "Variance", "Usage"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left py-2 px-3"
                          style={{
                            color: colors.textSecondary,
                            fontWeight: 600,
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {budgetRows.map((row) => {
                    const isSavings = row.cat === "Savings";
                    const displayOver = isSavings ? !row.over : row.over;
                    return (
                    <tr
                      key={row.cat}
                      style={{ borderBottom: `1px solid ${colors.border}` }}
                    >
                      <td
                        className="py-3 px-3"
                        style={{ color: colors.textPrimary }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: row.color,
                              flexShrink: 0,
                            }}
                          />
                          {row.cat}
                        </div>
                      </td>
                      <td
                        className="py-3 px-3"
                        style={{ color: colors.textSecondary }}
                      >
                        {row.planned > 0 ? fmt(row.planned) : "—"}
                      </td>
                      <td
                        className="py-3 px-3"
                        style={{ color: colors.textSecondary }}
                      >
                        {fmt(row.actual)}
                      </td>
                      <td
                        className="py-3 px-3"
                        style={{
                          color:
                            row.planned === 0
                              ? colors.textTertiary
                              : displayOver
                                ? colors.error
                                : colors.success,
                          fontWeight: 600,
                        }}
                      >
                        {row.planned === 0
                          ? "—"
                          : (displayOver ? "-" : "+") +
                            fmt(Math.abs(row.variance))}
                      </td>
                      <td className="py-3 px-3" style={{ minWidth: "140px" }}>
                        {row.pct === null ? (
                          <span
                            style={{
                              color: colors.textTertiary,
                              fontSize: "12px",
                            }}
                          >
                            —
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              style={{
                                flex: 1,
                                height: "6px",
                                borderRadius: "99px",
                                backgroundColor: colors.warmLinen,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(row.pct, 1) * 100}%`,
                                  height: "100%",
                                  borderRadius: "99px",
                                  backgroundColor: displayOver
                                    ? colors.error
                                    : colors.mistyForest,
                                  transition: "width 0.4s ease",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                color: displayOver
                                  ? colors.error
                                  : colors.textSecondary,
                                fontSize: "12px",
                                minWidth: "38px",
                                textAlign: "right",
                              }}
                            >
                              {(row.pct * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ); })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: colors.warmLinen }}>
                    <td
                      className="py-3 px-3 font-bold"
                      style={{ color: colors.textPrimary }}
                    >
                      Total
                    </td>
                    <td
                      className="py-3 px-3 font-bold"
                      style={{ color: colors.textPrimary }}
                    >
                      {totalBudgetPlanned > 0 ? fmt(totalBudgetPlanned) : "—"}
                    </td>
                    <td
                      className="py-3 px-3 font-bold"
                      style={{ color: colors.textPrimary }}
                    >
                      {fmt(totalBudgetActual)}
                    </td>
                    <td
                      className="py-3 px-3 font-bold"
                      style={{
                        color:
                          totalBudgetVariance < 0
                            ? colors.error
                            : colors.success,
                      }}
                    >
                      {totalBudgetPlanned === 0
                        ? "—"
                        : (totalBudgetVariance < 0 ? "-" : "+") +
                          fmt(Math.abs(totalBudgetVariance))}
                    </td>
                    <td className="py-3 px-3">
                      {totalBudgetPlanned > 0 && (
                        <div className="flex items-center gap-2">
                          <div
                            style={{
                              flex: 1,
                              height: "6px",
                              borderRadius: "99px",
                              backgroundColor: colors.border,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(totalBudgetPlanned > 0 ? totalBudgetActual / totalBudgetPlanned : 0, 1) * 100}%`,
                                height: "100%",
                                borderRadius: "99px",
                                backgroundColor:
                                  totalBudgetActual > totalBudgetPlanned
                                    ? colors.error
                                    : colors.mistyForest,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              color: colors.textSecondary,
                              fontSize: "12px",
                              minWidth: "38px",
                              textAlign: "right",
                            }}
                          >
                            {(totalBudgetPlanned > 0
                              ? (totalBudgetActual / totalBudgetPlanned) * 100
                              : 0
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* By Category view */}
      {view === "category" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ ...cardStyle, padding: "24px" }}>
              <p
                className="text-sm text-center py-8"
                style={{ color: colors.textTertiary }}
              >
                No expenses found.
              </p>
            </div>
          ) : (
            months.map((monthKey) => {
              const monthExps = byMonth[monthKey];
              const monthTotal = monthExps
                .filter((e) => e.category !== "Savings")
                .reduce((s, e) => s + Number(e.amount), 0);
              const isCatCollapsed = collapsedCatMonths.has(monthKey);

              const byCatMonth = monthExps.reduce<Record<string, number>>(
                (acc, e) => {
                  const cat = e.category ?? "Uncategorized";
                  acc[cat] = (acc[cat] ?? 0) + Number(e.amount);
                  return acc;
                },
                {},
              );

              const monthBudgetRows = Object.entries(byCatMonth)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, actual], i) => {
                  const planned = plannedByCat[cat] ?? 0;
                  const variance = planned - actual;
                  const pct = planned > 0 ? actual / planned : null;
                  const over = planned > 0 && actual > planned;
                  return {
                    cat,
                    actual,
                    planned,
                    variance,
                    pct,
                    over,
                    color: SLICE_COLORS[i % SLICE_COLORS.length],
                  };
                });

              const monthBudgetPlanned = monthBudgetRows.reduce(
                (s, r) => s + r.planned,
                0,
              );
              const monthBudgetActual = monthBudgetRows.reduce(
                (s, r) => s + r.actual,
                0,
              );
              const monthBudgetVariance =
                monthBudgetPlanned - monthBudgetActual;

              return (
                <div
                  key={monthKey}
                  style={{ ...cardStyle, overflow: "hidden" }}
                >
                  {/* Month header */}
                  <div
                    style={{
                      padding: "12px 20px",
                      backgroundColor: "#F6F1E8",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    onClick={() => toggleCatMonth(monthKey)}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: colors.textSecondary,
                          transform: isCatCollapsed
                            ? "rotate(-90deg)"
                            : "rotate(0deg)",
                          display: "inline-block",
                          transition: "transform 0.2s",
                        }}
                      >
                        ▾
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: colors.textPrimary }}
                      >
                        {formatMonthLabel(monthKey)}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        ({monthExps.length} expense
                        {monthExps.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: colors.error }}
                    >
                      {fmt(monthTotal)}
                    </span>
                  </div>

                  {/* Expanded content */}
                  {!isCatCollapsed && (
                    <div style={{ padding: "24px" }}>
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Donut SVG */}
                        <div style={{ flexShrink: 0 }}>
                          <svg width={220} height={220}>
                            {(() => {
                              const cx = 110,
                                cy = 110;
                              const catEntries = Object.entries(
                                byCatMonth,
                              ).sort(([, a], [, b]) => b - a);
                              let cumulative = 0;
                              const slices = catEntries.map(([cat, val], i) => {
                                const pct =
                                  monthTotal > 0 ? val / monthTotal : 0;
                                const dashLen = pct * CIRC;
                                const offset = CIRC - cumulative - CIRC / 4;
                                cumulative += dashLen;
                                return {
                                  cat,
                                  val,
                                  pct,
                                  dashLen,
                                  offset,
                                  color: SLICE_COLORS[i % SLICE_COLORS.length],
                                };
                              });
                              return (
                                <>
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={RADIUS}
                                    fill="none"
                                    stroke={colors.warmLinen}
                                    strokeWidth={30}
                                  />
                                  {slices.map((slice, i) => (
                                    <motion.circle
                                      key={slice.cat}
                                      cx={cx}
                                      cy={cy}
                                      r={RADIUS}
                                      fill="none"
                                      stroke={slice.color}
                                      strokeWidth={30}
                                      strokeDasharray={`${slice.dashLen} ${CIRC}`}
                                      strokeDashoffset={slice.offset}
                                      initial={{
                                        strokeDasharray: `0 ${CIRC}`,
                                      }}
                                      animate={{
                                        strokeDasharray: `${slice.dashLen} ${CIRC}`,
                                      }}
                                      transition={{
                                        duration: 0.6,
                                        delay: i * 0.08,
                                        ease: "easeOut" as const,
                                      }}
                                    />
                                  ))}
                                  <circle cx={cx} cy={cy} r={50} fill="white" />
                                  <text
                                    x={cx}
                                    y={cy - 6}
                                    textAnchor="middle"
                                    fontSize="13"
                                    fontWeight="700"
                                    fill={colors.textPrimary}
                                  >
                                    {fmt(monthTotal)}
                                  </text>
                                  <text
                                    x={cx}
                                    y={cy + 12}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill={colors.textSecondary}
                                  >
                                    total expenses
                                  </text>
                                </>
                              );
                            })()}
                          </svg>
                        </div>

                        {/* Category list */}
                        <div
                          className="flex-1 space-y-3"
                          style={{ minWidth: 0 }}
                        >
                          {Object.entries(byCatMonth)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cat, val], i) => {
                              const pct = monthTotal > 0 ? val / monthTotal : 0;
                              const color =
                                SLICE_COLORS[i % SLICE_COLORS.length];
                              return (
                                <div key={cat} className="space-y-1">
                                  <div className="flex items-center gap-3">
                                    <div
                                      style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        backgroundColor: color,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <span
                                      className="text-sm flex-1"
                                      style={{ color: colors.textSecondary }}
                                    >
                                      {cat}
                                    </span>
                                    <span
                                      className="text-sm font-medium"
                                      style={{ color: colors.textPrimary }}
                                    >
                                      {fmt(val)}
                                    </span>
                                    <span
                                      className="text-xs"
                                      style={{
                                        color: colors.textTertiary,
                                        minWidth: 40,
                                        textAlign: "right",
                                      }}
                                    >
                                      {(pct * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      height: 4,
                                      borderRadius: 99,
                                      backgroundColor: colors.warmLinen,
                                      overflow: "hidden",
                                      marginLeft: 22,
                                    }}
                                  >
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct * 100}%` }}
                                      transition={{
                                        duration: 0.5,
                                        ease: "easeOut" as const,
                                      }}
                                      style={{
                                        height: "100%",
                                        borderRadius: 99,
                                        backgroundColor: color,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* vs. Monthly Budget table */}
                      {monthBudgetRows.length > 0 && (
                        <>
                          <hr
                            style={{
                              margin: "24px 0",
                              borderColor: colors.border,
                            }}
                          />
                          <p
                            className="text-sm font-semibold mb-4"
                            style={{ color: colors.textPrimary }}
                          >
                            vs. Monthly Budget
                          </p>
                          <div style={{ overflowX: "auto" }}>
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "13px",
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    borderBottom: `1px solid ${colors.border}`,
                                  }}
                                >
                                  {[
                                    "Category",
                                    "Budgeted",
                                    "Spent",
                                    "Variance",
                                    "Usage",
                                  ].map((h) => (
                                    <th
                                      key={h}
                                      className="text-left py-2 px-3"
                                      style={{
                                        color: colors.textSecondary,
                                        fontWeight: 600,
                                        fontSize: "11px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                      }}
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {monthBudgetRows.map((row) => (
                                  <tr
                                    key={row.cat}
                                    style={{
                                      borderBottom: `1px solid ${colors.border}`,
                                    }}
                                  >
                                    <td
                                      className="py-3 px-3"
                                      style={{ color: colors.textPrimary }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            backgroundColor: row.color,
                                            flexShrink: 0,
                                          }}
                                        />
                                        {row.cat}
                                      </div>
                                    </td>
                                    <td
                                      className="py-3 px-3"
                                      style={{ color: colors.textSecondary }}
                                    >
                                      {row.planned > 0 ? fmt(row.planned) : "—"}
                                    </td>
                                    <td
                                      className="py-3 px-3"
                                      style={{ color: colors.textSecondary }}
                                    >
                                      {fmt(row.actual)}
                                    </td>
                                    <td
                                      className="py-3 px-3"
                                      style={{
                                        color:
                                          row.planned === 0
                                            ? colors.textTertiary
                                            : row.over
                                              ? colors.error
                                              : colors.success,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {row.planned === 0
                                        ? "—"
                                        : (row.over ? "-" : "+") +
                                          fmt(Math.abs(row.variance))}
                                    </td>
                                    <td
                                      className="py-3 px-3"
                                      style={{ minWidth: "140px" }}
                                    >
                                      {row.pct === null ? (
                                        <span
                                          style={{
                                            color: colors.textTertiary,
                                            fontSize: "12px",
                                          }}
                                        >
                                          —
                                        </span>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <div
                                            style={{
                                              flex: 1,
                                              height: "6px",
                                              borderRadius: "99px",
                                              backgroundColor: colors.warmLinen,
                                              overflow: "hidden",
                                            }}
                                          >
                                            <div
                                              style={{
                                                width: `${Math.min(row.pct, 1) * 100}%`,
                                                height: "100%",
                                                borderRadius: "99px",
                                                backgroundColor: row.over
                                                  ? colors.error
                                                  : colors.mistyForest,
                                                transition: "width 0.4s ease",
                                              }}
                                            />
                                          </div>
                                          <span
                                            style={{
                                              color: row.over
                                                ? colors.error
                                                : colors.textSecondary,
                                              fontSize: "12px",
                                              minWidth: "38px",
                                              textAlign: "right",
                                            }}
                                          >
                                            {(row.pct * 100).toFixed(0)}%
                                          </span>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr
                                  style={{ backgroundColor: colors.warmLinen }}
                                >
                                  <td
                                    className="py-3 px-3 font-bold"
                                    style={{ color: colors.textPrimary }}
                                  >
                                    Total
                                  </td>
                                  <td
                                    className="py-3 px-3 font-bold"
                                    style={{ color: colors.textPrimary }}
                                  >
                                    {monthBudgetPlanned > 0
                                      ? fmt(monthBudgetPlanned)
                                      : "—"}
                                  </td>
                                  <td
                                    className="py-3 px-3 font-bold"
                                    style={{ color: colors.textPrimary }}
                                  >
                                    {fmt(monthBudgetActual)}
                                  </td>
                                  <td
                                    className="py-3 px-3 font-bold"
                                    style={{
                                      color:
                                        monthBudgetVariance < 0
                                          ? colors.error
                                          : colors.success,
                                    }}
                                  >
                                    {monthBudgetPlanned === 0
                                      ? "—"
                                      : (monthBudgetVariance < 0 ? "-" : "+") +
                                        fmt(Math.abs(monthBudgetVariance))}
                                  </td>
                                  <td className="py-3 px-3">
                                    {monthBudgetPlanned > 0 && (
                                      <div className="flex items-center gap-2">
                                        <div
                                          style={{
                                            flex: 1,
                                            height: "6px",
                                            borderRadius: "99px",
                                            backgroundColor: colors.border,
                                            overflow: "hidden",
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: `${Math.min(monthBudgetPlanned > 0 ? monthBudgetActual / monthBudgetPlanned : 0, 1) * 100}%`,
                                              height: "100%",
                                              borderRadius: "99px",
                                              backgroundColor:
                                                monthBudgetActual >
                                                monthBudgetPlanned
                                                  ? colors.error
                                                  : colors.mistyForest,
                                            }}
                                          />
                                        </div>
                                        <span
                                          style={{
                                            color: colors.textSecondary,
                                            fontSize: "12px",
                                            minWidth: "38px",
                                            textAlign: "right",
                                          }}
                                        >
                                          {(monthBudgetPlanned > 0
                                            ? (monthBudgetActual /
                                                monthBudgetPlanned) *
                                              100
                                            : 0
                                          ).toFixed(0)}
                                          %
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Trend view */}
      {view === "trend" && (
        <div style={{ ...cardStyle, padding: "24px" }}>
          <p
            className="text-sm font-semibold mb-6"
            style={{ color: colors.textPrimary }}
          >
            Monthly Spend Trend
          </p>
          {trendMonths.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: colors.textTertiary }}
            >
              No expenses found.
            </p>
          ) : (
            <div className="space-y-4">
              {trendMonths.map((monthKey) => {
                const monthTotal = trendByMonth[monthKey].reduce(
                  (s, e) => s + Number(e.amount),
                  0,
                );
                const pct = monthTotal / maxMonthTotal;
                return (
                  <div
                    key={monthKey}
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      className="text-sm"
                      style={{
                        color: colors.textSecondary,
                        minWidth: 110,
                        flexShrink: 0,
                      }}
                    >
                      {formatMonthLabel(monthKey)}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 28,
                        backgroundColor: colors.warmLinen,
                        borderRadius: radius.sm,
                        overflow: "hidden",
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" as const }}
                        style={{
                          height: "100%",
                          backgroundColor: colors.mistyForest,
                          borderRadius: radius.sm,
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: colors.textPrimary,
                        minWidth: 80,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {fmt(monthTotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <DetailSidebar
        isOpen={editingId !== null}
        onClose={() => {
          setEditingId(null);
          setEditValues({});
        }}
        title="Edit Expense"
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              style={btnGhost}
              onClick={() => {
                setEditingId(null);
                setEditValues({});
              }}
            >
              Cancel
            </button>
            <button
              style={btnPrimary}
              disabled={saving}
              onClick={() => saveEdit(editingId!)}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: colors.textSecondary }}
            >
              Category
            </label>
            <select
              style={inputStyle}
              value={editValues.category ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, category: e.target.value }))
              }
            >
              {Array.from(
                new Set([
                  ...(editValues.category &&
                  !CATEGORIES.includes(editValues.category)
                    ? [editValues.category]
                    : []),
                  ...CATEGORIES,
                ]),
              ).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: colors.textSecondary }}
            >
              Expense Name
            </label>
            <input
              style={inputStyle}
              value={editValues.expense_name ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, expense_name: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: colors.textSecondary }}
            >
              Amount ($)
            </label>
            <input
              style={inputStyle}
              type="number"
              value={editValues.amount ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, amount: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: colors.textSecondary }}
            >
              Date
            </label>
            <DatePicker
              value={editValues.expense_date ?? ""}
              onChange={(v) =>
                setEditValues((prev) => ({ ...prev, expense_date: v }))
              }
            />
          </div>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: colors.textSecondary }}
            >
              Payment Method
            </label>
            <input
              style={inputStyle}
              value={editValues.payment_method ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, payment_method: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: colors.textSecondary }}
            >
              Notes
            </label>
            <input
              style={inputStyle}
              value={editValues.notes ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, notes: e.target.value }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-tax-deductible"
              checked={editValues.tax_deductible ?? false}
              onChange={(e) =>
                setEditValues((v) => ({
                  ...v,
                  tax_deductible: e.target.checked,
                }))
              }
            />
            <label
              htmlFor="edit-tax-deductible"
              className="text-xs"
              style={{ color: colors.textSecondary }}
            >
              Tax Deductible
            </label>
          </div>

          {/* Receipts & Screenshots */}
          <div
            style={{
              borderTop: `1px solid ${colors.border}`,
              paddingTop: 16,
              marginTop: 8,
            }}
          >
            <p
              className="text-xs font-semibold mb-3"
              style={{
                color: colors.textPrimary,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Receipts &amp; Screenshots
            </p>

            {/* File list */}
            {isLoadingReceipts ? (
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Loading…
              </p>
            ) : receiptFiles.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                {receiptFiles.map((f) => {
                  const filePath = `expenses/${editingId}/${f.name}`;
                  return (
                    <div
                      key={f.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        background: colors.softCloud,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.sm,
                      }}
                    >
                      <FileText
                        size={14}
                        style={{ color: colors.textSecondary, flexShrink: 0 }}
                      />
                      <span
                        className="text-xs"
                        style={{
                          color: colors.textPrimary,
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {f.name.replace(/^\d+-/, "")}
                      </span>
                      <button
                        onClick={() => handleReceiptDownload(filePath, f.name)}
                        disabled={loadingPreviewPath === filePath}
                        style={{
                          background: "none",
                          border: "none",
                          cursor:
                            loadingPreviewPath === filePath
                              ? "not-allowed"
                              : "pointer",
                          padding: 2,
                          color: colors.textSecondary,
                          opacity: loadingPreviewPath === filePath ? 0.4 : 1,
                          flexShrink: 0,
                        }}
                      >
                        <Download size={13} />
                      </button>
                      <button
                        onClick={() => handleReceiptDelete(filePath)}
                        disabled={deletingReceiptPath === filePath}
                        style={{
                          background: "none",
                          border: "none",
                          cursor:
                            deletingReceiptPath === filePath
                              ? "not-allowed"
                              : "pointer",
                          padding: 2,
                          color: colors.textSecondary,
                          opacity: deletingReceiptPath === filePath ? 0.4 : 1,
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Drop zone */}
            {receiptFiles.length < MAX_RECEIPT_FILES && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingReceipt(true);
                }}
                onDragLeave={() => setIsDraggingReceipt(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingReceipt(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleReceiptUpload(file);
                }}
                onClick={() => receiptInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDraggingReceipt ? colors.mistyForest : colors.border}`,
                  borderRadius: radius.sm,
                  padding: "16px 12px",
                  textAlign: "center",
                  cursor: isUploadingReceipt ? "not-allowed" : "pointer",
                  background: isDraggingReceipt
                    ? colors.pastelSage + "30"
                    : colors.softCloud,
                  transition: "border-color 0.15s, background 0.15s",
                  opacity: isUploadingReceipt ? 0.6 : 1,
                }}
              >
                <Upload
                  size={18}
                  style={{ color: colors.textSecondary, margin: "0 auto 6px" }}
                />
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {isUploadingReceipt
                    ? "Uploading…"
                    : "Drop a file or click to upload"}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: colors.textSecondary,
                    opacity: 0.6,
                    marginTop: 2,
                  }}
                >
                  PDF, JPEG, PNG, WEBP, HEIC · max 10 MB
                </p>
              </div>
            )}

            <input
              ref={receiptInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleReceiptUpload(file);
                e.target.value = "";
              }}
            />

            {receiptError && (
              <p className="text-xs mt-2" style={{ color: "#ef4444" }}>
                {receiptError}
              </p>
            )}
          </div>
        </div>
      </DetailSidebar>
    </div>
  );
}

// ─── Revenue Tab ──────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  tuition: "Tuition",
  aftercare: "After Care",
  fun_friday: "Field Day Friday",
  summer: "Summer Program",
  registration_fee: "Registration Fee",
  supply_fee: "Supply Fee",
  late_fee: "Late Fee",
  donation: "Donation",
  fundraiser: "Fundraiser",
  grant: "Grant / Sponsorship",
  field_trip_fee: "Field Trip Fee",
  uniform_fee: "Uniform / Spirit Wear",
  extended_care: "Extended Care (Drop-in)",
  event: "Event / Workshop",
  other: "Other",
};

const TUITION_RATES = {
  full_14: 1095,
  full_primary: 1195,
  aftercare_enrolled: 375,
  aftercare_non: 475,
  fun_friday: 200,
  summer_14_wk: 350,
  summer_primary_wk: 375,
};

function RevenueTab({
  transactions,
  onRefresh,
}: {
  transactions: StripeTransaction[];
  onRefresh: () => void;
}) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<StripeTransaction | null>(null);
  const [hideExcluded, setHideExcluded] = useState(true);
  const [students, setStudents] = useState<
    { id: string; child_legal_name: string | null }[]
  >([]);
  const [parents, setParents] = useState<
    {
      id: string;
      full_name: string | null;
      email: string;
      g1_cell_phone: string | null;
    }[]
  >([]);
  const [enrollment, setEnrollment] = useState({
    full_14: 0,
    full_primary: 0,
    aftercare: 0,
    fun_friday: 0,
    summer: 0,
  });
  const [view, setView] = useState<"monthly" | "type">("monthly");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    async function fetchLists() {
      const [studentsData, parentsData] = await Promise.all([
        fetchBudgetStudents(),
        fetchBudgetParents(),
      ]);
      setStudents(studentsData);
      setParents(parentsData);
    }
    fetchLists();
  }, []);

  const totalActual = transactions
    .filter((tx) => !tx.exclude_from_revenue)
    .reduce((s, tx) => {
      const net = tx.cover_fees
        ? (tx.intended_amount_cents ?? tx.amount_cents)
        : tx.amount_cents;
      return s + net / 100;
    }, 0);

  const projectedRevenue =
    enrollment.full_14 * TUITION_RATES.full_14 +
    enrollment.full_primary * TUITION_RATES.full_primary +
    enrollment.aftercare * TUITION_RATES.aftercare_enrolled +
    enrollment.fun_friday * TUITION_RATES.fun_friday +
    enrollment.summer * TUITION_RATES.summer_14_wk;

  function txNet(tx: StripeTransaction) {
    return (
      (tx.cover_fees
        ? (tx.intended_amount_cents ?? tx.amount_cents)
        : tx.amount_cents) / 100
    );
  }

  const visibleTx = transactions.filter(
    (tx) =>
      !tx.exclude_from_revenue &&
      (tx.metadata as Record<string, string> | null)?.is_sibling_split !== "true" &&
      (tx.metadata as Record<string, string> | null)?.bundled_with_supply_fee !== "true",
  );

  const byMonth = visibleTx.reduce<Record<string, StripeTransaction[]>>(
    (acc, tx) => {
      const key = tx.created_at.slice(0, 7);
      (acc[key] ??= []).push(tx);
      return acc;
    },
    {},
  );
  const revenueMonths = Object.keys(byMonth).sort().reverse();

  function toggleMonth(key: string) {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function formatMonthLabel(key: string) {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  }

  const byType = visibleTx.reduce<Record<string, number>>((acc, tx) => {
    const t = tx.payment_type ?? "other";
    acc[t] = (acc[t] ?? 0) + txNet(tx);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header: title + controls */}
      <div className="flex items-center justify-between">
        <p
          className="text-sm font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Revenue (Stripe Transactions)
        </p>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div
            style={{
              display: "inline-flex",
              borderRadius: radius.md,
              border: `1px solid ${colors.border}`,
              overflow: "hidden",
              backgroundColor: colors.warmLinen,
            }}
          >
            {(["monthly", "type"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "6px 16px",
                  fontSize: "13px",
                  fontWeight: view === v ? 600 : 400,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor:
                    view === v ? colors.mistyForest : "transparent",
                  color: view === v ? "white" : colors.textSecondary,
                  transition: "all 0.15s",
                }}
              >
                {v === "monthly" ? "Monthly" : "By Type"}
              </button>
            ))}
          </div>
          {/* Show/Hide Excluded (monthly view only) */}
          {view === "monthly" && (
            <button
              onClick={() => setHideExcluded(!hideExcluded)}
              style={{
                backgroundColor: hideExcluded
                  ? colors.mistyForest
                  : "transparent",
                color: hideExcluded ? "#fff" : colors.textSecondary,
                border: `1px solid ${hideExcluded ? colors.mistyForest : colors.border}`,
                borderRadius: "99px",
                padding: "4px 12px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {hideExcluded ? "Show Excluded" : "Hide Excluded"}
            </button>
          )}
        </div>
      </div>

      {/* Monthly view */}
      {view === "monthly" && (
        <Table
          headers={[
            "Date",
            "Type",
            "Student",
            "Application",
            "Payer",
            "Net Amount",
          ]}
        >
          {(() => {
            const displayTx = hideExcluded
              ? transactions.filter((tx) => !tx.exclude_from_revenue)
              : transactions;
            const displayByMonth = displayTx.reduce<
              Record<string, StripeTransaction[]>
            >((acc, tx) => {
              const key = tx.created_at.slice(0, 7);
              (acc[key] ??= []).push(tx);
              return acc;
            }, {});
            const displayMonths = Object.keys(displayByMonth).sort().reverse();
            return displayMonths.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  {hideExcluded
                    ? "All transactions are excluded."
                    : "No transactions yet."}
                </td>
              </tr>
            ) : (
              <>
                {displayMonths.map((monthKey) => {
                  const monthTxs = displayByMonth[monthKey];
                  const monthTotal = monthTxs.reduce(
                    (s, tx) => s + txNet(tx),
                    0,
                  );
                  const isCollapsed = collapsedMonths.has(monthKey);
                  return (
                    <React.Fragment key={monthKey}>
                      {/* Month header row */}
                      <tr
                        style={{
                          backgroundColor: "#F6F1E8",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleMonth(monthKey)}
                      >
                        <td colSpan={6} style={{ padding: "10px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: colors.textSecondary,
                                  transform: isCollapsed
                                    ? "rotate(-90deg)"
                                    : "rotate(0deg)",
                                  display: "inline-block",
                                  transition: "transform 0.2s",
                                }}
                              >
                                ▾
                              </span>
                              <span
                                className="text-sm font-bold"
                                style={{ color: colors.textPrimary }}
                              >
                                {formatMonthLabel(monthKey)}
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: colors.textSecondary }}
                              >
                                ({monthTxs.length} transaction
                                {monthTxs.length !== 1 ? "s" : ""})
                              </span>
                            </div>
                            <span
                              className="text-sm font-bold"
                              style={{ color: colors.success }}
                            >
                              {fmt(monthTotal)}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* Transaction rows */}
                      {!isCollapsed &&
                        monthTxs.map((tx, i) => (
                          <TableRow
                            key={tx.id}
                            index={i}
                            onClick={() => setSelectedTransaction(tx)}
                            style={{
                              cursor: "pointer",
                              opacity: tx.exclude_from_revenue ? 0.5 : 1,
                            }}
                          >
                            <TableCell>
                              {new Date(tx.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                style={{
                                  backgroundColor: colors.pastelSage,
                                  color: colors.mistyForest,
                                  borderRadius: "99px",
                                  padding: "2px 8px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                }}
                              >
                                {formatPaymentType(tx.payment_type)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const primaryName = tx.student_id
                                  ? (students.find((s) => s.id === tx.student_id)?.child_legal_name ?? tx.student_id)
                                  : "—";
                                const meta = (tx.metadata ?? {}) as Record<string, string>;
                                const sibIds = meta.sibling_student_ids?.split(",").filter(Boolean) ?? [];
                                if (sibIds.length === 0) return primaryName;
                                const sibNames = sibIds
                                  .map((id) => students.find((s) => s.id === id)?.child_legal_name)
                                  .filter(Boolean);
                                return sibNames.length > 0
                                  ? [primaryName, ...sibNames].join(", ")
                                  : primaryName;
                              })()}
                            </TableCell>
                            <TableCell>
                              {tx.application_id ? "✓" : "—"}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const effectiveParentId =
                                  tx.parent_id ??
                                  (tx.metadata?.parent_id as string | null) ??
                                  null;
                                return (
                                  tx.payer_name ||
                                  tx.payer_email ||
                                  (effectiveParentId
                                    ? (parents.find(
                                        (p) => p.id === effectiveParentId,
                                      )?.email ?? "—")
                                    : "—")
                                );
                              })()}
                            </TableCell>
                            <TableCell
                              className="font-semibold"
                              style={{
                                color: tx.exclude_from_revenue
                                  ? "#9CA3AF"
                                  : colors.success,
                              }}
                            >
                              <span className="flex items-center gap-2">
                                {formatCents(
                                  tx.cover_fees
                                    ? tx.intended_amount_cents
                                    : tx.amount_cents,
                                  tx.currency,
                                )}
                                {tx.exclude_from_revenue && (
                                  <span
                                    style={{
                                      backgroundColor: "#FEF3C7",
                                      color: "#D97706",
                                      borderRadius: "99px",
                                      padding: "1px 6px",
                                      fontSize: "10px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Excluded
                                  </span>
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                    </React.Fragment>
                  );
                })}
              </>
            );
          })()}
          {/* Total row */}
          <tr
            style={{
              backgroundColor: "#F6F1E8",
              borderTop: `1px solid #E8E4DF`,
            }}
          >
            <td
              colSpan={5}
              className="px-4 py-3 text-sm font-bold"
              style={{ color: colors.textPrimary }}
            >
              Total
            </td>
            <td
              className="px-4 py-3 text-sm font-bold"
              style={{ color: colors.success }}
            >
              {fmt(totalActual)}
            </td>
          </tr>
        </Table>
      )}

      {/* By Type view */}
      {view === "type" && (
        <div style={{ ...cardStyle, padding: "24px" }}>
          <p
            className="text-sm font-semibold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Revenue by Type
          </p>
          {visibleTx.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: colors.textTertiary }}
            >
              No transactions yet.
            </p>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Donut SVG */}
              <div style={{ flexShrink: 0 }}>
                <svg width={220} height={220}>
                  {(() => {
                    const cx = 110,
                      cy = 110;
                    const typeEntries = Object.entries(byType).sort(
                      ([, a], [, b]) => b - a,
                    );
                    let cumulative = 0;
                    const slices = typeEntries.map(([t, val], i) => {
                      const pct = totalActual > 0 ? val / totalActual : 0;
                      const dashLen = pct * CIRC;
                      const offset = CIRC - cumulative - CIRC / 4;
                      cumulative += dashLen;
                      return {
                        t,
                        val,
                        pct,
                        dashLen,
                        offset,
                        color: SLICE_COLORS[i % SLICE_COLORS.length],
                      };
                    });
                    return (
                      <>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={RADIUS}
                          fill="none"
                          stroke={colors.warmLinen}
                          strokeWidth={30}
                        />
                        {slices.map((slice, i) => (
                          <motion.circle
                            key={slice.t}
                            cx={cx}
                            cy={cy}
                            r={RADIUS}
                            fill="none"
                            stroke={slice.color}
                            strokeWidth={30}
                            strokeDasharray={`${slice.dashLen} ${CIRC}`}
                            strokeDashoffset={slice.offset}
                            initial={{ strokeDasharray: `0 ${CIRC}` }}
                            animate={{
                              strokeDasharray: `${slice.dashLen} ${CIRC}`,
                            }}
                            transition={{
                              duration: 0.6,
                              delay: i * 0.08,
                              ease: "easeOut" as const,
                            }}
                          />
                        ))}
                        <circle cx={cx} cy={cy} r={50} fill="white" />
                        <text
                          x={cx}
                          y={cy - 6}
                          textAnchor="middle"
                          fontSize="13"
                          fontWeight="700"
                          fill={colors.textPrimary}
                        >
                          {fmt(totalActual)}
                        </text>
                        <text
                          x={cx}
                          y={cy + 12}
                          textAnchor="middle"
                          fontSize="10"
                          fill={colors.textSecondary}
                        >
                          total revenue
                        </text>
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Type list */}
              <div className="flex-1 space-y-3" style={{ minWidth: 0 }}>
                {Object.entries(byType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([t, val], i) => {
                    const pct = totalActual > 0 ? val / totalActual : 0;
                    const color = SLICE_COLORS[i % SLICE_COLORS.length];
                    return (
                      <div key={t} className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              backgroundColor: color,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            className="text-sm flex-1"
                            style={{ color: colors.textSecondary }}
                          >
                            {SOURCE_LABELS[t] ?? formatPaymentType(t)}
                          </span>
                          <span
                            className="text-sm font-medium"
                            style={{ color: colors.textPrimary }}
                          >
                            {fmt(val)}
                          </span>
                          <span
                            className="text-xs"
                            style={{
                              color: colors.textTertiary,
                              minWidth: 40,
                              textAlign: "right",
                            }}
                          >
                            {(pct * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div
                          style={{
                            height: 4,
                            borderRadius: 99,
                            backgroundColor: colors.warmLinen,
                            overflow: "hidden",
                            marginLeft: 22,
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct * 100}%` }}
                            transition={{
                              duration: 0.5,
                              ease: "easeOut" as const,
                            }}
                            style={{
                              height: "100%",
                              borderRadius: 99,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enrollment Revenue Projections — commented out for now */}
      {/*
      <div style={{ ...cardStyle, padding: "24px" }}>
        <p
          className="text-sm font-semibold mb-4"
          style={{ color: colors.textPrimary }}
        >
          Enrollment Revenue Projections
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            { key: "full_14", label: "Full Enrollment (1st–4th)", rate: TUITION_RATES.full_14 },
            { key: "full_primary", label: "Full Enrollment (Primary)", rate: TUITION_RATES.full_primary },
            { key: "aftercare", label: "After Care (enrolled rate)", rate: TUITION_RATES.aftercare_enrolled },
            { key: "fun_friday", label: "Field Day Friday", rate: TUITION_RATES.fun_friday },
            { key: "summer", label: "Summer (per week)", rate: TUITION_RATES.summer_14_wk },
          ].map(({ key, label, rate }) => (
            <div key={key}>
              <label className="text-xs mb-1 block" style={{ color: colors.textSecondary }}>
                {label} <span style={{ color: colors.textTertiary }}>({fmt(rate)}/mo)</span>
              </label>
              <input
                style={{ ...inputStyle, width: "80px" }}
                type="number"
                min="0"
                value={(enrollment as Record<string, number>)[key]}
                onChange={(e) => setEnrollment((p) => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
              />
              <span className="ml-2 text-xs" style={{ color: colors.success }}>
                = {fmt((enrollment as Record<string, number>)[key] * rate)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: colors.pastelSage }}>
          <div>
            <p className="text-xs font-medium" style={{ color: colors.mistyForest }}>Projected Monthly Revenue</p>
            <p className="text-2xl font-bold" style={{ color: colors.mistyForest }}>{fmt(projectedRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium" style={{ color: colors.mistyForest }}>Actual Revenue</p>
            <p className="text-2xl font-bold" style={{ color: colors.mistyForest }}>{fmt(totalActual)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium" style={{ color: colors.mistyForest }}>Difference</p>
            <p className="text-2xl font-bold" style={{ color: totalActual >= projectedRevenue ? colors.success : colors.error }}>
              {fmt(totalActual - projectedRevenue)}
            </p>
          </div>
        </div>
      </div>
      */}

      <TransactionDetailSidebar
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onDeleted={() => {
          setSelectedTransaction(null);
          onRefresh();
        }}
        onExclusionToggled={() => onRefresh()}
      />
    </div>
  );
}

// ─── Taxes Tab ────────────────────────────────────────────────────────────────

function TaxesTab({
  expenses,
  income,
}: {
  expenses: BudgetExpense[];
  income: BudgetIncome[];
}) {
  const [federalRate, setFederalRate] = useState(21);
  const [txRate, setTxRate] = useState(0.375);
  const [totalTaxRate, setTotalTaxRate] = useState(25);

  const totalRevenue = income.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const taxReserve = Math.max(netProfit * (totalTaxRate / 100), 0);

  // Payroll
  const staff1Gross = 112 * 20;
  const staff2Gross = 128 * 25;
  const ownerPay = 2500;

  const ficaRate = 0.0765;
  const selfEmpRate = 0.153;

  const staff1FICA = staff1Gross * ficaRate;
  const staff2FICA = staff2Gross * ficaRate;
  const ownerSE = ownerPay * selfEmpRate;

  const totalPayrollTax = staff1FICA + staff2FICA + ownerSE;

  // Quarterly estimates (simple: annual profit / 4 × rate)
  const annualProfit = netProfit * 12;
  const quarterlyTax = Math.max((annualProfit * (totalTaxRate / 100)) / 4, 0);

  const quarters = [
    { q: "Q1 (Apr 15)", amount: quarterlyTax },
    { q: "Q2 (Jun 15)", amount: quarterlyTax },
    { q: "Q3 (Sep 15)", amount: quarterlyTax },
    { q: "Q4 (Jan 15)", amount: quarterlyTax },
  ];

  return (
    <div className="space-y-6">
      {/* Tax rate controls */}
      <div style={{ ...cardStyle, padding: "24px" }}>
        <p
          className="text-sm font-semibold mb-4"
          style={{ color: colors.textPrimary }}
        >
          Tax Rate Settings
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            {
              label: "Federal Corporate Rate (%)",
              value: federalRate,
              min: 0,
              max: 50,
              step: 1,
              setter: setFederalRate,
            },
            {
              label: "TX Franchise Tax Rate (%)",
              value: txRate,
              min: 0,
              max: 5,
              step: 0.125,
              setter: setTxRate,
            },
            {
              label: "Total Reserve % (of profit)",
              value: totalTaxRate,
              min: 0,
              max: 50,
              step: 1,
              setter: setTotalTaxRate,
            },
          ].map(({ label, value, min, max, step, setter }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <label
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  {label}
                </label>
                <span
                  className="text-xs font-semibold"
                  style={{ color: colors.mistyForest }}
                >
                  {value}%
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                style={{ width: "100%", accentColor: colors.mistyForest }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Monthly reserve summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MiniStat
          label="Current Month Profit"
          value={fmt(netProfit)}
          color={netProfit >= 0 ? colors.success : colors.error}
        />
        <MiniStat
          label={`Tax Reserve (${totalTaxRate}% of profit)`}
          value={fmt(taxReserve)}
          color={colors.warning}
          delay={0.05}
        />
        <MiniStat
          label="After-Tax Net"
          value={fmt(Math.max(netProfit - taxReserve, 0))}
          color={colors.mistyForest}
          delay={0.1}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quarterly calendar */}
        <div style={{ ...cardStyle, padding: "24px" }}>
          <p
            className="text-sm font-semibold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Estimated Quarterly Tax Payments
          </p>
          <p className="text-xs mb-4" style={{ color: colors.textSecondary }}>
            Based on annualized profit × {totalTaxRate}% ÷ 4
          </p>
          <div className="space-y-3">
            {quarters.map(({ q, amount }) => (
              <div
                key={q}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: colors.warmLinen }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  {q}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: colors.warning }}
                >
                  {fmt(amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payroll tax breakdown */}
        <div style={{ ...cardStyle, padding: "24px" }}>
          <p
            className="text-sm font-semibold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Payroll Tax Breakdown (Monthly)
          </p>
          <div className="space-y-3">
            {[
              {
                label: "Staff 1 (112 hrs × $20)",
                gross: staff1Gross,
                tax: staff1FICA,
                note: "Employer FICA 7.65%",
              },
              {
                label: "Staff 2 (128 hrs × $25)",
                gross: staff2Gross,
                tax: staff2FICA,
                note: "Employer FICA 7.65%",
              },
              {
                label: "Owner ($2,500 draw)",
                gross: ownerPay,
                tax: ownerSE,
                note: "Self-employment tax 15.3%",
              },
            ].map(({ label, gross, tax, note }) => (
              <div
                key={label}
                className="p-3 rounded-lg"
                style={{
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.softCloud,
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: colors.textPrimary }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: colors.textTertiary }}
                    >
                      {note}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      Gross: {fmt(gross)}
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: colors.error }}
                    >
                      Tax: {fmt(tax)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div
              className="flex justify-between p-3 rounded-lg"
              style={{ backgroundColor: colors.pastelSage }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: colors.mistyForest }}
              >
                Total Employer Payroll Taxes
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: colors.mistyForest }}
              >
                {fmt(totalPayrollTax)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analysis Tab ─────────────────────────────────────────────────────────────

function MixSummary({
  mixTotal,
  goal,
  label,
  budget,
  targetProfit,
  onReset,
  unit = "/mo",
}: {
  mixTotal: number;
  goal: number;
  label: string;
  budget: number;
  targetProfit: number;
  onReset: () => void;
  unit?: string;
}) {
  const mixProfit = mixTotal - budget;
  const diff = mixTotal - goal;
  const surplus = diff >= 0;
  const barPct = Math.min(mixTotal / (goal * 1.5), 1);
  const barColor = surplus
    ? "#5E7C68"
    : mixTotal / goal >= 0.5
      ? "#C07A4A"
      : "#C0524A";
  const profitColor =
    mixProfit >= targetProfit
      ? colors.success
      : mixProfit >= targetProfit * 0.85
        ? "#C07A4A"
        : colors.error;
  return (
    <div
      style={{
        marginTop: 16,
        padding: "16px",
        borderRadius: 10,
        backgroundColor: colors.softCloud,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: colors.textSecondary }}
        >
          {label} mix summary
        </span>
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 11,
            color: colors.textTertiary,
            textDecoration: "underline",
            padding: 0,
          }}
        >
          Reset to zero
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-xs mb-0.5" style={{ color: colors.textTertiary }}>
            Revenue
          </p>
          <p
            className="text-sm font-bold"
            style={{ color: colors.textPrimary }}
          >
            {fmt(mixTotal)}
            {unit}
          </p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: colors.textTertiary }}>
            Projected profit
          </p>
          <p className="text-sm font-bold" style={{ color: profitColor }}>
            {fmt(mixProfit)}
            {unit}
          </p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: colors.textTertiary }}>
            Your goal
          </p>
          <p
            className="text-sm font-bold"
            style={{ color: colors.textPrimary }}
          >
            {fmt(targetProfit)}
            {unit}
          </p>
        </div>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 99,
          backgroundColor: colors.warmLinen,
          overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ width: `${barPct * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
          style={{
            height: "100%",
            borderRadius: 99,
            backgroundColor: barColor,
          }}
        />
      </div>
      <p
        className="text-xs mt-2 font-medium"
        style={{ color: surplus ? colors.success : colors.error }}
      >
        {surplus ? `+${fmt(diff)} above goal` : `${fmt(diff)} below goal`}
      </p>
    </div>
  );
}

function RevenueGoalHeader({
  revenueGoal,
  mixTotal,
  budget,
  targetProfit,
  label = "School Year · 10 months · Mon–Thu",
  fullSeasonMonthlyCredit,
  unit = "/mo",
}: {
  revenueGoal: number;
  mixTotal: number;
  budget: number;
  targetProfit: number;
  label?: string;
  fullSeasonMonthlyCredit?: number;
  unit?: string;
}) {
  const netGoal = Math.max(0, revenueGoal - (fullSeasonMonthlyCredit ?? 0));
  const diff = mixTotal - netGoal;
  const surplus = diff >= 0;
  const barPct = netGoal === 0 ? 1 : Math.min(mixTotal / netGoal, 1);
  const barColor =
    barPct >= 1 ? "#5E7C68" : barPct >= 0.75 ? "#C07A4A" : "#C0524A";
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-0.5"
            style={{ color: colors.textSecondary }}
          >
            {label}
          </p>
          <p className="text-xs" style={{ color: colors.textTertiary }}>
            Adjust enrollments below to track toward your revenue target.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p className="text-xs mb-0.5" style={{ color: colors.textTertiary }}>
            Revenue needed
          </p>
          <p
            className="text-xl font-bold"
            style={{ color: colors.mistyForest }}
          >
            {fmt(netGoal)}
            {unit}
          </p>
          <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
            {fullSeasonMonthlyCredit
              ? `${fmt(budget)} budget + ${fmt(targetProfit)} profit − ${fmt(fullSeasonMonthlyCredit)} full season`
              : `${fmt(budget)} budget + ${fmt(targetProfit)} profit`}
          </p>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          height: 8,
          borderRadius: 99,
          backgroundColor: colors.warmLinen,
        }}
      >
        <motion.div
          animate={{ width: `${barPct * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
          style={{
            height: "100%",
            borderRadius: 99,
            backgroundColor: barColor,
            maxWidth: "100%",
          }}
        />
        {/* Goal line at 100% */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: -4,
            bottom: -4,
            width: 2,
            borderRadius: 1,
            backgroundColor: colors.mistyForest,
          }}
        />
      </div>
      <div className="flex justify-between items-baseline mt-1.5">
        <span className="text-xs" style={{ color: colors.textTertiary }}>
          Current mix:{" "}
          <strong style={{ color: colors.textPrimary }}>
            {fmt(mixTotal)}
            {unit}
          </strong>
        </span>
        <span
          className="text-xs font-semibold"
          style={{ color: surplus ? colors.success : colors.error }}
        >
          {surplus
            ? `+${fmt(diff)} above goal`
            : `${fmt(Math.abs(diff))} to go`}
        </span>
      </div>
    </div>
  );
}

function SupplementalStepper({
  label,
  rateLabel,
  rate,
  count,
  onChange,
  maxCount = 20,
}: {
  label: string;
  rateLabel: string;
  rate: number;
  count: number;
  onChange: (n: number) => void;
  maxCount?: number;
}) {
  const contribution = count * rate;
  const stepBtn: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 600,
    color: colors.textPrimary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <span
          className="text-sm font-medium"
          style={{ color: colors.textSecondary }}
        >
          {label}
        </span>
        <span className="ml-2 text-xs" style={{ color: colors.textTertiary }}>
          {rateLabel}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            style={stepBtn}
            onClick={() => onChange(Math.max(0, count - 1))}
          >
            −
          </button>
          <span
            style={{
              minWidth: 28,
              textAlign: "center",
              fontSize: 15,
              fontWeight: 700,
              color: colors.textPrimary,
            }}
          >
            {count}
          </span>
          <button
            style={stepBtn}
            onClick={() => onChange(Math.min(maxCount, count + 1))}
          >
            +
          </button>
        </div>
        <span
          className="text-sm font-semibold whitespace-nowrap"
          style={{
            color: count > 0 ? colors.mistyForest : colors.textTertiary,
            minWidth: 100,
          }}
        >
          {count > 0 ? `+${fmt(contribution)}/mo` : "not enrolled"}
        </span>
      </div>
    </div>
  );
}

function CoreSliderRow({
  label,
  rateLabel,
  contributionLabel,
  neededAlone,
  targetCount,
  onChange,
}: {
  label: string;
  rateLabel: string;
  contributionLabel: string;
  neededAlone: number;
  targetCount: number;
  onChange: (n: number) => void;
}) {
  const barPct = neededAlone > 0 ? Math.min(targetCount / neededAlone, 1) : 0;
  const barColor =
    barPct >= 1 ? "#5E7C68" : barPct >= 0.5 ? "#C07A4A" : "#C0524A";
  const covered = targetCount >= neededAlone;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-1 mb-1.5">
        <span
          className="font-medium"
          style={{ fontSize: 14, color: colors.textPrimary }}
        >
          {label}
          <span
            className="ml-2 font-normal"
            style={{ fontSize: 11, color: colors.textTertiary }}
          >
            {rateLabel}
          </span>
        </span>
        <span className="text-xs" style={{ color: colors.textTertiary }}>
          To cover budget alone: {neededAlone}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-1.5">
        <input
          type="range"
          min={0}
          max={neededAlone + 10}
          step={1}
          value={targetCount}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: colors.mistyForest }}
        />
        <div style={{ textAlign: "right" }}>
          <div
            className="text-xs font-semibold whitespace-nowrap"
            style={{ color: colors.textPrimary }}
          >
            {targetCount} students
          </div>
          <div
            className="text-xs font-medium whitespace-nowrap"
            style={{ color: colors.textSecondary }}
          >
            {contributionLabel}
          </div>
        </div>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 99,
          backgroundColor: colors.warmLinen,
          overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ width: `${barPct * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
          style={{
            height: "100%",
            borderRadius: 99,
            backgroundColor: barColor,
          }}
        />
      </div>
      {covered && (
        <p className="text-xs mt-1" style={{ color: colors.success }}>
          ✓ Budget covered by this program alone
        </p>
      )}
    </div>
  );
}

const FULL_SUMMER_14 = 3780;
const FULL_SUMMER_PRIMARY = 4050;

const SCHOOL_YEAR_RATES = [
  {
    key: "full_14",
    label: "Full Enrollment (2nd–4th)",
    rate: TUITION_RATES.full_14,
  },
  {
    key: "full_primary",
    label: "Full Enrollment (Primary, Pre-K–1st Grade)",
    rate: TUITION_RATES.full_primary,
  },
  {
    key: "aftercare_enrolled",
    label: "After Care – enrolled student",
    rate: TUITION_RATES.aftercare_enrolled,
  },
  {
    key: "fun_friday",
    label: "Field Day Friday (pkg of 4)",
    rate: TUITION_RATES.fun_friday,
  },
];

const SUMMER_WEEKLY_RATES = [
  {
    key: "summer_14_wk",
    label: "Weekly (1st–4th)",
    rate: TUITION_RATES.summer_14_wk,
  },
  {
    key: "summer_primary_wk",
    label: "Weekly Primary",
    rate: TUITION_RATES.summer_primary_wk,
  },
];

const SUMMER_SEASON_RATES = [
  {
    key: "full_season_14",
    label: "Full Season (1st–4th)",
    totalPrice: FULL_SUMMER_14,
  },
  {
    key: "full_season_primary",
    label: "Full Season Primary",
    totalPrice: FULL_SUMMER_PRIMARY,
  },
];

function SummerAnalysisTab({
  lineItems,
  expenses,
  income,
}: {
  lineItems: BudgetLineItem[];
  expenses: BudgetExpense[];
  income: BudgetIncome[];
}) {
  const totalBudget = lineItems.reduce(
    (s, i) => s + Number(i.planned_amount),
    0,
  );
  const totalRevenue = income.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, i) => s + Number(i.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  const [targetProfit, setTargetProfit] = useState(500);
  const [swWeeks, setSwWeeks] = useState(12);
  const [swStudents, setSwStudents] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      SUMMER_WEEKLY_RATES.map((r) => [
        r.key,
        Math.ceil((totalBudget + 500) / (r.rate * 4.33)),
      ]),
    ),
  );
  const [ssStudents, setSsStudents] = useState<Record<string, number>>(() =>
    Object.fromEntries(SUMMER_SEASON_RATES.map((r) => [r.key, 0])),
  );

  const netProfitColor = netProfit >= 0 ? colors.success : colors.error;

  const SEASON_WEEKS = 12;
  const SEASON_MONTHS = SEASON_WEEKS / 4.33; // ≈ 2.77

  const totalSeasonCost = totalBudget * SEASON_MONTHS;
  const seasonProfitTarget = targetProfit * SEASON_MONTHS;
  const totalSeasonGoal = totalSeasonCost + seasonProfitTarget;

  const swSeasonTotal = SUMMER_WEEKLY_RATES.reduce(
    (s, { key, rate }) => s + (swStudents[key] ?? 0) * rate * swWeeks,
    0,
  );

  const ssSeasonTotal = SUMMER_SEASON_RATES.reduce(
    (s, { key, totalPrice }) => s + (ssStudents[key] ?? 0) * totalPrice,
    0,
  );

  const netSeasonGoal = Math.max(0, totalSeasonGoal - ssSeasonTotal);

  return (
    <div className="space-y-6">
      {/* ── Hero: Profit Target Slider ── */}
      <div style={{ ...cardStyle, padding: "32px" }}>
        <div className="text-center mb-6">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: colors.textSecondary }}
          >
            I want to make
          </p>
          <p
            className="text-5xl font-bold mb-1"
            style={{ color: colors.mistyForest }}
          >
            {fmt(targetProfit)}
          </p>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            per month profit
          </p>
        </div>
        <input
          type="range"
          min={0}
          max={5000}
          step={100}
          value={targetProfit}
          onChange={(e) => setTargetProfit(Number(e.target.value))}
          style={{ width: "100%", accentColor: colors.mistyForest }}
        />
        <div
          className="flex justify-between text-xs mt-1 mb-4"
          style={{ color: colors.textTertiary }}
        >
          <span>$0</span>
          <span>$5,000</span>
        </div>
        <div className="flex justify-center">
          <div
            className="text-sm px-4 py-2 rounded-full"
            style={{ backgroundColor: colors.softCloud }}
          >
            <span style={{ color: colors.textSecondary }}>
              Current actual profit:{" "}
            </span>
            <span className="font-bold" style={{ color: netProfitColor }}>
              {fmt(netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Weekly Enrollment ── */}
      <div style={{ ...cardStyle, padding: "24px" }}>
        <RevenueGoalHeader
          revenueGoal={totalSeasonGoal}
          mixTotal={swSeasonTotal}
          budget={totalSeasonCost}
          targetProfit={seasonProfitTarget}
          label="Summer Program · 12 weeks · Mon–Thu"
          fullSeasonMonthlyCredit={ssSeasonTotal}
          unit=" for the season"
        />

        {/* Weeks attended slider */}
        <div className="flex items-center gap-4 mb-4 mt-4">
          <p
            className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
            style={{ color: colors.textSecondary }}
          >
            Weeks attended
          </p>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={swWeeks}
            onChange={(e) => setSwWeeks(Number(e.target.value))}
            style={{ flex: 1, accentColor: colors.mistyForest }}
          />
          <p
            className="text-xs font-bold whitespace-nowrap"
            style={{ color: colors.mistyForest }}
          >
            {swWeeks} {swWeeks === 1 ? "week" : "weeks"}
          </p>
        </div>

        <div
          style={{
            borderTop: `1px solid ${colors.border}`,
            margin: "20px 0",
          }}
        />

        <p
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: colors.textSecondary }}
        >
          Weekly Enrollment
        </p>
        <div className="space-y-6 mb-4">
          {SUMMER_WEEKLY_RATES.map(({ key, label, rate }) => {
            const neededAlone = Math.ceil(netSeasonGoal / (rate * swWeeks));
            const targetCount = swStudents[key] ?? 0;
            const contribution = targetCount * rate * swWeeks;
            return (
              <CoreSliderRow
                key={key}
                label={label}
                rateLabel={`${fmt(rate)}/wk`}
                contributionLabel={`${fmt(contribution)} total`}
                neededAlone={neededAlone}
                targetCount={targetCount}
                onChange={(n) => setSwStudents((p) => ({ ...p, [key]: n }))}
              />
            );
          })}
        </div>
        <MixSummary
          mixTotal={swSeasonTotal}
          goal={totalSeasonGoal}
          label="Weekly"
          budget={totalSeasonCost}
          targetProfit={seasonProfitTarget}
          unit=" total"
          onReset={() =>
            setSwStudents(
              Object.fromEntries(SUMMER_WEEKLY_RATES.map((r) => [r.key, 0])),
            )
          }
        />

        <div
          style={{
            borderTop: `1px solid ${colors.border}`,
            margin: "24px 0",
          }}
        />

        <p
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: colors.textSecondary }}
        >
          Full Season Enrollment
        </p>
        <div className="space-y-6">
          {SUMMER_SEASON_RATES.map(({ key, label, totalPrice }) => {
            const targetCount = ssStudents[key] ?? 0;
            const contribution = targetCount * totalPrice;
            return (
              <CoreSliderRow
                key={key}
                label={label}
                rateLabel={`${fmt(totalPrice)} total`}
                contributionLabel={`${fmt(contribution)} total`}
                neededAlone={0}
                targetCount={targetCount}
                onChange={(n) => setSsStudents((p) => ({ ...p, [key]: n }))}
              />
            );
          })}
        </div>
        <div
          className="mt-4 pt-3"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          <div className="flex justify-between items-baseline">
            <span className="text-xs" style={{ color: colors.textTertiary }}>
              Full season total revenue
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: colors.textPrimary }}
            >
              {fmt(
                SUMMER_SEASON_RATES.reduce(
                  (s, { key, totalPrice }) =>
                    s + (ssStudents[key] ?? 0) * totalPrice,
                  0,
                ),
              )}{" "}
              total
            </span>
          </div>
        </div>

        <p className="text-xs mt-4" style={{ color: colors.textTertiary }}>
          Registration fee: $75/student · one-time fee
        </p>
      </div>
    </div>
  );
}

function AnalysisTab({
  lineItems,
  expenses,
  income,
}: {
  lineItems: BudgetLineItem[];
  expenses: BudgetExpense[];
  income: BudgetIncome[];
}) {
  const totalBudget = lineItems.reduce(
    (s, i) => s + Number(i.planned_amount),
    0,
  );
  const totalRevenue = income.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, i) => s + Number(i.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  const [targetProfit, setTargetProfit] = useState(500);

  const [syStudents, setSyStudents] = useState<Record<string, number>>({
    full_14: 15,
    full_primary: 10,
    aftercare_enrolled: 0,
    aftercare_non: 0,
    fun_friday: 0,
  });

  const netProfitColor = netProfit >= 0 ? colors.success : colors.error;

  const CORE_SY_RATES = SCHOOL_YEAR_RATES.slice(0, 2);
  const SUPPL_SY_RATES = SCHOOL_YEAR_RATES.slice(2);

  return (
    <div className="space-y-6">
      {/* ── Hero: Profit Target Slider ── */}
      <div style={{ ...cardStyle, padding: "32px" }}>
        <div className="text-center mb-6">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: colors.textSecondary }}
          >
            I want to make
          </p>
          <p
            className="text-5xl font-bold mb-1"
            style={{ color: colors.mistyForest }}
          >
            {fmt(targetProfit)}
          </p>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            per month profit
          </p>
        </div>
        <input
          type="range"
          min={0}
          max={5000}
          step={100}
          value={targetProfit}
          onChange={(e) => setTargetProfit(Number(e.target.value))}
          style={{ width: "100%", accentColor: colors.mistyForest }}
        />
        <div
          className="flex justify-between text-xs mt-1 mb-4"
          style={{ color: colors.textTertiary }}
        >
          <span>$0</span>
          <span>$5,000</span>
        </div>
        <div className="flex justify-center">
          <div
            className="text-sm px-4 py-2 rounded-full"
            style={{ backgroundColor: colors.softCloud }}
          >
            <span style={{ color: colors.textSecondary }}>
              Current actual profit:{" "}
            </span>
            <span className="font-bold" style={{ color: netProfitColor }}>
              {fmt(netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* ── School Year Enrollment ── */}
      <div style={{ ...cardStyle, padding: "24px" }}>
        {(() => {
          const syMixTotal = SCHOOL_YEAR_RATES.reduce(
            (s, { key, rate }) => s + (syStudents[key] ?? 0) * rate,
            0,
          );
          return (
            <>
              <RevenueGoalHeader
                revenueGoal={totalBudget + targetProfit}
                mixTotal={syMixTotal}
                budget={totalBudget}
                targetProfit={targetProfit}
              />

              <div
                style={{
                  borderTop: `1px solid ${colors.border}`,
                  margin: "20px 0",
                }}
              />

              {/* Core Enrollment */}
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: colors.textSecondary }}
              >
                Core Enrollment
              </p>
              <p
                className="text-xs mb-4"
                style={{ color: colors.textTertiary }}
              >
                Full-time students are your primary revenue driver.
              </p>
              <div className="space-y-6 mb-6">
                {CORE_SY_RATES.map(({ key, label, rate }) => {
                  const neededAlone = Math.ceil(
                    (totalBudget + targetProfit) / rate,
                  );
                  const targetCount = syStudents[key] ?? 0;
                  return (
                    <CoreSliderRow
                      key={key}
                      label={label}
                      rateLabel={`${fmt(rate)}/mo`}
                      contributionLabel={`${fmt(targetCount * rate)}/mo`}
                      neededAlone={neededAlone}
                      targetCount={targetCount}
                      onChange={(n) =>
                        setSyStudents((p) => ({ ...p, [key]: n }))
                      }
                    />
                  );
                })}
              </div>

              {/* Add-On Programs */}
              <div
                style={{
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: 16,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: colors.textTertiary }}
                  >
                    Add-On Programs
                  </p>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 99,
                      backgroundColor: colors.info,
                      color: colors.infoText,
                    }}
                  >
                    bonus revenue
                  </span>
                </div>
                <p
                  className="text-xs mb-4"
                  style={{ color: colors.textTertiary }}
                >
                  These supplement core revenue — no target needed, every
                  student is a bonus.
                </p>
                <div className="space-y-4">
                  {SUPPL_SY_RATES.map(({ key, label, rate }) => (
                    <SupplementalStepper
                      key={key}
                      label={label}
                      rateLabel={`${fmt(rate)}/mo`}
                      rate={rate}
                      count={syStudents[key] ?? 0}
                      onChange={(n) =>
                        setSyStudents((p) => ({ ...p, [key]: n }))
                      }
                    />
                  ))}
                </div>
              </div>

              <MixSummary
                mixTotal={syMixTotal}
                goal={totalBudget + targetProfit}
                label="School year"
                budget={totalBudget}
                targetProfit={targetProfit}
                onReset={() =>
                  setSyStudents({
                    full_14: 0,
                    full_primary: 0,
                    aftercare_enrolled: 0,
                    aftercare_non: 0,
                    fun_friday: 0,
                  })
                }
              />
            </>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Mercury Tab ──────────────────────────────────────────────────────────────

function MercuryTab() {
  const [transactions, setTransactions] = useState<MercuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MercuryTransaction | null>(null);

  useEffect(() => {
    fetch("/api/mercury/transactions")
      .then((r) => r.json())
      .then((data) => {
        setTransactions(data.transactions ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load Mercury transactions");
        setLoading(false);
      });
  }, []);

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-24"
        style={{ color: colors.textSecondary }}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{
              borderColor: colors.mistyForest,
              borderTopColor: "transparent",
            }}
          />
          <p className="text-sm">Loading Mercury transactions…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-6 rounded-xl text-sm"
        style={{
          backgroundColor: colors.error,
          color: "#ffffff",
          border: `1px solid ${colors.error}33`,
        }}
      >
        {error}
      </div>
    );
  }

  const COUNTERPARTY_USER: Record<string, string> = {
    "Capital One - Checking ••4567": "Julius",
    "Wells Fargo - Checking ••0769": "Sage",
    "GOLDMAN SACHS BA; TRANSFER; Julius Cecilia": "Julius",
  };

  const resolveUser = (tx: MercuryTransaction, fallback: string) =>
    COUNTERPARTY_USER[tx.counterpartyName ?? ""] ??
    COUNTERPARTY_USER[tx.bankDescription ?? ""] ??
    fallback;

  const userTotals = transactions.reduce<Record<string, number>>((acc, tx) => {
    const user = resolveUser(tx, "Other");
    acc[user] = (acc[user] ?? 0) + tx.amount;
    return acc;
  }, {});

  const overallTotal = transactions.reduce((s, tx) => s + tx.amount, 0);

  const fmtCurrency = (v: number) =>
    `${v >= 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v)}`;

  return (
    <>
      {/* User Total Cards */}
      <div
        className="grid gap-4 mb-6"
        style={{
          gridTemplateColumns: `repeat(${Object.keys(userTotals).length + 1}, minmax(0, 1fr))`,
        }}
      >
        {Object.entries(userTotals).map(([user, total]) => (
          <div key={user} style={{ ...cardStyle, padding: "20px 24px" }}>
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: colors.textTertiary }}
            >
              {user}
            </p>
            <p
              className="text-xl font-semibold mt-1 tabular-nums"
              style={{ color: total >= 0 ? colors.success : colors.error }}
            >
              {fmtCurrency(total)}
            </p>
            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              {
                transactions.filter((tx) => {
                  const u = resolveUser(tx, "Other");
                  return u === user;
                }).length
              }{" "}
              transactions
            </p>
          </div>
        ))}
        <div style={{ ...cardStyle, padding: "20px 24px" }}>
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: colors.textTertiary }}
          >
            Total
          </p>
          <p
            className="text-xl font-semibold mt-1 tabular-nums"
            style={{ color: overallTotal >= 0 ? colors.success : colors.error }}
          >
            {fmtCurrency(overallTotal)}
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            {transactions.length} transactions
          </p>
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: colors.border }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Mercury Bank Transactions
          </h2>
          <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
            {transactions.length} transactions
          </p>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm"
            style={{ borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {[
                  "Date",
                  "Counterparty",
                  "Amount",
                  "Type",
                  "Status",
                  "Account",
                  "User",
                ].map((col) => (
                  <th
                    key={col}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: colors.textTertiary }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isCredit = tx.amount > 0;
                const amountDisplay = `${isCredit ? "+" : ""}${new Intl.NumberFormat(
                  "en-US",
                  { style: "currency", currency: "USD" },
                ).format(tx.amount)}`;
                const desc =
                  tx.counterpartyName ??
                  tx.merchantName ??
                  tx.bankDescription ??
                  "—";
                const user = resolveUser(tx, "—");
                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelected(tx)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: `1px solid ${colors.divider}` }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLTableRowElement
                      ).style.backgroundColor = colors.softCloud;
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLTableRowElement
                      ).style.backgroundColor = "transparent";
                    }}
                  >
                    <td
                      className="px-4 py-3"
                      style={{ color: colors.textSecondary }}
                    >
                      {fmtDate(tx.postedAt ?? tx.createdAt)}
                    </td>
                    <td
                      className="px-4 py-3 max-w-xs truncate"
                      style={{ color: colors.textPrimary }}
                    >
                      {desc}
                    </td>
                    <td
                      className="px-4 py-3 font-medium tabular-nums"
                      style={{
                        color: isCredit ? colors.success : colors.error,
                      }}
                    >
                      {amountDisplay}
                    </td>
                    <td
                      className="px-4 py-3 capitalize"
                      style={{ color: colors.textSecondary }}
                    >
                      {tx.kind}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor:
                            tx.status === "sent" || tx.status === "posted"
                              ? colors.success
                              : tx.status === "pending"
                                ? colors.warning
                                : colors.info,
                          color:
                            tx.status === "sent" || tx.status === "posted"
                              ? colors.success
                              : tx.status === "pending"
                                ? colors.warningText
                                : colors.infoText,
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: colors.textSecondary }}
                    >
                      {tx.accountName}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: colors.textSecondary }}
                    >
                      {user}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div
              className="py-16 text-center text-sm"
              style={{ color: colors.textTertiary }}
            >
              No transactions found
            </div>
          )}
        </div>
      </div>
      <MercuryDetailSidebar
        transaction={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const db = supabase();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [income, setIncome] = useState<BudgetIncome[]>([]);
  const [stripeTransactions, setStripeTransactions] = useState<
    StripeTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [liRes, expRes, incRes] = await Promise.all([
      db.schema("budget").from("line_items").select("*").order("sort_order"),
      db
        .schema("budget")
        .from("expenses")
        .select("*")
        .eq("is_deleted", false)
        .order("expense_date", { ascending: false }),
      db
        .schema("budget")
        .from("income")
        .select("*")
        .order("income_date", { ascending: false }),
    ]);
    if (liRes.error || expRes.error || incRes.error) {
      setError(
        "Failed to load budget data. Make sure you have super_admin access.",
      );
    } else {
      setLineItems((liRes.data as BudgetLineItem[]) ?? []);
      setExpenses((expRes.data as BudgetExpense[]) ?? []);
      setIncome((incRes.data as BudgetIncome[]) ?? []);
    }
    const txData = await getStripeTransactions();
    setStripeTransactions(txData as StripeTransaction[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div
      className="flex-1 overflow-auto"
      style={{ backgroundColor: colors.softCloud }}
    >
      <div className="max-w-6xl mx-auto px-3 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={`text-2xl font-bold mb-1 ${merriweather.className}`}
            style={{ color: colors.textPrimary }}
          >
            Budget Control Center
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Financial overview — super admin only
          </p>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 mb-8 p-1 rounded-xl w-fit"
          style={{
            backgroundColor: colors.warmLinen,
            border: `1px solid ${colors.border}`,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: activeTab === tab ? 600 : 500,
                cursor: "pointer",
                border: "none",
                transition: "all 150ms ease",
                backgroundColor: activeTab === tab ? "white" : "transparent",
                color:
                  activeTab === tab ? colors.mistyForest : colors.textSecondary,
                boxShadow: activeTab === tab ? shadows.soft : "none",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div
            className="flex items-center justify-center py-24"
            style={{ color: colors.textSecondary }}
          >
            <div className="text-center">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
                style={{
                  borderColor: colors.mistyForest,
                  borderTopColor: "transparent",
                }}
              />
              <p className="text-sm">Loading budget data…</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="p-6 rounded-xl text-sm"
            style={{
              backgroundColor: colors.error,
              color: "#ffffff",
              border: `1px solid ${colors.error}33`,
            }}
          >
            {error}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "Overview" && (
                <OverviewTab
                  lineItems={lineItems}
                  expenses={expenses}
                  stripeTransactions={stripeTransactions}
                />
              )}
              {activeTab === "Budget" && (
                <BudgetTab
                  lineItems={lineItems}
                  expenses={expenses}
                  onRefresh={fetchAll}
                />
              )}
              {activeTab === "Expenses" && (
                <ExpensesTab
                  expenses={expenses}
                  lineItems={lineItems}
                  onRefresh={fetchAll}
                />
              )}
              {activeTab === "Revenue" && (
                <RevenueTab
                  transactions={stripeTransactions}
                  onRefresh={fetchAll}
                />
              )}
              {activeTab === "Taxes" && (
                <TaxesTab expenses={expenses} income={income} />
              )}
              {activeTab === "Analysis" && (
                <AnalysisTab
                  lineItems={lineItems}
                  expenses={expenses}
                  income={income}
                />
              )}
              {activeTab === "Summer Program Analysis" && (
                <SummerAnalysisTab
                  lineItems={lineItems}
                  expenses={expenses}
                  income={income}
                />
              )}
              {activeTab === "Mercury" && <MercuryTab />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
