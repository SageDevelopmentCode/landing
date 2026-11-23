"use client";

import { useState } from "react";
import {
  SCHOOL_YEAR_MONTHS,
  buildPaidDaysByMonth,
  formatCents,
  formatWeekdayKeys,
  getGradeTier,
  getHomeschoolSchoolYearPricing,
  type HomeschoolTier,
} from "@/shared/billing/school-year";
import { CheckIcon, StepLabel } from "@/app/parent/_garden/ui";
import type { HomeschoolDropInApp, PaidHomeschoolByStudent, StudentInfo } from "../page";
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
import { gradeTierLabel } from "./data";
import HomeschoolHistory from "./HomeschoolHistory";
import {
  buildSyHomeschoolCheckout,
  siblingUnits,
  syHomeschoolBase,
  syHomeschoolEligibleSiblings,
  syHomeschoolPaidMonthsOf,
  syHomeschoolPaymentQuote,
  syHomeschoolRequiredDays,
  syHomeschoolSiblingAmount,
  syHomeschoolSiblingPayloads,
  type PaymentMethod,
} from "./payloads";
import { MonthPicker, TierPicker, WeekdayPicker, requiredDaysLabel } from "./pickers";
import { DifferentDaysNote, Hint, TotalRow } from "./parts";

type Props = {
  app: HomeschoolDropInApp;
  studentName: string | null;
  parentId: string;
  parentEmail: string;
  paidData?: PaidHomeschoolByStudent[string];
  siblingApps: HomeschoolDropInApp[];
  siblingPaidHomeschool: PaidHomeschoolByStudent;
  siblingStudentMap: Record<string, StudentInfo>;
  initialView?: "plan" | "history";
  readOnly?: boolean;
  onClose: () => void;
};

const short = (m: number) => SCHOOL_YEAR_MONTHS.find((sm) => sm.index === m)?.short ?? m;

