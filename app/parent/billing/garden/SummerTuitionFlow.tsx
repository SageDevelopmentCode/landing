"use client";

import { useState } from "react";
import { formatCents } from "@/shared/billing/school-year";
import { CheckIcon, StepLabel } from "@/app/parent/_garden/ui";
import { PillTabs } from "@/app/parent/_garden/tabs";
import type { StudentInfo, SummerEnrollment } from "../page";
import {
  CheckoutFooter,
  CheckoutSheet,
  ContinueButton,
  PayButton,
  PaymentMethodStep,
  SiblingStep,
  usePayCheckout,
  useSiblingSelection,
} from "./checkout";
import { SUMMER_WEEKS, TOTAL_WEEKS, gradeTierLabel } from "./data";
import {
  buildSummerCheckout,
  buildSummerNote,
  summerEligibleSiblings,
  summerPaymentQuote,
  summerPricing,
  summerSiblingPayloads,
  summerSiblingRow,
  type PaymentMethod,
} from "./payloads";
import { WeekPicker } from "./pickers";
import { TotalRow } from "./parts";
import NoteBox from "./NoteBox";

type Props = {
  enrollment: SummerEnrollment;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidWeeks: number[];
  initialNote: string;
  siblingEnrollments: SummerEnrollment[];
  siblingPaidWeeks: Record<string, number[]>;
  siblingStudentMap: Record<string, StudentInfo>;
  readOnly?: boolean;
  onClose: () => void;
};

