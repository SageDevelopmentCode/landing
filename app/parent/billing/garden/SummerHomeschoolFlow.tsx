"use client";

import { useState } from "react";
import { WEEKDAYS, formatCents, getGradeTier } from "@/shared/billing/school-year";
import { StepLabel } from "@/app/parent/_garden/ui";
import type { HomeschoolDropInApp, PaidHomeschoolByStudent } from "../page";
import { CheckoutFooter, CheckoutSheet, ContinueButton, PayButton, PaymentMethodStep, usePayCheckout } from "./checkout";
import { HOMESCHOOL_SUMMER_PRICING, SUMMER_WEEKS, deriveTier, gradeTierLabel } from "./data";
import HomeschoolHistory from "./HomeschoolHistory";
import NoteBox from "./NoteBox";
import {
  buildHomeschoolNote,
  buildSummerHomeschoolCheckout,
  summerHomeschoolBase,
  summerHomeschoolPaidDaysByWeek,
  summerHomeschoolPaymentQuote,
  type PaymentMethod,
} from "./payloads";
import { SelectTile } from "./parts";

type Props = {
  app: HomeschoolDropInApp;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidData?: PaidHomeschoolByStudent[string];
  initialNote: string;
  initialView?: "plan" | "history";
  readOnly?: boolean;
  onClose: () => void;
};

