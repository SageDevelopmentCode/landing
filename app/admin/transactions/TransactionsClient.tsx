"use client";

import { useState, useMemo } from "react";
import { ExternalLink, CheckCircle2, Circle, Send } from "lucide-react";
import { Table, TableRow, TableCell } from "../components/Table";
import {
  TransactionDetailSidebar,
  formatCents,
  formatPaymentType,
  stripeUrl,
} from "../components/TransactionDetailSidebar";
import { colors } from "../design-system";

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

type PendingPaymentRequest = {
  id: string;
  parent_id: string;
  student_id: string | null;
  program: string;
  payment_type: string;
  week: string | null;
  month: string | null;
  label: string;
  amount_cents: number | null;
  created_at: string;
};

interface TransactionsClientProps {
  transactions: StripeTransaction[];
  studentMap: Record<string, string>;
  parentNameMap: Record<string, string>;
  pendingRequests: PendingPaymentRequest[];
}

type ChildGroup = {
  key: string;
  name: string;
  txs: StripeTransaction[];
};

// --- Checklist data structures ---

type ChecklistItem = {
  id: string;
  label: string;
  payment_type: string;
  week?: string;
  month?: string;
};

const SUMMER_ITEMS: ChecklistItem[] = [
  { id: "reg", label: "Registration Fee", payment_type: "registration_fee" },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `week_${i + 1}`,
    label: `Week ${i + 1}`,
    payment_type: "summer_tuition",
    week: String(i + 1),
  })),
];

const SCHOOL_YEAR_ITEMS: ChecklistItem[] = [
  {
    id: "reg",
    label: "Registration Fee ($500)",
    payment_type: "registration_fee",
  },
  { id: "supply", label: "Supply Fee ($300)", payment_type: "supply_fee" },
  ...[
    "august",
    "september",
    "october",
    "november",
    "december",
    "january",
    "february",
    "march",
    "april",
    "may",
  ].map((m) => ({
    id: m,
    label: m.charAt(0).toUpperCase() + m.slice(1),
    payment_type: "tuition",
    month: m,
  })),
];

function parseMeta(tx: StripeTransaction): Record<string, unknown> {
  if (!tx.metadata) return {};
  if (typeof tx.metadata === "string") {
    try { return JSON.parse(tx.metadata); } catch { return {}; }
  }
  return tx.metadata as Record<string, unknown>;
}

function isTxMatch(
  tx: StripeTransaction,
  item: ChecklistItem,
  program: "summer_26" | "school_year_26_27",
): boolean {
  if (tx.payment_type !== item.payment_type) return false;
  const meta = parseMeta(tx);

  // Summer tuition: weeks stored as comma-separated "weeks" + plan_type in metadata
  if (item.payment_type === "summer_tuition" && item.week) {
    const planType = meta.plan_type as string | undefined;
    if (planType === "full") return true;
    const weeksStr = (meta.weeks as string | undefined) ?? "";
    const weekNums = weeksStr.split(",").map(Number).filter(Boolean);
    return weekNums.includes(Number(item.week));
  }

  const prog = meta.program as string | undefined;
  if (prog !== program && prog !== "both") return false;
  if (item.week && (meta.week as string | undefined) !== item.week) return false;
  if (item.month && (meta.month as string | undefined) !== item.month) return false;
  return true;
}

// --- Sub-components ---

function StatusBadge({ status }: { status: string }) {
  const isSuccess =
    status === "complete" || status === "paid" || status === "succeeded";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: isSuccess ? colors.pastelSage : colors.paleMarigold,
        color: isSuccess ? colors.mistyForest : colors.warningText,
      }}
    >
      {status}
    </span>
  );
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

