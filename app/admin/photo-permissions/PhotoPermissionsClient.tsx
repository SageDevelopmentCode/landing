"use client";

import { useState, useMemo } from "react";
import { cssColors as colors, radius, cssShadows as shadows } from "../design-system";
import type { PhotoConsentRow } from "./page";

type FilterKey = "ALL" | "FULL" | "LIMITED" | "NO" | "PENDING";

const BADGE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  FULL:    { bg: "rgba(34,197,94,0.15)",  color: "#22C55E", label: "Full" },
  LIMITED: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B", label: "Limited" },
  NO:      { bg: "rgba(239,68,68,0.15)",  color: "#EF4444", label: "No Consent" },
  PENDING: { bg: "rgba(82,82,82,0.2)",    color: colors.textTertiary, label: "Not Submitted" },
};

function ConsentBadge({ level }: { level: string | null }) {
  const key = level ?? "PENDING";
  const style = BADGE_STYLES[key] ?? BADGE_STYLES.PENDING;
  return (
    <span
      className="inline-flex items-center font-medium rounded-full"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        fontSize: "11px",
        padding: "3px 10px",
        whiteSpace: "nowrap",
      }}
    >
      {style.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-4 flex flex-col gap-1 text-left w-full transition-all duration-150"
      style={{
        backgroundColor: active ? colors.surface : colors.elevated,
        border: `1px solid ${active ? color : colors.border}`,
        boxShadow: active ? `0 0 0 1px ${color}33` : shadows.soft,
        cursor: "pointer",
      }}
    >
      <span className="text-2xl font-bold" style={{ color }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: active ? color : colors.textTertiary }}>
        {label}
      </span>
    </button>
  );
}

const FILTER_TABS: { key: FilterKey; label: string; color: string }[] = [
  { key: "ALL",     label: "All",           color: colors.textSecondary },
  { key: "FULL",    label: "Full",          color: "#22C55E" },
  { key: "LIMITED", label: "Limited",       color: "#F59E0B" },
  { key: "NO",      label: "No Consent",    color: "#EF4444" },
  { key: "PENDING", label: "Not Submitted", color: colors.textTertiary },
];

export function PhotoPermissionsClient({
  rows,
  fullCount,
  limitedCount,
  noCount,
  pendingCount,
}: {
  rows: PhotoConsentRow[];
  fullCount: number;
  limitedCount: number;
  noCount: number;
  pendingCount: number;
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const totalCount = rows.length;

  const COUNTS: Record<FilterKey, number> = {
    ALL:     totalCount,
    FULL:    fullCount,
    LIMITED: limitedCount,
    NO:      noCount,
    PENDING: pendingCount,
  };

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const aPending = a.consent_level === null ? 0 : 1;
        const bPending = b.consent_level === null ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return a.student_name.localeCompare(b.student_name);
      }),
    [rows]
  );

  const filtered = useMemo(() => {
    let result = sorted;

    if (activeFilter !== "ALL") {
      result = result.filter((r) =>
        activeFilter === "PENDING" ? r.consent_level === null : r.consent_level === activeFilter
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.student_name.toLowerCase().includes(q) ||
          (r.parent_name ?? "").toLowerCase().includes(q) ||
          (r.parent_email ?? "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [sorted, activeFilter, search]);

  return (
    <div className="space-y-5">
      {/* Stat cards — clickable filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Full Consent"
          value={fullCount}
          color="#22C55E"
          active={activeFilter === "FULL"}
          onClick={() => setActiveFilter((f) => f === "FULL" ? "ALL" : "FULL")}
        />
        <StatCard
          label="Limited Consent"
          value={limitedCount}
          color="#F59E0B"
          active={activeFilter === "LIMITED"}
          onClick={() => setActiveFilter((f) => f === "LIMITED" ? "ALL" : "LIMITED")}
        />
        <StatCard
          label="No Consent"
          value={noCount}
          color="#EF4444"
          active={activeFilter === "NO"}
          onClick={() => setActiveFilter((f) => f === "NO" ? "ALL" : "NO")}
        />
        <StatCard
          label="Not Submitted"
          value={pendingCount}
          color={colors.textTertiary}
          active={activeFilter === "PENDING"}
          onClick={() => setActiveFilter((f) => f === "PENDING" ? "ALL" : "PENDING")}
        />
      </div>

      {/* Filter tabs + search row */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-1 rounded-lg p-1"
          style={{ backgroundColor: colors.elevated, border: `1px solid ${colors.border}` }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className="flex items-center gap-1.5 rounded-md text-xs font-medium transition-all duration-150"
                style={{
                  padding: "5px 10px",
                  backgroundColor: isActive ? colors.surface : "transparent",
                  color: isActive ? tab.color : colors.textTertiary,
                  border: isActive ? `1px solid ${colors.border}` : "1px solid transparent",
                  boxShadow: isActive ? shadows.soft : "none",
                }}
              >
                {tab.label}
                <span
                  className="rounded-full font-semibold"
                  style={{
                    fontSize: "10px",
                    padding: "1px 5px",
                    backgroundColor: isActive ? `${tab.color}22` : colors.elevated,
                    color: isActive ? tab.color : colors.textQuaternary,
                  }}
                >
                  {COUNTS[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Search student or parent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 sm:flex-none sm:w-64 text-sm outline-none rounded-lg px-3 py-2"
          style={{
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
          }}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.soft,
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.elevated }}>
              {["Student", "Parent", "Consent Level", "Submitted"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 font-medium"
                  style={{ color: colors.textTertiary, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: colors.textTertiary }}>
                  No results
                </td>
              </tr>
            )}
            {filtered.map((row, i) => (
              <tr
                key={row.student_id}
                style={{
                  borderBottom: i < filtered.length - 1 ? `1px solid ${colors.border}` : "none",
                  backgroundColor: colors.surface,
                }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: colors.textPrimary }}>
                  {row.student_name}
                </td>
                <td className="px-4 py-3" style={{ color: colors.textSecondary }}>
                  <div>{row.parent_name ?? "—"}</div>
                  {row.parent_email && (
                    <div className="text-xs" style={{ color: colors.textTertiary }}>
                      {row.parent_email}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ConsentBadge level={row.consent_level} />
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: colors.textTertiary }}>
                  {row.created_at
                    ? new Date(row.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
