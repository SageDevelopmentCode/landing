"use client";

import { useState } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";
import { EmptyState } from "@/app/parent/_garden/states";
import { Arrow, SectionHeader } from "@/app/parent/_garden/ui";
import { buildSupplyFeeStudentLines } from "@/app/lib/supply-fee-breakdown";
import { formatCents, formatHomeschoolSubline, formatSchoolYearMonthsFromMetadata } from "@/shared/billing/school-year";
import type { StripeTransaction, StudentInfo } from "../page";
import { formatDate, formatPaymentType } from "./data";

type Meta = Record<string, string>;
const metaOf = (tx: StripeTransaction) => (tx.metadata ?? {}) as Meta;

function txTitle(tx: StripeTransaction): string {
  if (tx.description) return tx.description;
  if (tx.payment_type === "supply_fee") {
    return metaOf(tx).bundle_type ? "Annual Supply Fee + August 2026 Tuition" : "Annual Supply Fee";
  }
  return "—";
}

function txType(tx: StripeTransaction): string {
  if (tx.payment_type === "supply_fee" && metaOf(tx).bundle_type) return "Supply Fee + School Year Tuition";
  return formatPaymentType(tx.payment_type);
}

function txStudentIds(tx: StripeTransaction): string[] {
  const meta = metaOf(tx);
  const sibIds =
    (tx.payment_type === "supply_fee" && meta.bundle_type ? meta.sibling_supply_student_ids : meta.sibling_student_ids)?.split(",").filter(Boolean) ?? [];
  return [...(tx.student_id ? [tx.student_id] : []), ...sibIds];
}