function ProgramChecklist({
  title,
  items,
  txs,
  program,
  onSelectTx,
  parentId,
  studentId,
  pendingRequests,
}: {
  title: string;
  items: ChecklistItem[];
  txs: StripeTransaction[];
  program: "summer_26" | "school_year_26_27";
  onSelectTx: (tx: StripeTransaction) => void;
  parentId: string | null;
  studentId: string | null;
  pendingRequests: PendingPaymentRequest[];
}) {
  const [sentItems, setSentItems] = useState<Set<string>>(() =>
    new Set(
      items
        .filter((item) =>
          pendingRequests.some(
            (r) =>
              r.program === program &&
              r.payment_type === item.payment_type &&
              (item.week != null ? (r.week === item.week || r.week == null) : r.week == null) &&
              (item.month != null ? (r.month === item.month || r.month == null) : r.month == null)
          )
        )
        .map((item) => item.id)
    )
  );
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const resolved = items.map((item) => ({
    item,
    match: txs.find((tx) => isTxMatch(tx, item, program)) ?? null,
  }));

  const paidCount = resolved.filter((r) => r.match !== null).length;
  const total = items.length;

  async function handleSendToParent(item: ChecklistItem) {
    if (!parentId || sentItems.has(item.id) || loadingItems.has(item.id)) return;

    setLoadingItems((prev) => new Set(prev).add(item.id));
    try {
      const res = await fetch("/api/admin/pending-payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_id: parentId,
          student_id: studentId,
          program,
          payment_type: item.payment_type,
          week: item.week ?? null,
          month: item.month ?? null,
          label: item.label,
        }),
      });
      if (res.ok) {
        setSentItems((prev) => new Set(prev).add(item.id));
      }
    } finally {
      setLoadingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex-1 min-w-0"
      style={{
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.softCloud,
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b"
        style={{
          borderColor: colors.divider,
          backgroundColor: colors.softCloud,
        }}
      >
        <div
          className="text-sm font-semibold"
          style={{ color: colors.textPrimary }}
        >
          {title}
        </div>
        <div className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
          {paidCount} / {total} paid
        </div>
      </div>

      {/* Items */}
      <div className="divide-y" style={{ borderColor: colors.divider }}>
        {resolved.map(({ item, match }) => {
          const isPaid = match !== null;
          const isSent = sentItems.has(item.id);
          const isLoading = loadingItems.has(item.id);
          const dateStr = isPaid
            ? new Date(match!.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : null;

          return (
            <div
              key={item.id}
              onClick={() => isPaid && onSelectTx(match!)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors group"
              style={{
                cursor: isPaid ? "pointer" : "default",
                backgroundColor: isPaid
                  ? "rgba(232, 240, 233, 0.4)"
                  : isSent
                  ? "rgba(249, 115, 22, 0.06)"
                  : "transparent",
              }}
              onMouseEnter={(e) => {
                if (isPaid)
                  (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    colors.pastelSage;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  isPaid
                    ? "rgba(232, 240, 233, 0.4)"
                    : isSent
                    ? "rgba(249, 115, 22, 0.06)"
                    : "transparent";
              }}
            >
              {isPaid ? (
                <CheckCircle2
                  className="flex-shrink-0 w-4 h-4"
                  style={{ color: colors.mistyForest }}
                />
              ) : isSent ? (
                <div
                  className="flex-shrink-0 w-4 h-4 rounded-full"
                  style={{ backgroundColor: "#f97316" }}
                />
              ) : (
                <Circle
                  className="flex-shrink-0 w-4 h-4"
                  style={{ color: colors.border }}
                />
              )}

              <span
                className="flex-1 text-sm"
                style={{
                  color: isPaid ? colors.mistyForest : colors.textSecondary,
                  fontWeight: isPaid ? 600 : 400,
                }}
              >
                {item.label}
              </span>

              {isPaid && dateStr && (
                <span
                  className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: colors.pastelSage,
                    color: colors.mistyForest,
                  }}
                >
                  {dateStr}
                </span>
              )}

              {!isPaid && parentId && item.payment_type !== "summer_tuition" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendToParent(item);
                  }}
                  disabled={isSent || isLoading}
                  className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-all"
                  style={{
                    backgroundColor: isSent ? "#fff7ed" : "transparent",
                    color: isSent ? "#f97316" : colors.textTertiary,
                    border: `1px solid ${isSent ? "#f97316" : colors.border}`,
                    cursor: isSent ? "default" : isLoading ? "wait" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {isSent ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Sent
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      {isLoading ? "Sending…" : "Send to Parent"}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main component ---

export function TransactionsClient({
  transactions,
  studentMap,
  parentNameMap,
  pendingRequests,
}: TransactionsClientProps) {
  const [activeTab, setActiveTab] = useState<"list" | "by-parent">("by-parent");
  const [selectedTransaction, setSelectedTransaction] =
    useState<StripeTransaction | null>(null);
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [selectedParentKey, setSelectedParentKey] = useState<string | null>(
    null,
  );
  const [selectedChildKey, setSelectedChildKey] = useState<string | null>(null);

  const handleDeleted = (id: string) => {
    setLocalTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const parentGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        name: string | null;
        email: string | null;
        txs: StripeTransaction[];
      }
    >();
    for (const tx of localTransactions) {
      const meta = parseMeta(tx);
      if (!meta.program && tx.payment_type !== "summer_tuition") continue;
      const key = tx.parent_id ?? tx.payer_email ?? "unknown";
      if (!map.has(key)) {
        const resolvedName = tx.parent_id
          ? (parentNameMap[tx.parent_id] ?? tx.payer_name ?? tx.payer_email ?? "Unknown")
          : (tx.payer_name ?? tx.payer_email ?? "Unknown");
        map.set(key, {
          key,
          name: resolvedName,
          email: tx.payer_email,
          txs: [],
        });
      }
      map.get(key)!.txs.push(tx);
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? ""),
    );
  }, [localTransactions, parentNameMap]);

  const selectedGroup = selectedParentKey
    ? (parentGroups.find((g) => g.key === selectedParentKey) ?? null)
    : null;

  const childGroups = useMemo((): ChildGroup[] => {
    if (!selectedGroup) return [];
    const map = new Map<string, ChildGroup>();
    for (const tx of selectedGroup.txs) {
      const key = tx.student_id ?? "unknown";
      if (!map.has(key)) {
        const name = tx.student_id
          ? (studentMap[tx.student_id] ?? tx.student_id.slice(0, 8))
          : "Unknown";
        map.set(key, { key, name, txs: [] });
      }
      map.get(key)!.txs.push(tx);
    }
    return Array.from(map.values());
  }, [selectedGroup, studentMap]);

  const effectiveChildKey = selectedChildKey ?? childGroups[0]?.key ?? null;
  const selectedChildGroup =
    childGroups.find((c) => c.key === effectiveChildKey) ?? null;

  // Determine which programs the selected child has
  const hasSummer =
    selectedChildGroup?.txs.some((tx) => {
      if (tx.payment_type === "summer_tuition") return true;
      const prog = parseMeta(tx).program as string | undefined;
      return prog === "summer_26" || prog === "both";
    }) ?? false;

  const hasSchoolYear =
    selectedChildGroup?.txs.some((tx) => {
      const prog = parseMeta(tx).program as string | undefined;
      return prog === "school_year_26_27" || prog === "both";
    }) ?? false;

  return (
    <>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {(["by-parent", "list"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor:
                activeTab === tab ? colors.mistyForest : "transparent",
              color: activeTab === tab ? "#ffffff" : colors.textSecondary,
              border: `1px solid ${activeTab === tab ? colors.mistyForest : colors.border}`,
            }}
          >
            {tab === "list" ? "All Transactions" : "Parent Tuition Checklist"}
          </button>
        ))}
      </div>

      {/* Tab 1 — All Transactions */}
      {activeTab === "list" && (
        <Table
          headers={["Type", "Status", "Payer", "Amount", "Net Amount", "Date"]}
        >
          {localTransactions.map((tx, index) => (
            <TableRow
              key={tx.id}
              index={index}
              onClick={() => setSelectedTransaction(tx)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  {formatPaymentType(tx.payment_type)}
                  {stripeUrl(tx) && (
                    <a
                      href={stripeUrl(tx)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: colors.mistyForest }}
                      title="View in Stripe"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={tx.status} />
              </TableCell>
              <TableCell>
                <div>
                  {tx.payment_type !== "donation" && tx.payer_name && (
                    <div className="font-medium text-gray-800">
                      {tx.payer_name}
                    </div>
                  )}
                  <div className="text-gray-500 text-xs">
                    {tx.payer_email ?? "—"}
                  </div>
                </div>
              </TableCell>
              <TableCell>{formatCents(tx.amount_cents, tx.currency)}</TableCell>
              <TableCell>
                {tx.cover_fees
                  ? formatCents(tx.intended_amount_cents, tx.currency)
                  : "—"}
              </TableCell>
              <TableCell>
                {new Date(tx.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Tab 2 — By Parent */}
      {activeTab === "by-parent" && (
        <div className="flex gap-4" style={{ minHeight: "400px" }}>
          {/* Left panel — parent list */}
          <div
            className="flex-shrink-0 overflow-y-auto rounded-xl"
            style={{
              width: "280px",
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.softCloud,
            }}
          >
            {parentGroups.map((group) => {
              const isActive = group.key === selectedParentKey;
              return (
                <button
                  key={group.key}
                  onClick={() => {
                    setSelectedParentKey(group.key);
                    setSelectedChildKey(null);
                  }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? colors.pastelSage
                      : "transparent",
                    borderBottom: `1px solid ${colors.divider}`,
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: colors.paleMarigold,
                      color: colors.warningText,
                    }}
                  >
                    {getInitials(group.name, group.email)}
                  </div>
                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{ color: colors.textPrimary }}
                    >
                      {group.name ?? group.email ?? "Unknown"}
                    </div>
                    {group.name && (
                      <div
                        className="text-xs truncate"
                        style={{ color: colors.textTertiary }}
                      >
                        {group.email ?? ""}
                      </div>
                    )}
                  </div>
                  {/* Payment status badge */}
                  {(() => {
                    const hasAwaiting = pendingRequests.some(r => r.parent_id === group.key);
                    return (
                      <span
                        className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          backgroundColor: hasAwaiting ? colors.paleMarigold : "#d1fae5",
                          color: hasAwaiting ? colors.warningText : "#065f46",
                        }}
                      >
                        {hasAwaiting ? "Awaiting" : "Up to date"}
                      </span>
                    );
                  })()}
                </button>
              );
            })}
          </div>

          {/* Right panel — program checklists */}
          <div className="flex-1 min-w-0">
            {!selectedGroup ? (
              <div
                className="h-full flex items-center justify-center rounded-xl"
                style={{
                  border: `1px dashed ${colors.border}`,
                  color: colors.textTertiary,
                }}
              >
                <p className="text-sm">
                  Select a parent to view their payment checklist
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 h-full">
                {/* Parent header */}
                <div>
                  <div
                    className="text-base font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    {selectedGroup.name ?? selectedGroup.email ?? "Unknown"}
                  </div>
                  {selectedGroup.name && (
                    <div
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      {selectedGroup.email}
                    </div>
                  )}
                </div>

                {/* Child tabs */}
                <div className="flex gap-2 flex-wrap">
                  {childGroups.map((child) => {
                    const isActive = child.key === effectiveChildKey;
                    return (
                      <button
                        key={child.key}
                        onClick={() => setSelectedChildKey(child.key)}
                        className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: isActive
                            ? colors.mistyForest
                            : "transparent",
                          color: isActive ? "#ffffff" : colors.textSecondary,
                          border: `1px solid ${isActive ? colors.mistyForest : colors.border}`,
                        }}
                      >
                        {child.name}
                      </button>
                    );
                  })}
                </div>

                {/* Checklist cards */}
                <div className="flex gap-4 flex-1 items-start">
                  {hasSummer && (
                    <ProgramChecklist
                      key={`summer-${effectiveChildKey}`}
                      title="Summer 2026"
                      items={SUMMER_ITEMS}
                      txs={selectedChildGroup?.txs ?? []}
                      program="summer_26"
                      onSelectTx={setSelectedTransaction}
                      parentId={selectedGroup?.key ?? null}
                      studentId={effectiveChildKey !== "unknown" ? effectiveChildKey : null}
                      pendingRequests={pendingRequests.filter(
                        (r) =>
                          r.parent_id === selectedGroup?.key &&
                          r.student_id === (effectiveChildKey !== "unknown" ? effectiveChildKey : null)
                      )}
                    />
                  )}
                  {hasSchoolYear && (
                    <ProgramChecklist
                      key={`school-${effectiveChildKey}`}
                      title="School Year 2026–2027"
                      items={SCHOOL_YEAR_ITEMS}
                      txs={selectedChildGroup?.txs ?? []}
                      program="school_year_26_27"
                      onSelectTx={setSelectedTransaction}
                      parentId={selectedGroup?.key ?? null}
                      studentId={effectiveChildKey !== "unknown" ? effectiveChildKey : null}
                      pendingRequests={pendingRequests.filter(
                        (r) =>
                          r.parent_id === selectedGroup?.key &&
                          r.student_id === (effectiveChildKey !== "unknown" ? effectiveChildKey : null)
                      )}
                    />
                  )}
                  {!hasSummer && !hasSchoolYear && (
                    <div
                      className="flex-1 flex items-center justify-center rounded-xl py-12"
                      style={{
                        border: `1px dashed ${colors.border}`,
                        color: colors.textTertiary,
                      }}
                    >
                      <p className="text-sm">No program transactions found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <TransactionDetailSidebar
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onDeleted={handleDeleted}
      />
    </>
  );
}