export default function SchoolYearHomeschoolFlow(p: Props) {
  const { app, paidData } = p;
  const gradeTier = getGradeTier(app.child_grade);
  const pricing = getHomeschoolSchoolYearPricing(app.use_updated_homeschool_pricing);
  const [view, setView] = useState<"plan" | "history">(p.initialView ?? "plan");
  const [selectedTier, setSelectedTier] = useState<HomeschoolTier | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set());
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"plan" | "sibling" | "payment">("plan");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [coverFees, setCoverFees] = useState(false);
  const { busy, pay } = usePayCheckout(p.readOnly);

  const paidMonthIndices = new Set<number>((paidData?.schoolYear ?? []).flatMap((e) => e.weeks));
  const paidDaysByMonth = buildPaidDaysByMonth(paidData?.schoolYear ?? []);
  const paidMonthsByTier = (paidData?.schoolYear ?? []).reduce<Record<string, Set<number>>>((acc, entry) => {
    if (!acc[entry.tier]) acc[entry.tier] = new Set();
    entry.weeks.forEach((w) => acc[entry.tier].add(w));
    return acc;
  }, {});

  const unitCount = selectedMonths.size;
  const baseAmountCents = syHomeschoolBase(app, selectedTier, selectedMonths);
  const eligible = syHomeschoolEligibleSiblings(p.siblingApps, p.siblingPaidHomeschool, selectedMonths);
  const sib = useSiblingSelection({
    eligibleIds: eligible.map((s) => s.student_id),
    primary: selectedMonths,
    isPaid: (id, m) => syHomeschoolPaidMonthsOf(p.siblingPaidHomeschool, id).has(m),
  });
  const siblingPayloads = syHomeschoolSiblingPayloads(
    eligible,
    sib.selection,
    selectedTier,
    selectedMonths,
    selectedWeekdays,
    p.siblingPaidHomeschool,
    p.siblingStudentMap,
  );
  const siblingTotal = siblingPayloads.reduce((s, x) => s + x.intendedAmountCents, 0);
  const combinedIntendedCents = baseAmountCents + siblingTotal;
  const quote = syHomeschoolPaymentQuote(combinedIntendedCents, coverFees, paymentMethod);
  const requiredDays = syHomeschoolRequiredDays(selectedTier);
  const canContinuePlan = selectedTier !== null && unitCount >= 1 && selectedWeekdays.size === requiredDays;

  const steps = eligible.length > 0 ? ["Plan", "Siblings", "Pay"] : ["Plan", "Pay"];
  const stepNo = step === "plan" ? 1 : step === "sibling" ? 2 : steps.length;
  const hasHistory = !!paidData && (paidData.summer.length > 0 || paidData.schoolYear.length > 0);

  const onPay = () =>
    pay(() =>
      selectedTier
        ? buildSyHomeschoolCheckout({
            parentId: p.parentId,
            parentEmail: p.parentEmail,
            app,
            selectedTier,
            selectedWeekdays,
            selectedMonthIndices: selectedMonths,
            coverFees,
            paymentMethod,
            siblings: siblingPayloads,
          })
        : null,
    );

  if (view === "history" && paidData) {
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
        <HomeschoolHistory paidData={paidData} onAddMore={() => setView("plan")} />
      </CheckoutSheet>
    );
  }

  const footer =
    step === "plan" ? (
      <CheckoutFooter
        primary={
          <ContinueButton disabled={!canContinuePlan} onClick={() => setStep(eligible.length > 0 ? "sibling" : "payment")}>
            {unitCount > 0 ? `Continue · ${formatCents(baseAmountCents)}` : "Continue"}
          </ContinueButton>
        }
        status={
          selectedTier === null
            ? "Choose a schedule to start"
            : selectedWeekdays.size !== requiredDays
              ? `Pick ${requiredDaysLabel(requiredDays)}`
              : unitCount === 0
                ? "Pick at least one month"
                : null
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
      title="Homeschool Drop-In"
      icon="🏡"
      note={p.studentName ? `${p.studentName} · School Year 26–27` : undefined}
      steps={steps}
      step={stepNo}
      footer={footer}
    >
      {step === "plan" ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-[var(--sf-soft)]">
            <span>{gradeTierLabel(gradeTier)}</span>
            <span>School Year 26–27 · Aug 2026–May 2027</span>
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
            <StepLabel n={1} done={selectedTier !== null}>
              Choose your schedule
            </StepLabel>
            <TierPicker
              value={selectedTier}
              onChange={(t) => {
                setSelectedTier(t);
                setSelectedMonths(new Set());
                setSelectedWeekdays(new Set());
              }}
              priceFor={(t) => pricing[t][gradeTier]}
              extraFor={(t) => {
                const paidSet = paidMonthsByTier[t];
                if (!paidSet || paidSet.size === 0) return null;
                return (
                  <span className="mt-2 flex flex-wrap gap-1">
                    {SCHOOL_YEAR_MONTHS.filter((m) => paidSet.has(m.index)).map((m) => {
                      const dl = formatWeekdayKeys(paidDaysByMonth[m.index] ?? []);
                      return (
                        <span key={m.index} className="inline-flex items-center gap-0.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-[var(--sf-sage-deep)]">
                          <CheckIcon className="h-2.5 w-2.5" />
                          {m.short}
                          {dl ? ` · ${dl}` : ""}
                        </span>
                      );
                    })}
                  </span>
                );
              }}
            />
          </div>
          {selectedTier !== null ? (
            <div>
              <StepLabel n={2} done={selectedWeekdays.size === requiredDays}>
                Choose your {requiredDaysLabel(requiredDays)} (Mon–Thu)
              </StepLabel>
              <WeekdayPicker
                label="Days of the week"
                selected={selectedWeekdays}
                required={requiredDays}
                onToggle={(k) =>
                  setSelectedWeekdays((prev) => {
                    const next = new Set(prev);
                    if (next.has(k)) next.delete(k);
                    else next.add(k);
                    return next;
                  })
                }
              />
              {selectedWeekdays.size > 0 && selectedWeekdays.size < requiredDays ? (
                <Hint>
                  Select {requiredDays - selectedWeekdays.size} more day{requiredDays - selectedWeekdays.size !== 1 ? "s" : ""}
                </Hint>
              ) : null}
            </div>
          ) : null}
          {selectedTier !== null ? (
            <div>
              <StepLabel n={3} done={unitCount > 0}>
                Select months to pay
              </StepLabel>
              <MonthPicker
                label="Months to pay"
                selected={selectedMonths}
                isPaid={(m) => paidMonthIndices.has(m)}
                subFor={(m) => (paidMonthIndices.has(m) ? formatWeekdayKeys(paidDaysByMonth[m] ?? []) || undefined : undefined)}
                onToggle={(m) => {
                  if (paidMonthIndices.has(m)) return;
                  setSelectedMonths((prev) => {
                    const next = new Set(prev);
                    if (next.has(m)) next.delete(m);
                    else next.add(m);
                    return next;
                  });
                }}
              />
              {unitCount > 0 ? (
                <div className="mt-3">
                  <TotalRow label={`${unitCount} month${unitCount !== 1 ? "s" : ""}`} value={formatCents(baseAmountCents)} />
                </div>
              ) : null}
              <DifferentDaysNote />
            </div>
          ) : null}
        </div>
      ) : step === "sibling" ? (
        <SiblingStep
          rows={eligible.map((s) => {
            const paidMonths = syHomeschoolPaidMonthsOf(p.siblingPaidHomeschool, s.student_id);
            const override = sib.overrides[s.student_id];
            const months = siblingUnits(override, selectedMonths, (m) => paidMonths.has(m));
            const primaryMonths = siblingUnits(undefined, selectedMonths, (m) => paidMonths.has(m));
            const same = months.length === primaryMonths.length && months.every((m, i) => m === primaryMonths[i]);
            const name = p.siblingStudentMap[s.student_id]?.name ?? "Sibling";
            return {
              id: s.student_id,
              name,
              grade: s.child_grade,
              amountCents: syHomeschoolSiblingAmount(s, selectedTier, months),
              summary:
                months.length === 0
                  ? "No months selected"
                  : same
                    ? `${months.length} mo. · same as ${p.studentName ?? "first child"}`
                    : `${months.length} mo. · ${months.map(short).join(", ")}`,
              editLabel: "Edit months",
              editorTitle: `Months for ${name}`,
              editor: (
                <MonthPicker
                  label={`Months for ${name}`}
                  selected={override ?? new Set(months)}
                  isPaid={(m) => paidMonths.has(m)}
                  onToggle={(m) => sib.toggleUnit(s.student_id, m)}
                />
              ),
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
        />
      )}
    </CheckoutSheet>
  );
}