export default function SummerTuitionFlow(p: Props) {
  const isOnWeeklyPlan = p.paidWeeks.length > 0;
  const [step, setStep] = useState<"plan" | "sibling" | "payment">("plan");
  const [tab, setTab] = useState<"weekly" | "full">("weekly");
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [coverFees, setCoverFees] = useState(false);
  const { busy, pay } = usePayCheckout(p.readOnly);

  const pr = summerPricing(p.enrollment.child_grade, tab, selectedWeeks);
  const eligible = summerEligibleSiblings(p.siblingEnrollments, p.siblingPaidWeeks, tab, selectedWeeks);
  const sib = useSiblingSelection({
    eligibleIds: eligible.map((s) => s.student_id),
    primary: selectedWeeks,
    isPaid: (id, w) => (p.siblingPaidWeeks[id] ?? []).includes(w),
  });
  const siblingPayloads = summerSiblingPayloads(eligible, sib.selection, selectedWeeks, tab, p.siblingPaidWeeks, p.siblingStudentMap);
  const siblingTotal = siblingPayloads.reduce((s, x) => s + x.intendedAmountCents, 0);
  const combinedIntendedCents = pr.intendedAmountCents + siblingTotal;
  const quote = summerPaymentQuote(combinedIntendedCents, coverFees, paymentMethod);

  const unpaidWeeks = SUMMER_WEEKS.map((w) => w.week).filter((w) => !p.paidWeeks.includes(w));
  // Fix: "Select All" only picks weeks that aren't paid yet.
  const allUnpaidSelected = unpaidWeeks.length > 0 && unpaidWeeks.every((w) => selectedWeeks.has(w));

  const toggleWeek = (week: number) => {
    if (p.paidWeeks.includes(week)) return;
    setSelectedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  };

  const steps = eligible.length > 0 ? ["Plan", "Siblings", "Pay"] : ["Plan", "Pay"];
  const stepNo = step === "plan" ? 1 : step === "sibling" ? 2 : steps.length;

  const continueLabel =
    tab === "weekly"
      ? selectedWeeks.size > 0
        ? `Continue · ${formatCents(pr.effectiveTotal)}`
        : "Select weeks to continue"
      : `Continue · ${formatCents(pr.fullRate)}`;

  const onPay = () =>
    pay(() =>
      buildSummerCheckout({
        parentId: p.parentId,
        parentEmail: p.parentEmail,
        enrollment: p.enrollment,
        tab,
        selectedWeeks,
        intendedAmountCents: pr.intendedAmountCents,
        coverFees,
        paymentMethod,
        siblings: siblingPayloads,
      }),
    );

  const footer =
    step === "plan" ? (
      <CheckoutFooter
        primary={
          <ContinueButton disabled={!pr.canContinue} onClick={() => setStep(eligible.length > 0 ? "sibling" : "payment")}>
            {continueLabel}
          </ContinueButton>
        }
      />
    ) : step === "sibling" ? (
      <CheckoutFooter
        onBack={() => setStep("plan")}
        primary={
          <ContinueButton onClick={() => setStep("payment")}>
            {siblingPayloads.length > 0 ? `Continue · ${formatCents(combinedIntendedCents)}` : "Continue"}
          </ContinueButton>
        }
      />
    ) : (
      <CheckoutFooter
        onBack={busy ? undefined : () => setStep(eligible.length > 0 ? "sibling" : "plan")}
        primary={<PayButton busy={busy} disabled={!coverFees} totalCents={quote.totalWithFees} onClick={onPay} />}
      />
    );

  return (
    <CheckoutSheet
      open
      onClose={p.onClose}
      busy={busy}
      title="Summer 2026 Tuition"
      icon="☀️"
      note={p.studentName ? `${p.studentName}${p.enrollment.child_grade ? ` · ${p.enrollment.child_grade}` : ""} · ${gradeTierLabel(pr.tier)}` : undefined}
      steps={steps}
      step={stepNo}
      footer={footer}
      toolbar={
        step === "plan" ? (
          <PillTabs
            label="Summer plan"
            size="sm"
            className="!mx-0 !px-0"
            value={tab}
            onChange={(v) => {
              if (v === "full" && isOnWeeklyPlan) return;
              setTab(v);
            }}
            options={[
              { value: "weekly", label: "Pay Weekly" },
              {
                value: "full",
                label: (
                  <>
                    Full Summer <span className="rounded-full bg-[var(--sf-mint)] px-1.5 text-[11px] text-[var(--sf-sage-deep)]">10% off</span>
                  </>
                ),
                disabled: isOnWeeklyPlan,
              },
            ]}
          />
        ) : null
      }
    >
      {step === "plan" && tab === "weekly" ? (
        <div className="flex flex-col gap-4">
          {isOnWeeklyPlan ? <p className="sf-hand -mt-1 text-lg text-[var(--sf-sage-deep)]">Full Summer isn&apos;t available — you&apos;re on the weekly plan</p> : null}
          <div className="flex items-center justify-between gap-3">
            <StepLabel n={1} done={selectedWeeks.size > 0}>
              Select the weeks you&apos;d like to pay for
            </StepLabel>
            <button
              type="button"
              onClick={() => setSelectedWeeks(allUnpaidSelected ? new Set() : new Set(unpaidWeeks))}
              className="-mt-3 inline-flex min-h-11 shrink-0 cursor-pointer items-center px-2 text-sm font-extrabold text-[var(--sf-sage-deep)]"
            >
              {allUnpaidSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
          <WeekPicker label="Summer weeks" selected={selectedWeeks} isPaid={(w) => p.paidWeeks.includes(w)} onToggle={toggleWeek} />
          <div className="flex flex-col gap-1">
            {isOnWeeklyPlan ? (
              <p className="text-xs font-extrabold text-[var(--sf-sage-deep)]">
                ✓ {p.paidWeeks.length} week{p.paidWeeks.length !== 1 ? "s" : ""} already paid
              </p>
            ) : null}
            <TotalRow
              label={
                <>
                  {selectedWeeks.size === 0
                    ? isOnWeeklyPlan
                      ? "Select more weeks to pay for"
                      : "No weeks selected"
                    : pr.allWeeksSelected
                      ? "All 12 weeks · Full Summer discount applied"
                      : isOnWeeklyPlan
                        ? `paying for ${selectedWeeks.size} more week${selectedWeeks.size !== 1 ? "s" : ""} × ${formatCents(pr.weeklyRate)}/wk`
                        : `${selectedWeeks.size} week${selectedWeeks.size !== 1 ? "s" : ""} × ${formatCents(pr.weeklyRate)}/wk`}
                  {pr.allWeeksSelected ? (
                    <span className="ml-1.5 text-xs line-through">{formatCents(pr.weeklyTotal)}</span>
                  ) : null}
                  {pr.allWeeksSelected ? (
                    <span className="ml-1.5 rounded-full bg-[var(--sf-sage)] px-2 py-0.5 text-[11px] font-extrabold text-white">Save 10%</span>
                  ) : null}
                </>
              }
              value={selectedWeeks.size > 0 ? formatCents(pr.effectiveTotal) : "—"}
            />
          </div>
          <NoteBox
            title="Planning to add more weeks later?"
            body="Leave a note letting us know which weeks you're planning to commit to — we'll hold your spot."
            placeholder="e.g. I plan to add weeks 7–9 in July…"
            initialNote={p.initialNote}
            readOnly={p.readOnly}
            build={(text) => buildSummerNote(p.parentId, p.enrollment, text)}
          />
        </div>
      ) : step === "plan" ? (
        <div className="flex flex-col gap-4">
          <div className="relative rounded-[26px] bg-white p-5 ring-1 ring-[var(--sf-ink)]/10">
            <span className="absolute right-4 top-4 rounded-full bg-[var(--sf-sage)] px-2.5 py-0.5 text-xs font-extrabold text-white">Save 10%</span>
            <p className="text-xs font-extrabold text-[var(--sf-soft)]">Full Summer · 12 Weeks</p>
            <p className="text-xs font-bold text-[var(--sf-soft)]">{gradeTierLabel(pr.tier)}</p>
            <p className="sf-display mt-1 text-4xl">{formatCents(pr.fullRate)}</p>
            <p className="text-sm font-bold text-[var(--sf-soft)]">
              <span className="line-through">{formatCents(pr.fullOriginal)}</span> · {formatCents(pr.savings)} off
            </p>
            <p className="mt-3 text-xs font-bold text-[var(--sf-soft)]">Monday–Thursday, 9am–3pm · May 26 – Aug 13, 2026</p>
          </div>
          <p className="text-sm font-bold text-[var(--sf-soft)]">Your child will experience all 12 weeks of adventure:</p>
          <ul className="flex flex-col gap-1.5">
            {SUMMER_WEEKS.map((w) => (
              <li key={w.week} className="flex items-center gap-3 rounded-[16px] bg-white/70 px-3 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span className="min-w-0">
                  <span className="text-xs font-extrabold">Week {w.week}</span>{" "}
                  <span className="text-xs font-bold text-[var(--sf-soft)]">{w.dates}</span>
                  <span className="block truncate text-xs font-bold text-[var(--sf-soft)]">
                    <span aria-hidden="true">{w.emoji}</span> {w.theme}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <span className="sr-only">{TOTAL_WEEKS} weeks</span>
        </div>
      ) : step === "sibling" ? (
        <SiblingStep
          rows={eligible.map((s) => {
            const r = summerSiblingRow(s, sib.selection, selectedWeeks, tab, p.siblingPaidWeeks);
            const primaryWeeksForSib = Array.from(selectedWeeks)
              .filter((w) => !r.paid.includes(w))
              .sort((a, b) => a - b);
            const same = r.sibWeeks.length === primaryWeeksForSib.length && r.sibWeeks.every((w, i) => w === primaryWeeksForSib[i]);
            const name = p.siblingStudentMap[s.student_id]?.name ?? "Sibling";
            return {
              id: s.student_id,
              name,
              grade: s.child_grade,
              amountCents: r.sibAmount,
              showZero: r.sibPlanType === "full",
              summary:
                r.sibPlanType === "full"
                  ? "Full Summer · 12 weeks"
                  : r.sibWeeks.length === 0
                    ? "No weeks selected"
                    : same
                      ? `Weeks ${r.sibWeeks.join(", ")} · same as ${p.studentName ?? "first child"}`
                      : `Weeks ${r.sibWeeks.join(", ")}`,
              editLabel: "Edit weeks",
              editorTitle: `Weeks for ${name}`,
              editor:
                r.sibPlanType === "weekly" ? (
                  <WeekPicker
                    label={`Weeks for ${name}`}
                    selected={r.override ?? new Set(r.sibWeeks)}
                    isPaid={(w) => r.paid.includes(w)}
                    onToggle={(w) => sib.toggleUnit(s.student_id, w)}
                  />
                ) : null,
            };
          })}
          isIncluded={(id) => sib.included[id] ?? true}
          editorOpen={sib.editorOpen}
          onToggle={sib.toggleIncluded}
          onEditor={sib.setEditor}
          combinedCents={combinedIntendedCents}
          anyIncluded={siblingPayloads.length > 0}
        />
      ) : (
        <PaymentMethodStep
          method={paymentMethod}
          onMethod={setPaymentMethod}
          feeLine={quote.feeLine}
          coverFees={coverFees}
          onCoverFees={setCoverFees}
          totalCents={quote.totalWithFees}
          footnote="Summer tuition payments are non-refundable."
        />
      )}
    </CheckoutSheet>
  );
}