/** Status is never colour alone. */
export function TxStatus({ status }: { status: string }) {
  const done = status === "completed";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-extrabold ${done ? "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]" : "bg-[var(--sf-butter)] text-[#7a5b00]"}`}>
      {done ? "✓ Paid" : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}


export default function PaymentHistory({
  transactions,
  studentMap,
}: {
  transactions: StripeTransaction[];
  studentMap: Record<string, StudentInfo>;
}) {
  const [selected, setSelected] = useState<StripeTransaction | null>(null);

  // Student column, as in the original table: primary name, then sibling names.
  const studentLabel = (tx: StripeTransaction) => {
    const primaryName = studentMap[tx.student_id ?? ""]?.name ?? "—";
    const sibNames = txStudentIds(tx)
      .filter((id) => id !== tx.student_id)
      .map((id) => studentMap[id]?.name)
      .filter(Boolean) as string[];
    return sibNames.length > 0 ? [primaryName, ...sibNames].join(", ") : primaryName;
  };
  const rowLabel = (tx: StripeTransaction) =>
    `${txTitle(tx) === "—" ? txType(tx) : txTitle(tx)}, ${studentLabel(tx)}, ${formatDate(tx.created_at)}, ${formatCents(tx.amount_cents)}, ${
      tx.status === "completed" ? "Paid" : tx.status
    }. View receipt`;

  return (
    <section aria-labelledby="billing-history">
      <SectionHeader id="billing-history" title="Payment History" />
      {transactions.length === 0 ? (
        <EmptyState
          emoji="🧾"
          tint="butter"
          title="No transactions yet"
          body="Your payment history will appear here once a transaction is processed."
        />
      ) : (
        <>
          {/* Wide screens: the original table. It needs ~960px, so below xl the stacked rows are used;
              overflow-x-auto (not hidden) so a long row can never silently cut off the Amount column. */}
          <div className="hidden overflow-x-auto rounded-[26px] bg-white shadow-[0_18px_40px_-28px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/[0.06] xl:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--sf-ink)]/[0.06] text-left text-[11px] font-extrabold uppercase tracking-wide text-[var(--sf-soft)]">
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Date</th>
                  <th scope="col" className="px-4 py-3">Description</th>
                  <th scope="col" className="px-4 py-3">Student</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Type</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-right">Amount</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-2 py-3">
                    <span className="sr-only">Receipt</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelected(tx)}
                    className="group cursor-pointer border-b border-[var(--sf-ink)]/[0.04] transition-colors last:border-0 hover:bg-[var(--sf-butter)]/25"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 font-bold text-[var(--sf-soft)]">{formatDate(tx.created_at)}</td>
                    <td className="max-w-[220px] truncate px-4 py-3.5 font-extrabold">{txTitle(tx)}</td>
                    <td className="max-w-[180px] truncate px-4 py-3.5 font-bold text-[var(--sf-soft)]">{studentLabel(tx)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-bold text-[var(--sf-soft)]">{txType(tx)}</td>
                    <td className="sf-display whitespace-nowrap px-4 py-3.5 text-right text-base">{formatCents(tx.amount_cents)}</td>
                    <td className="px-4 py-3.5">
                      <TxStatus status={tx.status} />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(tx);
                        }}
                        aria-label={rowLabel(tx)}
                        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-[var(--sf-soft)] transition hover:bg-white group-hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]"
                      >
                        <Arrow className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones, tablets and small laptops: the same rows, stacked */}
          <ul className="flex flex-col gap-2.5 xl:hidden">
            {transactions.map((tx) => (
              <li key={tx.id}>
                <button
                  type="button"
                  onClick={() => setSelected(tx)}
                  aria-label={rowLabel(tx)}
                  className="flex min-h-16 w-full cursor-pointer items-start gap-3 rounded-[22px] bg-white px-4 py-3 text-left shadow-[0_12px_30px_-24px_rgba(43,42,38,0.5)] ring-1 ring-[var(--sf-ink)]/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold leading-snug">{txTitle(tx) === "—" ? txType(tx) : txTitle(tx)}</span>
                    <span className="block truncate text-xs font-bold text-[var(--sf-soft)]">{studentLabel(tx)}</span>
                    <span className="block text-xs font-bold text-[var(--sf-soft)]">
                      {formatDate(tx.created_at)} · {txType(tx)}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="sf-display text-base">{formatCents(tx.amount_cents)}</span>
                    <TxStatus status={tx.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <ReceiptSheet tx={selected} studentMap={studentMap} onClose={() => setSelected(null)} />
    </section>
  );
}

function Line({ label, value, sub, strong }: { label: string; value?: string | null; sub?: string | null; strong?: boolean }) {
  return (
    <div>
      <div className={`flex items-baseline justify-between gap-3 ${strong ? "text-[15px] font-extrabold" : "text-sm font-bold"}`}>
        <span className={strong ? "" : "text-[var(--sf-soft)]"}>{label}</span>
        {value ? <span>{value}</span> : null}
      </div>
      {sub ? <p className="text-xs font-semibold text-[var(--sf-soft)]">{sub}</p> : null}
    </div>
  );
}

/** Receipt: same fields as the old "Transaction Details" sidebar. */
function ReceiptSheet({ tx, studentMap, onClose }: { tx: StripeTransaction | null; studentMap: Record<string, StudentInfo>; onClose: () => void }) {
  return (
    <GardenSheet open={!!tx} onClose={onClose} title="Transaction Details" icon="🧾" note={tx ? formatDate(tx.created_at) : undefined}>
      {tx ? <ReceiptBody tx={tx} studentMap={studentMap} /> : null}
    </GardenSheet>
  );
}

function ReceiptBody({ tx, studentMap }: { tx: StripeTransaction; studentMap: Record<string, StudentInfo> }) {
  const meta = metaOf(tx);
  const isSupplyFeeCheckout = tx.payment_type === "supply_fee";
  const isSupplyFeeBundle = isSupplyFeeCheckout && !!meta.bundle_type;
  const sibIds = isSupplyFeeCheckout
    ? (meta.sibling_supply_student_ids?.split(",").filter(Boolean) ?? [])
    : (meta.sibling_student_ids?.split(",").filter(Boolean) ?? []);
  const sibCentsArr = isSupplyFeeCheckout ? [] : (meta.sibling_intended_cents?.split(",").map(Number).filter(Boolean) ?? []);
  const sibCentsTotal = sibCentsArr.reduce((a, b) => a + b, 0);
  const primaryIntended = !isSupplyFeeCheckout && tx.intended_amount_cents != null ? tx.intended_amount_cents - sibCentsTotal : null;
  const primaryWeeks = meta.weeks?.split(",").filter(Boolean) ?? [];
  const primaryPlan =
    meta.plan_type === "full"
      ? "Full Summer"
      : primaryWeeks.length > 0
        ? `${primaryWeeks.length} week${primaryWeeks.length !== 1 ? "s" : ""} · Weekly`
        : null;
  const sibWeekGroups = meta.sibling_weeks?.split(";") ?? [];
  const sibPlanTypes = meta.sibling_plan_types?.split(",") ?? [];
  const fee = tx.cover_fees && tx.intended_amount_cents != null ? tx.amount_cents - tx.intended_amount_cents : 0;

  function getSubLine(): string | null {
    if (tx.payment_type === "summer_tuition") return null;
    if (meta.selected_months) {
      if (tx.payment_type === "school_year_tuition") {
        const formatted = formatSchoolYearMonthsFromMetadata(meta.selected_months, "short");
        if (formatted) return formatted;
      }
      const months = meta.selected_months.split(",").filter(Boolean);
      if (months.length > 0) return months.join(", ");
    }
    if (tx.payment_type === "homeschool_dropin") return formatHomeschoolSubline(meta);
    if (meta.selected_weeks) {
      const wks = meta.selected_weeks.split(",").filter(Boolean);
      if (wks.length > 0) return `${wks.length} week${wks.length !== 1 ? "s" : ""}`;
    }
    if (meta.selected_fridays) {
      const fridays = meta.selected_fridays.split(",").filter(Boolean);
      if (fridays.length > 0) return `${fridays.length} Friday${fridays.length !== 1 ? "s" : ""}`;
    }
    return null;
  }
  const subLine = getSubLine();
  const hasSiblings = sibIds.length > 0;
  const hasStudents = !!tx.student_id || hasSiblings;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[24px] bg-white p-4 ring-1 ring-[var(--sf-ink)]/10">
        <div className="flex items-center justify-between gap-3">
          <TxStatus status={tx.status} />
          <span className="text-xs font-bold text-[var(--sf-soft)]">{formatDate(tx.created_at)}</span>
        </div>
        <p className="mt-3 text-base font-extrabold">{isSupplyFeeBundle ? "Supply Fee + School Year Tuition" : formatPaymentType(tx.payment_type)}</p>
        {tx.description ? <p className="text-sm font-semibold text-[var(--sf-soft)]">{tx.description}</p> : null}
      </div>

      {hasStudents ? (
        <div className="rounded-[24px] bg-white p-4 ring-1 ring-[var(--sf-ink)]/10">
          <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]">{hasSiblings ? "Students & Amounts" : "Student"}</h3>
          <div className="flex flex-col gap-3">
            {isSupplyFeeCheckout ? (
              <>
                {tx.student_id ? (
                  <div>
                    <p className="mb-1 text-sm font-extrabold">{studentMap[tx.student_id]?.name ?? "—"}</p>
                    {buildSupplyFeeStudentLines(meta, tx.student_id, true).map((line) => (
                      <Line key={line.label} label={line.label} value={formatCents(line.amountCents)} sub={line.sublabel} />
                    ))}
                  </div>
                ) : null}
                {sibIds.map((sibId) => (
                  <div key={sibId}>
                    <p className="mb-1 text-sm font-extrabold">{studentMap[sibId]?.name ?? sibId}</p>
                    {buildSupplyFeeStudentLines(meta, sibId, false).map((line) => (
                      <Line key={line.label} label={line.label} value={formatCents(line.amountCents)} sub={line.sublabel} />
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <>
                {tx.student_id ? (
                  <div>
                    <Line strong label={studentMap[tx.student_id]?.name ?? "—"} value={primaryIntended != null ? formatCents(primaryIntended) : null} />
                    {primaryPlan ? <p className="text-xs font-semibold text-[var(--sf-soft)]">{primaryPlan}</p> : null}
                    {subLine ? <p className="text-xs font-semibold text-[var(--sf-soft)]">{subLine}</p> : null}
                  </div>
                ) : null}
                {sibIds.map((sibId, i) => {
                  const sibWeeks = sibWeekGroups[i]?.split(",").filter(Boolean) ?? [];
                  const sibPlan =
                    sibPlanTypes[i] === "full"
                      ? "Full Summer"
                      : sibWeeks.length > 0
                        ? `${sibWeeks.length} week${sibWeeks.length !== 1 ? "s" : ""} · Weekly`
                        : null;
                  const sibCents = sibCentsArr[i] ?? 0;
                  return (
                    <div key={sibId}>
                      <Line strong label={studentMap[sibId]?.name ?? sibId} value={sibCents > 0 ? formatCents(sibCents) : null} />
                      {sibPlan ? <p className="text-xs font-semibold text-[var(--sf-soft)]">{sibPlan}</p> : null}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 rounded-[24px] bg-[var(--sf-mint)]/50 p-4">
        {tx.intended_amount_cents != null ? <Line label="Subtotal" value={formatCents(tx.intended_amount_cents)} /> : null}
        {tx.cover_fees && fee > 0 ? <Line label="Card processing fee" value={formatCents(fee)} /> : null}
        <div className="mt-1 border-t border-dashed border-[var(--sf-ink)]/15 pt-2">
          <Line strong label="Total charged" value={formatCents(tx.amount_cents)} />
        </div>
      </div>

      {tx.payer_email ? (
        <p className="text-xs font-bold text-[var(--sf-soft)]">
          Paid by <span className="text-[var(--sf-ink)]">{tx.payer_email}</span>
        </p>
      ) : null}
    </div>
  );
}
