"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { Merriweather } from "next/font/google";
import { colors, radius, shadows } from "../design-system";
import type {
  BudgetLineItem,
  BudgetExpense,
  BudgetIncome,
} from "../../types/database.types";
import { Table, TableRow, TableCell } from "../components/Table";
import { DetailSidebar } from "../components/DetailSidebar";

const merriweather = Merriweather({
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
  color: colors.errorText,
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

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({
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
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalRevenue = income.reduce((s, i) => s + Number(i.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitColor = netProfit >= 0 ? colors.successText : colors.errorText;

  // Category breakdown for budget
  const byCategory = lineItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] =
      (acc[item.category] ?? 0) + Number(item.planned_amount);
    return acc;
  }, {});

  const maxCatVal = Math.max(...Object.values(byCategory), 1);

  return (
    <div className="space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat
          label="Total Planned Budget"
          value={fmt(totalBudget)}
          color={colors.textPrimary}
          delay={0}
        />
        <MiniStat
          label="Total Actual Expenses"
          value={fmt(totalExpenses)}
          color={colors.errorText}
          delay={0.05}
        />
        <MiniStat
          label="Total Revenue"
          value={fmt(totalRevenue)}
          color={colors.successText}
          delay={0.1}
        />
        <MiniStat
          label="Net Profit / Loss"
          value={fmt(netProfit)}
          color={profitColor}
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget breakdown bars */}
        <div style={{ ...cardStyle, padding: "24px" }}>
          <p
            className="text-sm font-semibold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Budget by Category
          </p>
          <div className="space-y-3">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, val]) => (
                <div key={cat}>
                  <div
                    className="flex justify-between text-xs mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    <span>{cat}</span>
                    <span>{fmt(val)}</span>
                  </div>
                  <div
                    style={{
                      height: "8px",
                      borderRadius: "99px",
                      backgroundColor: colors.warmLinen,
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(val / maxCatVal) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{
                        height: "100%",
                        borderRadius: "99px",
                        backgroundColor: colors.mistyForest,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* P&L Summary + Break-even */}
        <div className="space-y-4">
          <div style={{ ...cardStyle, padding: "24px" }}>
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: colors.textPrimary }}
            >
              P&L Summary
            </p>
            <div className="space-y-2 text-sm">
              {[
                {
                  label: "Revenue",
                  value: totalRevenue,
                  color: colors.successText,
                },
                {
                  label: "Expenses",
                  value: -totalExpenses,
                  color: colors.errorText,
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>{label}</span>
                  <span style={{ color, fontWeight: 600 }}>
                    {fmt(Math.abs(value))}
                  </span>
                </div>
              ))}
              <div
                className="flex justify-between pt-2 mt-2"
                style={{
                  borderTop: `1px solid ${colors.border}`,
                  fontWeight: 700,
                }}
              >
                <span style={{ color: colors.textPrimary }}>Net</span>
                <span style={{ color: profitColor }}>{fmt(netProfit)}</span>
              </div>
            </div>
          </div>

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
              style={{ color: colors.warningText }}
            >
              {fmt(Math.max(netProfit * 0.25, 0))}
            </p>
            <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
              Set aside monthly from any profit
            </p>
          </div>
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
                transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
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
                  transition={{ duration: 0.5, ease: "easeOut" }}
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
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
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
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={{ ...inputStyle, width: "140px" }}
        />
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
            {rows.map((row) => (
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
                    color: row.over ? colors.errorText : colors.successText,
                    fontWeight: 600,
                  }}
                >
                  {row.over ? "-" : "+"}
                  {fmt(Math.abs(row.variance))}
                  {row.over && " ⚠"}
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
                          backgroundColor: row.over
                            ? colors.errorText
                            : colors.mistyForest,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        color: row.over
                          ? colors.errorText
                          : colors.textSecondary,
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
            ))}
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
                  color:
                    totalVariance < 0 ? colors.errorText : colors.successText,
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
                            ? colors.errorText
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
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [view, setView] = useState<"monthly" | "category" | "trend">("monthly");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
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

  const filtered = expenses.filter((e) => {
    if (filterMonth && !e.expense_date.startsWith(filterMonth)) return false;
    if (filterCat && e.category !== filterCat) return false;
    return true;
  });
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  // Group by month for monthly view
  const byMonth = filtered.reduce<Record<string, BudgetExpense[]>>((acc, e) => {
    const key = e.expense_date.slice(0, 7);
    (acc[key] ??= []).push(e);
    return acc;
  }, {});
  const months = Object.keys(byMonth).sort().reverse();

  function toggleMonth(key: string) {
    setCollapsedMonths((prev) => {
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
    acc[item.category] = (acc[item.category] ?? 0) + Number(item.planned_amount);
    return acc;
  }, {});

  const budgetRows = Object.entries(byCat)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, actual], i) => {
      const planned = plannedByCat[cat] ?? 0;
      const variance = planned - actual;
      const pct = planned > 0 ? actual / planned : null;
      const over = planned > 0 && actual > planned;
      return { cat, actual, planned, variance, pct, over, color: SLICE_COLORS[i % SLICE_COLORS.length] };
    });

  const totalBudgetPlanned = budgetRows.reduce((s, r) => s + r.planned, 0);
  const totalBudgetActual = budgetRows.reduce((s, r) => s + r.actual, 0);
  const totalBudgetVariance = totalBudgetPlanned - totalBudgetActual;

  // Trend: monthly totals sorted chronologically
  const trendMonths = Object.keys(byMonth).sort();
  const maxMonthTotal = Math.max(
    ...trendMonths.map((m) =>
      byMonth[m].reduce((s, e) => s + Number(e.amount), 0)
    ),
    1
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
    await db.schema("budget").from("expenses").update({ is_deleted: true }).eq("id", id);
    onRefresh();
  }

  async function addExpense() {
    if (!newExp.expense_name.trim()) return;
    setSaving(true);
    await db
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
      });
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
    onRefresh();
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3">
          <input
            style={{ ...inputStyle, width: "140px" }}
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
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
                      <input
                        style={inputStyle}
                        type={type}
                        placeholder={placeholder}
                        value={(newExp as Record<string, unknown>)[key] as string}
                        onChange={(e) =>
                          setNewExp((p) => ({ ...p, [key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="new-tax-deductible"
                      checked={newExp.tax_deductible}
                      onChange={(e) =>
                        setNewExp((p) => ({ ...p, tax_deductible: e.target.checked }))
                      }
                    />
                    <label htmlFor="new-tax-deductible" className="text-xs" style={{ color: colors.textSecondary }}>
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
        {(["monthly", "category", "trend"] as const).map((v) => (
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
            {v === "monthly" ? "Monthly" : v === "category" ? "By Category" : "Trend"}
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
              const monthTotal = monthExps.reduce(
                (s, e) => s + Number(e.amount),
                0
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
                    <td colSpan={8} style={{ padding: "10px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontSize: "12px",
                              color: colors.textSecondary,
                              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
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
                            ({monthExps.length} expense{monthExps.length !== 1 ? "s" : ""})
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ color: colors.errorText }}
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
                        <TableCell>{exp.expense_name}</TableCell>
                        <TableCell>{exp.category ?? "—"}</TableCell>
                        <TableCell>{fmt(Number(exp.amount))}</TableCell>
                        <TableCell>{exp.payment_method ?? "—"}</TableCell>
                        <TableCell>{exp.expense_date}</TableCell>
                        <TableCell>{exp.notes ?? "—"}</TableCell>
                        <TableCell>{exp.tax_deductible ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 items-center">
                            <button
                              title="Edit"
                              style={{ ...btnGhost, padding: "4px 6px", lineHeight: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(exp.id);
                                setEditValues({ ...exp });
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/>
                                <path d="M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
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
            style={{ backgroundColor: "#F6F1E8", borderTop: `1px solid #E8E4DF` }}
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
              style={{ color: colors.errorText }}
            >
              {fmt(total)}
            </td>
            <td colSpan={5} />
          </tr>
        </Table>
      )}

      {/* Monthly view — Spend vs. Budget by Category */}
      {view === "monthly" && budgetRows.length > 0 && (
        <div style={{ ...cardStyle, padding: "24px" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Spend vs. Budget by Category
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {["Category", "Budgeted", "Spent", "Variance", "Usage"].map((h) => (
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
                {budgetRows.map((row) => (
                  <tr key={row.cat} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td className="py-3 px-3" style={{ color: colors.textPrimary }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: row.color, flexShrink: 0 }} />
                        {row.cat}
                      </div>
                    </td>
                    <td className="py-3 px-3" style={{ color: colors.textSecondary }}>
                      {row.planned > 0 ? fmt(row.planned) : "—"}
                    </td>
                    <td className="py-3 px-3" style={{ color: colors.textSecondary }}>
                      {fmt(row.actual)}
                    </td>
                    <td className="py-3 px-3" style={{ color: row.planned === 0 ? colors.textTertiary : row.over ? colors.errorText : colors.successText, fontWeight: 600 }}>
                      {row.planned === 0 ? "—" : (row.over ? "-" : "+") + fmt(Math.abs(row.variance))}
                    </td>
                    <td className="py-3 px-3" style={{ minWidth: "140px" }}>
                      {row.pct === null ? (
                        <span style={{ color: colors.textTertiary, fontSize: "12px" }}>—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div style={{ flex: 1, height: "6px", borderRadius: "99px", backgroundColor: colors.warmLinen, overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${Math.min(row.pct, 1) * 100}%`,
                                height: "100%",
                                borderRadius: "99px",
                                backgroundColor: row.over ? colors.errorText : colors.mistyForest,
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                          <span style={{ color: row.over ? colors.errorText : colors.textSecondary, fontSize: "12px", minWidth: "38px", textAlign: "right" }}>
                            {(row.pct * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: colors.warmLinen }}>
                  <td className="py-3 px-3 font-bold" style={{ color: colors.textPrimary }}>Total</td>
                  <td className="py-3 px-3 font-bold" style={{ color: colors.textPrimary }}>
                    {totalBudgetPlanned > 0 ? fmt(totalBudgetPlanned) : "—"}
                  </td>
                  <td className="py-3 px-3 font-bold" style={{ color: colors.textPrimary }}>{fmt(totalBudgetActual)}</td>
                  <td className="py-3 px-3 font-bold" style={{ color: totalBudgetVariance < 0 ? colors.errorText : colors.successText }}>
                    {totalBudgetPlanned === 0 ? "—" : (totalBudgetVariance < 0 ? "-" : "+") + fmt(Math.abs(totalBudgetVariance))}
                  </td>
                  <td className="py-3 px-3">
                    {totalBudgetPlanned > 0 && (
                      <div className="flex items-center gap-2">
                        <div style={{ flex: 1, height: "6px", borderRadius: "99px", backgroundColor: colors.border, overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${Math.min(totalBudgetPlanned > 0 ? totalBudgetActual / totalBudgetPlanned : 0, 1) * 100}%`,
                              height: "100%",
                              borderRadius: "99px",
                              backgroundColor: totalBudgetActual > totalBudgetPlanned ? colors.errorText : colors.mistyForest,
                            }}
                          />
                        </div>
                        <span style={{ color: colors.textSecondary, fontSize: "12px", minWidth: "38px", textAlign: "right" }}>
                          {(totalBudgetPlanned > 0 ? (totalBudgetActual / totalBudgetPlanned) * 100 : 0).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* By Category view */}
      {view === "category" && (
        <div style={{ ...cardStyle, padding: "24px" }}>
          <p
            className="text-sm font-semibold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Expenses by Category
          </p>
          {filtered.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: colors.textTertiary }}>
              No expenses found.
            </p>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Donut SVG */}
              <div style={{ flexShrink: 0 }}>
                <svg width={220} height={220}>
                  {(() => {
                    const cx = 110, cy = 110;
                    const catEntries = Object.entries(byCat).sort(([, a], [, b]) => b - a);
                    let cumulative = 0;
                    const slices = catEntries.map(([cat, val], i) => {
                      const pct = total > 0 ? val / total : 0;
                      const dashLen = pct * CIRC;
                      const offset = CIRC - cumulative - CIRC / 4;
                      cumulative += dashLen;
                      return { cat, val, pct, dashLen, offset, color: SLICE_COLORS[i % SLICE_COLORS.length] };
                    });
                    return (
                      <>
                        <circle cx={cx} cy={cy} r={RADIUS} fill="none" stroke={colors.warmLinen} strokeWidth={30} />
                        {slices.map((slice, i) => (
                          <motion.circle
                            key={slice.cat}
                            cx={cx} cy={cy} r={RADIUS}
                            fill="none"
                            stroke={slice.color}
                            strokeWidth={30}
                            strokeDasharray={`${slice.dashLen} ${CIRC}`}
                            strokeDashoffset={slice.offset}
                            initial={{ strokeDasharray: `0 ${CIRC}` }}
                            animate={{ strokeDasharray: `${slice.dashLen} ${CIRC}` }}
                            transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                          />
                        ))}
                        <circle cx={cx} cy={cy} r={50} fill="white" />
                        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill={colors.textPrimary}>
                          {fmt(total)}
                        </text>
                        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill={colors.textSecondary}>
                          total expenses
                        </text>
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Category list */}
              <div className="flex-1 space-y-3" style={{ minWidth: 0 }}>
                {Object.entries(byCat)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, val], i) => {
                    const pct = total > 0 ? val / total : 0;
                    const color = SLICE_COLORS[i % SLICE_COLORS.length];
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              width: 10, height: 10,
                              borderRadius: "50%",
                              backgroundColor: color,
                              flexShrink: 0,
                            }}
                          />
                          <span className="text-sm flex-1" style={{ color: colors.textSecondary }}>{cat}</span>
                          <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{fmt(val)}</span>
                          <span className="text-xs" style={{ color: colors.textTertiary, minWidth: 40, textAlign: "right" }}>
                            {(pct * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div
                          style={{
                            height: 4, borderRadius: 99,
                            backgroundColor: colors.warmLinen,
                            overflow: "hidden", marginLeft: 22,
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            style={{ height: "100%", borderRadius: 99, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* vs. Monthly Budget table */}
          {budgetRows.length > 0 && (
            <>
              <hr style={{ margin: "24px 0", borderColor: colors.border }} />
              <p className="text-sm font-semibold mb-4" style={{ color: colors.textPrimary }}>
                vs. Monthly Budget
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      {["Category", "Budgeted", "Spent", "Variance", "Usage"].map((h) => (
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
                    {budgetRows.map((row) => (
                      <tr key={row.cat} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td className="py-3 px-3" style={{ color: colors.textPrimary }}>
                          <div className="flex items-center gap-2">
                            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: row.color, flexShrink: 0 }} />
                            {row.cat}
                          </div>
                        </td>
                        <td className="py-3 px-3" style={{ color: colors.textSecondary }}>
                          {row.planned > 0 ? fmt(row.planned) : "—"}
                        </td>
                        <td className="py-3 px-3" style={{ color: colors.textSecondary }}>
                          {fmt(row.actual)}
                        </td>
                        <td className="py-3 px-3" style={{ color: row.planned === 0 ? colors.textTertiary : row.over ? colors.errorText : colors.successText, fontWeight: 600 }}>
                          {row.planned === 0 ? "—" : (row.over ? "-" : "+") + fmt(Math.abs(row.variance))}
                        </td>
                        <td className="py-3 px-3" style={{ minWidth: "140px" }}>
                          {row.pct === null ? (
                            <span style={{ color: colors.textTertiary, fontSize: "12px" }}>—</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div style={{ flex: 1, height: "6px", borderRadius: "99px", backgroundColor: colors.warmLinen, overflow: "hidden" }}>
                                <div
                                  style={{
                                    width: `${Math.min(row.pct, 1) * 100}%`,
                                    height: "100%",
                                    borderRadius: "99px",
                                    backgroundColor: row.over ? colors.errorText : colors.mistyForest,
                                    transition: "width 0.4s ease",
                                  }}
                                />
                              </div>
                              <span style={{ color: row.over ? colors.errorText : colors.textSecondary, fontSize: "12px", minWidth: "38px", textAlign: "right" }}>
                                {(row.pct * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: colors.warmLinen }}>
                      <td className="py-3 px-3 font-bold" style={{ color: colors.textPrimary }}>Total</td>
                      <td className="py-3 px-3 font-bold" style={{ color: colors.textPrimary }}>
                        {totalBudgetPlanned > 0 ? fmt(totalBudgetPlanned) : "—"}
                      </td>
                      <td className="py-3 px-3 font-bold" style={{ color: colors.textPrimary }}>{fmt(totalBudgetActual)}</td>
                      <td className="py-3 px-3 font-bold" style={{ color: totalBudgetVariance < 0 ? colors.errorText : colors.successText }}>
                        {totalBudgetPlanned === 0 ? "—" : (totalBudgetVariance < 0 ? "-" : "+") + fmt(Math.abs(totalBudgetVariance))}
                      </td>
                      <td className="py-3 px-3">
                        {totalBudgetPlanned > 0 && (
                          <div className="flex items-center gap-2">
                            <div style={{ flex: 1, height: "6px", borderRadius: "99px", backgroundColor: colors.border, overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${Math.min(totalBudgetPlanned > 0 ? totalBudgetActual / totalBudgetPlanned : 0, 1) * 100}%`,
                                  height: "100%",
                                  borderRadius: "99px",
                                  backgroundColor: totalBudgetActual > totalBudgetPlanned ? colors.errorText : colors.mistyForest,
                                }}
                              />
                            </div>
                            <span style={{ color: colors.textSecondary, fontSize: "12px", minWidth: "38px", textAlign: "right" }}>
                              {(totalBudgetPlanned > 0 ? (totalBudgetActual / totalBudgetPlanned) * 100 : 0).toFixed(0)}%
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
            <p className="text-sm text-center py-8" style={{ color: colors.textTertiary }}>
              No expenses found.
            </p>
          ) : (
            <div className="space-y-4">
              {trendMonths.map((monthKey) => {
                const monthTotal = byMonth[monthKey].reduce(
                  (s, e) => s + Number(e.amount),
                  0
                );
                const pct = monthTotal / maxMonthTotal;
                return (
                  <div key={monthKey} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      className="text-sm"
                      style={{ color: colors.textSecondary, minWidth: 110, flexShrink: 0 }}
                    >
                      {formatMonthLabel(monthKey)}
                    </span>
                    <div
                      style={{
                        flex: 1, height: 28,
                        backgroundColor: colors.warmLinen,
                        borderRadius: radius.sm,
                        overflow: "hidden",
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{
                          height: "100%",
                          backgroundColor: colors.mistyForest,
                          borderRadius: radius.sm,
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.textPrimary, minWidth: 80, textAlign: "right", flexShrink: 0 }}
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
            <input
              style={inputStyle}
              type="date"
              value={editValues.expense_date ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, expense_date: e.target.value }))
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
                setEditValues((v) => ({ ...v, tax_deductible: e.target.checked }))
              }
            />
            <label htmlFor="edit-tax-deductible" className="text-xs" style={{ color: colors.textSecondary }}>
              Tax Deductible
            </label>
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
  summer: "Summer",
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
  income,
  onRefresh,
}: {
  income: BudgetIncome[];
  onRefresh: () => void;
}) {
  const db = supabase();
  const [showAdd, setShowAdd] = useState(false);
  const [newIncome, setNewIncome] = useState({
    source: "tuition" as BudgetIncome["source"],
    student_name: "",
    description: "",
    amount: "",
    income_date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [enrollment, setEnrollment] = useState({
    full_14: 0,
    full_primary: 0,
    aftercare: 0,
    fun_friday: 0,
    summer: 0,
  });

  const totalActual = income.reduce((s, i) => s + Number(i.amount), 0);

  const projectedRevenue =
    enrollment.full_14 * TUITION_RATES.full_14 +
    enrollment.full_primary * TUITION_RATES.full_primary +
    enrollment.aftercare * TUITION_RATES.aftercare_enrolled +
    enrollment.fun_friday * TUITION_RATES.fun_friday +
    enrollment.summer * TUITION_RATES.summer_14_wk;

  async function addIncome() {
    if (!newIncome.amount) return;
    setSaving(true);
    await db
      .schema("budget")
      .from("income")
      .insert({
        source: newIncome.source,
        student_name: newIncome.student_name || null,
        description: newIncome.description || null,
        amount: Number(newIncome.amount),
        income_date: newIncome.income_date,
      });
    setSaving(false);
    setShowAdd(false);
    setNewIncome({
      source: "tuition",
      student_name: "",
      description: "",
      amount: "",
      income_date: new Date().toISOString().slice(0, 10),
    });
    onRefresh();
  }

  async function deleteIncome(id: string) {
    if (!confirm("Delete this income entry?")) return;
    await db.schema("budget").from("income").delete().eq("id", id);
    onRefresh();
  }

  return (
    <div className="space-y-6">
      {/* Income Log */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p
            className="text-sm font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Income Log
          </p>
          <button style={btnPrimary} onClick={() => setShowAdd(true)}>
            + Add Income
          </button>
        </div>

        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ ...cardStyle, padding: "20px", marginBottom: "16px" }}
          >
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: colors.textPrimary }}
            >
              New Income Entry
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div>
                <label
                  className="text-xs mb-1 block"
                  style={{ color: colors.textSecondary }}
                >
                  Source
                </label>
                <select
                  style={inputStyle}
                  value={newIncome.source}
                  onChange={(e) =>
                    setNewIncome((p) => ({
                      ...p,
                      source: e.target.value as BudgetIncome["source"],
                    }))
                  }
                >
                  {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="text-xs mb-1 block"
                  style={{ color: colors.textSecondary }}
                >
                  Student Name
                </label>
                <input
                  style={inputStyle}
                  placeholder="Optional"
                  value={newIncome.student_name}
                  onChange={(e) =>
                    setNewIncome((p) => ({
                      ...p,
                      student_name: e.target.value,
                    }))
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
                  placeholder="0.00"
                  value={newIncome.amount}
                  onChange={(e) =>
                    setNewIncome((p) => ({ ...p, amount: e.target.value }))
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
                <input
                  style={inputStyle}
                  type="date"
                  value={newIncome.income_date}
                  onChange={(e) =>
                    setNewIncome((p) => ({ ...p, income_date: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  className="text-xs mb-1 block"
                  style={{ color: colors.textSecondary }}
                >
                  Description
                </label>
                <input
                  style={inputStyle}
                  placeholder="Optional"
                  value={newIncome.description}
                  onChange={(e) =>
                    setNewIncome((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button style={btnPrimary} onClick={addIncome} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button style={btnGhost} onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        <Table
          headers={["Date", "Source", "Student", "Description", "Amount", ""]}
        >
          {income.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-sm text-gray-400"
              >
                No income entries yet.
              </td>
            </tr>
          ) : (
            income.map((inc, i) => (
              <TableRow key={inc.id} index={i}>
                <TableCell>{inc.income_date}</TableCell>
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
                    {SOURCE_LABELS[inc.source]}
                  </span>
                </TableCell>
                <TableCell>{inc.student_name ?? "—"}</TableCell>
                <TableCell>{inc.description ?? "—"}</TableCell>
                <TableCell
                  className="font-semibold"
                  style={{ color: colors.successText }}
                >
                  {fmt(Number(inc.amount))}
                </TableCell>
                <TableCell>
                  <button
                    style={btnDanger}
                    onClick={() => deleteIncome(inc.id)}
                  >
                    Del
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
          {/* Total row */}
          <tr
            style={{
              backgroundColor: "#F6F1E8",
              borderTop: `1px solid #E8E4DF`,
            }}
          >
            <td
              colSpan={4}
              className="px-4 py-3 text-sm font-bold"
              style={{ color: colors.textPrimary }}
            >
              Total
            </td>
            <td
              className="px-4 py-3 text-sm font-bold"
              style={{ color: colors.successText }}
            >
              {fmt(totalActual)}
            </td>
            <td />
          </tr>
        </Table>
      </div>

      {/* Revenue Projections */}
      <div style={{ ...cardStyle, padding: "24px" }}>
        <p
          className="text-sm font-semibold mb-4"
          style={{ color: colors.textPrimary }}
        >
          Enrollment Revenue Projections
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            {
              key: "full_14",
              label: "Full Enrollment (1st–4th)",
              rate: TUITION_RATES.full_14,
            },
            {
              key: "full_primary",
              label: "Full Enrollment (Primary)",
              rate: TUITION_RATES.full_primary,
            },
            {
              key: "aftercare",
              label: "After Care (enrolled rate)",
              rate: TUITION_RATES.aftercare_enrolled,
            },
            {
              key: "fun_friday",
              label: "Field Day Friday",
              rate: TUITION_RATES.fun_friday,
            },
            {
              key: "summer",
              label: "Summer (per week)",
              rate: TUITION_RATES.summer_14_wk,
            },
          ].map(({ key, label, rate }) => (
            <div key={key}>
              <label
                className="text-xs mb-1 block"
                style={{ color: colors.textSecondary }}
              >
                {label}{" "}
                <span style={{ color: colors.textTertiary }}>
                  ({fmt(rate)}/mo)
                </span>
              </label>
              <input
                style={{ ...inputStyle, width: "80px" }}
                type="number"
                min="0"
                value={(enrollment as Record<string, number>)[key]}
                onChange={(e) =>
                  setEnrollment((p) => ({
                    ...p,
                    [key]: parseInt(e.target.value) || 0,
                  }))
                }
              />
              <span
                className="ml-2 text-xs"
                style={{ color: colors.successText }}
              >
                = {fmt((enrollment as Record<string, number>)[key] * rate)}
              </span>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ backgroundColor: colors.pastelSage }}
        >
          <div>
            <p
              className="text-xs font-medium"
              style={{ color: colors.mistyForest }}
            >
              Projected Monthly Revenue
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.mistyForest }}
            >
              {fmt(projectedRevenue)}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-xs font-medium"
              style={{ color: colors.mistyForest }}
            >
              Actual Revenue
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: colors.mistyForest }}
            >
              {fmt(totalActual)}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-xs font-medium"
              style={{ color: colors.mistyForest }}
            >
              Difference
            </p>
            <p
              className="text-2xl font-bold"
              style={{
                color:
                  totalActual >= projectedRevenue
                    ? colors.successText
                    : colors.errorText,
              }}
            >
              {fmt(totalActual - projectedRevenue)}
            </p>
          </div>
        </div>
      </div>
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
          color={netProfit >= 0 ? colors.successText : colors.errorText}
        />
        <MiniStat
          label={`Tax Reserve (${totalTaxRate}% of profit)`}
          value={fmt(taxReserve)}
          color={colors.warningText}
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
                  style={{ color: colors.warningText }}
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
                      style={{ color: colors.errorText }}
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
}: {
  mixTotal: number;
  goal: number;
  label: string;
  budget: number;
  targetProfit: number;
  onReset: () => void;
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
      ? colors.successText
      : mixProfit >= targetProfit * 0.85
        ? "#C07A4A"
        : colors.errorText;
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
            {fmt(mixTotal)}/mo
          </p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: colors.textTertiary }}>
            Projected profit
          </p>
          <p className="text-sm font-bold" style={{ color: profitColor }}>
            {fmt(mixProfit)}/mo
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
            {fmt(targetProfit)}/mo
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
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            height: "100%",
            borderRadius: 99,
            backgroundColor: barColor,
          }}
        />
      </div>
      <p
        className="text-xs mt-2 font-medium"
        style={{ color: surplus ? colors.successText : colors.errorText }}
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
}: {
  revenueGoal: number;
  mixTotal: number;
  budget: number;
  targetProfit: number;
}) {
  const diff = mixTotal - revenueGoal;
  const surplus = diff >= 0;
  const barPct = Math.min(mixTotal / revenueGoal, 1);
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
            School Year · 10 months · Mon–Thu
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
            {fmt(revenueGoal)}/mo
          </p>
          <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
            {fmt(budget)} budget + {fmt(targetProfit)} profit
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
          transition={{ duration: 0.3, ease: "easeOut" }}
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
            {fmt(mixTotal)}/mo
          </strong>
        </span>
        <span
          className="text-xs font-semibold"
          style={{ color: surplus ? colors.successText : colors.errorText }}
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
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            height: "100%",
            borderRadius: 99,
            backgroundColor: barColor,
          }}
        />
      </div>
      {covered && (
        <p className="text-xs mt-1" style={{ color: colors.successText }}>
          ✓ Budget covered by this program alone
        </p>
      )}
    </div>
  );
}

const FULL_SUMMER_14 = 4095;
const FULL_SUMMER_PRIMARY = 4388;

const SCHOOL_YEAR_RATES = [
  {
    key: "full_14",
    label: "Full Enrollment (1st–4th)",
    rate: TUITION_RATES.full_14,
  },
  {
    key: "full_primary",
    label: "Full Enrollment (Primary, Pre-K–K)",
    rate: TUITION_RATES.full_primary,
  },
  {
    key: "aftercare_enrolled",
    label: "After Care – enrolled student",
    rate: TUITION_RATES.aftercare_enrolled,
  },
  {
    key: "aftercare_non",
    label: "After Care – after care only",
    rate: TUITION_RATES.aftercare_non,
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
  const [activeSubTab, setActiveSubTab] = useState<"School Year" | "Summer">(
    "School Year",
  );

  const [syStudents, setSyStudents] = useState<Record<string, number>>({
    full_14: 15,
    full_primary: 10,
    aftercare_enrolled: 0,
    aftercare_non: 0,
    fun_friday: 0,
  });
  const [swStudents, setSwStudents] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      SUMMER_WEEKLY_RATES.map((r) => [
        r.key,
        Math.ceil((totalBudget + 500) / (r.rate * 4.33)),
      ]),
    ),
  );
  const [ssStudents, setSsStudents] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      SUMMER_SEASON_RATES.map((r) => [
        r.key,
        Math.ceil(((totalBudget + 500) * 3) / r.totalPrice),
      ]),
    ),
  );

  const netProfitColor = netProfit >= 0 ? colors.successText : colors.errorText;

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

      {/* ── Sub-tab toggle ── */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{
          backgroundColor: colors.warmLinen,
          border: `1px solid ${colors.border}`,
        }}
      >
        {(["School Year", "Summer"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            style={{
              padding: "6px 18px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeSubTab === tab ? 600 : 400,
              backgroundColor: activeSubTab === tab ? "#FFFFFF" : "transparent",
              color:
                activeSubTab === tab
                  ? colors.textPrimary
                  : colors.textSecondary,
              boxShadow:
                activeSubTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {tab === "School Year" ? "School Year" : "Summer Program"}
          </button>
        ))}
      </div>

      {/* ── School Year Sub-tab ── */}
      {activeSubTab === "School Year" && (
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
      )}

      {/* ── Summer Sub-tab ── */}
      {activeSubTab === "Summer" && (
        <div style={{ ...cardStyle, padding: "24px" }}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
            <p
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: colors.textPrimary }}
            >
              Summer Program · 13 weeks · Mon–Thu
            </p>
          </div>
          <p className="text-xs mb-5" style={{ color: colors.textTertiary }}>
            Weekly rates shown as monthly equivalent (×4.33). Full season is
            total price per student for the 13-week summer.
          </p>

          {/* Weekly rows */}
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: colors.textSecondary }}
          >
            Weekly Enrollment
          </p>
          <div className="space-y-6 mb-4">
            {SUMMER_WEEKLY_RATES.map(({ key, label, rate }) => {
              const neededAlone = Math.ceil(
                (totalBudget + targetProfit) / (rate * 4.33),
              );
              const targetCount = swStudents[key] ?? 0;
              const contribution = targetCount * rate * 4.33;
              return (
                <CoreSliderRow
                  key={key}
                  label={label}
                  rateLabel={`${fmt(rate)}/wk`}
                  contributionLabel={`${fmt(contribution)}/mo`}
                  neededAlone={neededAlone}
                  targetCount={targetCount}
                  onChange={(n) => setSwStudents((p) => ({ ...p, [key]: n }))}
                />
              );
            })}
          </div>
          <MixSummary
            mixTotal={SUMMER_WEEKLY_RATES.reduce(
              (s, { key, rate }) => s + (swStudents[key] ?? 0) * rate * 4.33,
              0,
            )}
            goal={totalBudget + targetProfit}
            label="Weekly"
            budget={totalBudget}
            targetProfit={targetProfit}
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

          {/* Full Season rows */}
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: colors.textSecondary }}
          >
            Full Season Enrollment
          </p>
          <div className="space-y-6">
            {SUMMER_SEASON_RATES.map(({ key, label, totalPrice }) => {
              const neededAlone = Math.ceil(
                ((totalBudget + targetProfit) * 3) / totalPrice,
              );
              const targetCount = ssStudents[key] ?? 0;
              const contribution = targetCount * totalPrice;
              return (
                <CoreSliderRow
                  key={key}
                  label={label}
                  rateLabel={`${fmt(totalPrice)} total`}
                  contributionLabel={`${fmt(contribution)} total`}
                  neededAlone={neededAlone}
                  targetCount={targetCount}
                  onChange={(n) => setSsStudents((p) => ({ ...p, [key]: n }))}
                />
              );
            })}
          </div>
          <MixSummary
            mixTotal={
              SUMMER_SEASON_RATES.reduce(
                (s, { key, totalPrice }) =>
                  s + (ssStudents[key] ?? 0) * totalPrice,
                0,
              ) / 3
            }
            goal={totalBudget + targetProfit}
            label="Full season (÷3 months)"
            budget={totalBudget}
            targetProfit={targetProfit}
            onReset={() =>
              setSsStudents(
                Object.fromEntries(SUMMER_SEASON_RATES.map((r) => [r.key, 0])),
              )
            }
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const db = supabase();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [income, setIncome] = useState<BudgetIncome[]>([]);
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
      <div className="max-w-6xl mx-auto px-6 py-8">
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
              color: colors.errorText,
              border: `1px solid ${colors.errorText}33`,
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
                  income={income}
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
                <ExpensesTab expenses={expenses} lineItems={lineItems} onRefresh={fetchAll} />
              )}
              {activeTab === "Revenue" && (
                <RevenueTab income={income} onRefresh={fetchAll} />
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
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
