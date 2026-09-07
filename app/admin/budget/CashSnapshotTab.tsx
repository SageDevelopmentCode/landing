"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import {
  cssColors as colors,
  radius,
  cssShadows as shadows,
} from "../design-system";
import {
  buildCashSnapshot,
  cashSnapshotToCsv,
  formatCashCurrency,
  type MercuryAccountBalance,
} from "@/app/lib/budget/cash-snapshot";

const cardStyle = {
  backgroundColor: "white",
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  boxShadow: shadows.soft,
};

type AccountsResponse = {
  accounts: MercuryAccountBalance[];
  fetchedAt: string;
  error?: string;
};

function AmountCell({
  amount,
  bold = false,
  color,
  liability = false,
}: {
  amount: number;
  bold?: boolean;
  color?: string;
  liability?: boolean;
}) {
  const display =
    liability && amount < 0
      ? `(${formatCashCurrency(Math.abs(amount))})`
      : formatCashCurrency(amount);

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
      {display}
    </td>
  );
}

function LabelCell({
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
  liability = false,
}: {
  label: string;
  amount: number;
  color?: string;
  liability?: boolean;
}) {
  return (
    <tr style={{ borderTop: `2px solid ${colors.border}` }}>
      <LabelCell label={label} bold />
      <AmountCell amount={amount} bold color={color} liability={liability} />
    </tr>
  );
}

export function CashSnapshotTab() {
  const [accounts, setAccounts] = useState<MercuryAccountBalance[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mercury/accounts");
      const data = (await res.json()) as AccountsResponse;
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load Mercury accounts");
      }
      setAccounts(data.accounts ?? []);
      setFetchedAt(data.fetchedAt ?? new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
      setAccounts([]);
      setFetchedAt(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const report = useMemo(() => {
    if (!fetchedAt) return null;
    return buildCashSnapshot(accounts, fetchedAt);
  }, [accounts, fetchedAt]);

  const netColor =
    (report?.netCashPosition ?? 0) >= 0 ? colors.success : colors.error;

  function handleExportCsv() {
    if (!report) return;
    const csv = cashSnapshotToCsv(report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cash-snapshot-${report.fetchedAt.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !report) {
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
          <p className="text-sm">Loading Mercury account balances…</p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="space-y-4">
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
        <button
          type="button"
          onClick={loadAccounts}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: colors.mistyForest,
            color: "white",
            border: "none",
            borderRadius: radius.sm,
            padding: "7px 14px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          As of {report.asOfLabel}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAccounts}
            disabled={loading}
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
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
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
            Cash Snapshot
          </p>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            As of {report.asOfLabel}
          </p>
          <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>
            Cash-only snapshot — not a full Balance Sheet
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
                Available
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <LabelCell label={report.assets.title} bold uppercase />
              <td />
            </tr>
            <tr>
              <LabelCell label="Cash and Cash Equivalents" bold indent />
              <td />
            </tr>
            {report.assets.lines.length === 0 ? (
              <tr>
                <LabelCell label="No cash accounts found" indent />
                <AmountCell amount={0} />
              </tr>
            ) : (
              report.assets.lines.map((line) => (
                <tr key={line.id}>
                  <LabelCell label={line.label} indent />
                  <AmountCell amount={line.availableBalance} />
                </tr>
              ))
            )}
            <SubtotalRow
              label="Total Cash and Cash Equivalents"
              amount={report.totalCashAvailable}
              color={colors.success}
            />

            {report.liabilities && (
              <Fragment>
                <tr>
                  <td colSpan={2} className="py-3" />
                </tr>
                <tr>
                  <LabelCell label={report.liabilities.title} bold uppercase />
                  <td />
                </tr>
                {report.liabilities.lines.map((line) => (
                  <tr key={line.id}>
                    <LabelCell label={line.label} indent />
                    <AmountCell
                      amount={-Math.abs(line.availableBalance)}
                      liability
                    />
                  </tr>
                ))}
                <SubtotalRow
                  label="Total Liabilities"
                  amount={-report.totalLiabilities}
                  color={colors.error}
                  liability
                />
              </Fragment>
            )}

            <tr>
              <td colSpan={2} className="py-2" />
            </tr>

            <tr
              style={{
                borderTop: `2px solid ${colors.mistyForest}44`,
                backgroundColor: colors.mistyForest + "12",
              }}
            >
              <LabelCell label="Net Cash Position" bold />
              <AmountCell
                amount={report.netCashPosition}
                bold
                color={netColor}
              />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