export default function SummerHomeschoolFlow(p: Props) {
  const gradeTier = getGradeTier(p.app.child_grade);
  const [view, setView] = useState<"plan" | "history">(p.initialView ?? "plan");
  const [weekSelections, setWeekSelections] = useState<Record<number, Set<string>>>({});
  const [step, setStep] = useState<"plan" | "payment">("plan");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [coverFees, setCoverFees] = useState(false);
  const { busy, pay } = usePayCheckout(p.readOnly);

  const paidDaysByWeek = summerHomeschoolPaidDaysByWeek(p.paidData);
  const baseAmountCents = summerHomeschoolBase(weekSelections, p.app.child_grade);
  const quote = summerHomeschoolPaymentQuote(baseAmountCents, coverFees, paymentMethod);
  const canContinuePlan = Object.values(weekSelections).some((d) => d.size > 0);
  const hasHistory = !!p.paidData && (p.paidData.summer.length > 0 || p.paidData.schoolYear.length > 0);

  const toggleWeekDay = (weekNum: number, dayKey: string) => {
    if (paidDaysByWeek[weekNum]?.has(dayKey)) return;
    setWeekSelections((prev) => {
      const current = new Set(prev[weekNum] ?? []);
      if (current.has(dayKey)) {
        current.delete(dayKey);
      } else if (current.size < 3) {
        current.add(dayKey);
      }
      return { ...prev, [weekNum]: current };
    });
  };

  if (view === "history" && p.paidData) {
    return (
      <CheckoutSheet
        open
        onClose={p.onClose}
        title="Current Plan"
        icon="📒"
        note={p.studentName ?? undefined}
        steps={[]}
        step={1}
        onBack={p.initialView === "history" ? undefined : () => setView("plan")}
      >
        <HomeschoolHistory paidData={p.paidData} onAddMore={() => setView("plan")} />
      </CheckoutSheet>
    );
  }

  const onPay = () =>
    pay(() =>
      buildSummerHomeschoolCheckout({
        parentId: p.parentId,
        parentEmail: p.parentEmail,
        app: p.app,
        weekSelections,
        coverFees,
        paymentMethod,
      }),
    );

  const selectedRows = Object.entries(weekSelections)
    .filter(([, d]) => d.size > 0)
    .sort(([a], [b]) => Number(a) - Number(b));

  return (
    <CheckoutSheet
      open
      onClose={p.onClose}
      busy={busy}
      title="Homeschool Drop-In"
      icon="🏡"
      note={p.studentName ?? undefined}
      steps={["Weeks & days", "Pay"]}
      step={step === "plan" ? 1 : 2}
      footer={
        step === "plan" ? (
          <CheckoutFooter
            primary={
              <ContinueButton disabled={!canContinuePlan} onClick={() => setStep("payment")}>
                Continue
              </ContinueButton>
            }
            status={canContinuePlan ? null : "Pick at least one day"}
          />
        ) : (
          <CheckoutFooter
            onBack={busy ? undefined : () => setStep("plan")}
            primary={<PayButton busy={busy} disabled={!coverFees} totalCents={quote.totalWithFees} onClick={onPay} />}
          />
        )
      }
    >
      {step === "plan" ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-[var(--sf-soft)]">
            <span>{gradeTierLabel(gradeTier)}</span>
            <span>Summer 2026 · May 26 – Aug 13</span>
          </div>
          {hasHistory ? (
            <button
              type="button"
              onClick={() => setView("history")}
              className="-mt-3 inline-flex min-h-11 w-fit cursor-pointer items-center text-sm font-extrabold text-[var(--sf-sage-deep)] underline-offset-4 hover:underline"
            >
              View current plan
            </button>
          ) : null}
          <div>
            <StepLabel n={1} done={canContinuePlan}>
              Choose up to 3 days per week
            </StepLabel>
            <ul className="flex flex-col gap-2">
              {SUMMER_WEEKS.map((w) => {
                const availableDays = WEEKDAYS.filter((day) => !w.days || w.days.includes(day.key));
                const paidDays = paidDaysByWeek[w.week] ?? new Set<string>();
                const isFullyPaid = availableDays.every((day) => paidDays.has(day.key));
                const days = weekSelections[w.week] ?? new Set<string>();
                const weekRate = days.size > 0 ? HOMESCHOOL_SUMMER_PRICING[deriveTier(days.size)][gradeTier] : 0;
                return (
                  <li
                    key={w.week}
                    role="group"
                    aria-label={`Week ${w.week}, ${w.dates}`}
                    className={`rounded-[22px] px-3 py-3 ${isFullyPaid ? "bg-[var(--sf-mint)]/40" : days.size > 0 ? "bg-[var(--sf-peach)]/50 ring-2 ring-[var(--sf-peach)]" : "bg-white ring-1 ring-[var(--sf-ink)]/10"}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="text-base leading-none" aria-hidden="true">
                          {w.emoji}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold">
                            Wk {w.week} <span className="font-bold text-[var(--sf-soft)]">{w.dates}</span>
                          </p>
                          <p className="text-xs font-extrabold leading-tight text-[var(--sf-soft)]">{w.theme}</p>
                          <p className="text-[11px] font-semibold leading-tight text-[var(--sf-soft)]/80">{w.highlights.join(" · ")}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-extrabold">
                        {isFullyPaid ? (
                          <span className="rounded-full bg-[var(--sf-mint)] px-2 py-0.5 text-[var(--sf-sage-deep)]">✓ Paid</span>
                        ) : paidDays.size > 0 ? (
                          <span className="rounded-full bg-[var(--sf-mint)] px-2 py-0.5 text-[var(--sf-sage-deep)]">
                            ✓ {Array.from(paidDays).map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")} paid
                          </span>
                        ) : days.size > 0 ? (
                          formatCents(weekRate)
                        ) : (
                          <span className="text-[var(--sf-soft)]/60">—</span>
                        )}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {availableDays.map((day) => (
                        <SelectTile
                          key={day.key}
                          checked={days.has(day.key)}
                          paid={paidDays.has(day.key)}
                          disabled={!days.has(day.key) && days.size >= 3}
                          onToggle={() => toggleWeekDay(w.week, day.key)}
                          tint="peach"
                          className="items-center text-center"
                        >
                          {day.label}
                        </SelectTile>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {canContinuePlan ? (
            <div className="rounded-[22px] bg-[var(--sf-mint)]/60 px-4 py-3" aria-live="polite">
              {selectedRows.map(([wk, d]) => {
                const rate = HOMESCHOOL_SUMMER_PRICING[deriveTier(d.size)][gradeTier];
                const dayLabels = WEEKDAYS.filter((day) => d.has(day.key))
                  .map((day) => day.label)
                  .join(", ");
                return (
                  <div key={wk} className="flex items-center justify-between text-xs font-bold text-[var(--sf-soft)]">
                    <span>
                      Wk {Number(wk)} · {dayLabels}
                    </span>
                    <span className="text-[var(--sf-ink)]">{formatCents(rate)}</span>
                  </div>
                );
              })}
              <div className="mt-2 flex items-center justify-between border-t border-dashed border-[var(--sf-ink)]/15 pt-2">
                <span className="text-sm font-bold text-[var(--sf-soft)]">Total</span>
                <span className="sf-display text-xl">{formatCents(baseAmountCents)}</span>
              </div>
            </div>
          ) : null}
          <NoteBox
            title="Planning to add more days later?"
            body="Leave a note letting us know which days you're planning to commit to — we'll hold your spot."
            placeholder="e.g. I plan to add Tuesdays in weeks 7–9…"
            initialNote={p.initialNote}
            readOnly={p.readOnly}
            build={(text) => buildHomeschoolNote(p.parentId, p.app, text)}
          />
        </div>
      ) : (
        <PaymentMethodStep
          method={paymentMethod}
          onMethod={setPaymentMethod}
          feeLine={quote.feeLine}
          coverFees={coverFees}
          onCoverFees={setCoverFees}
          totalCents={quote.totalWithFees}
        />
      )}
    </CheckoutSheet>
  );
}
