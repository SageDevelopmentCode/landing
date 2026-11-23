"use client";

import { useState, type ReactNode } from "react";
import { BUNDLE_MONTH_INDEX, SUPPLY_FEE_CENTS, formatCents, type HomeschoolTier } from "@/shared/billing/school-year";
import { StepLabel } from "@/app/parent/_garden/ui";
import type { PaidHomeschoolByStudent } from "../page";
import { CheckoutFooter, CheckoutSheet, ContinueButton, PayButton, PaymentMethodStep, usePayCheckout } from "./checkout";
import { gradeTierLabel } from "./data";
import {
  buildSupplyFeeCheckout,
  supplyFeeQuote,
  supplyFeeSiblingTotal,
  type PaymentMethod,
  type ProgramType,
  type SupplyFeeState,
  type SupplyFeeStudent,
} from "./payloads";
import { MonthPicker, TierPicker, WeekdayPicker, requiredDaysLabel } from "./pickers";
import { DifferentDaysNote, Hint, TotalRow, firstName } from "./parts";

export type SupplyFeeCandidate = {
  studentId: string;
  studentName: string | null;
  childGrade: string | null;
  programType: ProgramType;
};

type Props = {
  studentId: string;
  studentName: string | null;
  childGrade: string | null;
  programType: ProgramType;
  applicationId?: string;
  paidSchoolYearMonths: number[];
  /** Other children whose supply fee is unpaid (the sibling pre-step). */
  candidates: SupplyFeeCandidate[];
  /** Turns the chosen sibling ids into the old `siblingStudents` shape. */
  resolveSiblings: (ids: string[]) => SupplyFeeStudent[];
  parentId: string;
  parentEmail: string;
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  homeschoolPricingByStudentId: Record<string, boolean>;
  readOnly?: boolean;
  onClose: () => void;
};

const gradeLabel = (grade: string | null) => {
  if (!grade) return null;
  const g = grade.trim();
  const lower = g.toLowerCase();
  if (lower === "k" || lower === "kindergarten") return "Kindergarten";
  if (lower === "pre-k" || lower === "prek" || lower === "pre k") return "Pre-K";
  return g.match(/^\d+$/) ? `${g}th grade` : g;
};

function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[18px] bg-white px-3 py-2.5 ring-1 ring-[var(--sf-ink)]/10">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[var(--sf-sage)]" />
      <span className="text-sm font-bold">{children}</span>
    </label>
  );
}

export default function SupplyFeeFlow(p: Props) {
  const hasCandidates = p.candidates.length > 0;
  const [step, setStep] = useState<"siblings" | "fee" | "dropin" | "payment">(hasCandidates ? "siblings" : "fee");
  const [pickedIds, setPickedIds] = useState<Set<string>>(() => new Set(p.candidates.map((c) => c.studentId)));
  const [siblingStudents, setSiblingStudents] = useState<SupplyFeeStudent[] | undefined>(undefined);
  const [s, setS] = useState<SupplyFeeState>({
    selectedBundleIds: new Set(),
    selectedHomeschoolBundleIds: new Set(),
    homeschoolPlanConfigured: false,
    addBundle: false,
    selectedTier: null,
    selectedMonthIndices: new Set(),
    selectedWeekdays: new Set(),
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [coverFees, setCoverFees] = useState(false);
  const { busy, pay } = usePayCheckout(p.readOnly);

  const ctx = {
    studentId: p.studentId,
    childGrade: p.childGrade,
    programType: p.programType,
    paidSchoolYearMonths: p.paidSchoolYearMonths,
    applicationId: p.applicationId,
    siblingStudents,
    paidHomeschoolByStudent: p.paidHomeschoolByStudent,
    homeschoolPricingByStudentId: p.homeschoolPricingByStudentId,
  };
  const q = supplyFeeQuote(ctx, s, coverFees, paymentMethod);
  const allStudents = q.allStudents?.map((st, i) => (i === 0 ? { ...st, studentName: p.studentName } : st)) ?? null;

  const primaryShowUpsell =
    p.programType === "school_year"
      ? !p.paidSchoolYearMonths.includes(BUNDLE_MONTH_INDEX)
      : // Fix: the single-child homeschool bundle is hidden once August is already paid.
        p.programType === "homeschool" && !q.hasPaidHomeschoolMonth(p.studentId, BUNDLE_MONTH_INDEX);

  const toggleIn = (key: "selectedBundleIds" | "selectedHomeschoolBundleIds", id: string) =>
    setS((prev) => {
      const next = new Set(prev[key]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, [key]: next };
    });

  const resetDropin = (extra: Partial<SupplyFeeState>) =>
    setS((prev) => ({ ...prev, selectedTier: null, selectedMonthIndices: new Set(), ...extra }));

  const onPay = () =>
    pay(() => buildSupplyFeeCheckout({ parentId: p.parentId, parentEmail: p.parentEmail, coverFees, paymentMethod }, ctx, s));

  const singleHomeschoolIncomplete = !q.hasSiblings && s.addBundle && p.programType === "homeschool" && q.dropinUnitCount < 1;
  const multiHomeschoolIncomplete =
    q.hasSiblings &&
    !!allStudents?.some((st) => st.programType === "homeschool" && s.selectedHomeschoolBundleIds.has(st.studentId)) &&
    (!s.homeschoolPlanConfigured || !s.selectedTier || q.dropinUnitCount < 1 || s.selectedWeekdays.size !== q.requiredDays);

  const steps = hasCandidates ? ["Siblings", "Supply fee", "Pay"] : ["Supply fee", "Pay"];
  const stepNo = step === "siblings" ? 1 : step === "payment" ? steps.length : hasCandidates ? 2 : 1;
  const sib = supplyFeeSiblingTotal(pickedIds.size);
  const childNames = allStudents ? allStudents.map((st) => firstName(st.studentName)).join(", ") : p.studentName;

  // ── Footer per step ──
  let footer: ReactNode;
  if (step === "siblings") {
    footer = (
      <CheckoutFooter
        primary={
          <ContinueButton
            onClick={() => {
              const ids = p.candidates.filter((c) => pickedIds.has(c.studentId)).map((c) => c.studentId);
              setSiblingStudents(ids.length > 0 ? p.resolveSiblings(ids) : undefined);
              setStep("fee");
            }}
          >
            Continue
          </ContinueButton>
        }
      />
    );
  } else if (step === "dropin") {
    footer = (
      <CheckoutFooter
        backLabel="Cancel"
        onBack={() => {
          if (q.hasSiblings) resetDropin({ homeschoolPlanConfigured: false, selectedHomeschoolBundleIds: new Set() });
          else resetDropin({ addBundle: false });
          setStep("fee");
        }}
        primary={
          <ContinueButton
            disabled={!q.canContinueDropin}
            onClick={() => {
              setS((prev) => ({ ...prev, homeschoolPlanConfigured: true }));
              setStep("fee");
            }}
          >
            Continue
          </ContinueButton>
        }
      />
    );
  } else if (step === "fee") {
    footer = (
      <CheckoutFooter
        onBack={hasCandidates ? () => setStep("siblings") : undefined}
        primary={
          <ContinueButton disabled={singleHomeschoolIncomplete || multiHomeschoolIncomplete} onClick={() => setStep("payment")}>
            Continue · {formatCents(q.BASE_CENTS)}
          </ContinueButton>
        }
        status={singleHomeschoolIncomplete || multiHomeschoolIncomplete ? "Finish the Drop-In plan first" : null}
      />
    );
  } else {
    footer = (
      <CheckoutFooter
        onBack={busy ? undefined : () => setStep("fee")}
        primary={
          <PayButton
            busy={busy}
            disabled={!coverFees || singleHomeschoolIncomplete || multiHomeschoolIncomplete}
            totalCents={q.totalWithFees}
            onClick={onPay}
          />
        }
      />
    );
  }

  return (
    <CheckoutSheet
      open
      onClose={p.onClose}
      busy={busy}
      title={step === "dropin" ? "Set up Drop-In · School Year 26–27" : step === "siblings" ? "Add siblings to this payment?" : "Annual Supply Fee"}
      icon={step === "dropin" ? "🏡" : "✏️"}
      note={step === "siblings" ? "Pay for all children in one transaction and save on processing fees." : (childNames ?? undefined)}
      steps={steps}
      step={stepNo}
      footer={footer}
    >
      {step === "siblings" ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[var(--sf-mint)]/60 px-4 py-3">
            <span className="text-sm font-extrabold">
              ✓ {firstName(p.studentName)}
              {p.childGrade ? <span className="font-bold text-[var(--sf-soft)]"> · {gradeLabel(p.childGrade)}</span> : null}
            </span>
            <span className="sf-display text-lg">$300.00</span>
          </div>
          {p.candidates.map((c) => (
            <label key={c.studentId} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3 ring-1 ring-[var(--sf-ink)]/10">
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={pickedIds.has(c.studentId)}
                  onChange={() =>
                    setPickedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(c.studentId)) next.delete(c.studentId);
                      else next.add(c.studentId);
                      return next;
                    })
                  }
                  className="h-5 w-5 cursor-pointer accent-[var(--sf-sage)]"
                />
                <span className="text-sm font-extrabold">
                  {firstName(c.studentName)}
                  {c.childGrade ? <span className="font-bold text-[var(--sf-soft)]"> · {gradeLabel(c.childGrade)}</span> : null}
                </span>
              </span>
              <span className="sf-display text-lg">$300.00</span>
            </label>
          ))}
          <TotalRow label={`Total · ${sib.totalChildren} ${sib.totalChildren === 1 ? "child" : "children"}`} value={formatCents(sib.totalCents)} />
        </div>
      ) : step === "dropin" ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-[var(--sf-soft)]">
            <span>{gradeTierLabel(q.homeschoolGradeTier)}</span>
            <span>School Year 26–27 · Aug 2026–May 2027</span>
          </div>
          <div>
            <StepLabel n={1} done={s.selectedTier !== null}>
              Choose your schedule
            </StepLabel>
            <TierPicker
              value={s.selectedTier}
              onChange={(t: HomeschoolTier) => setS((prev) => ({ ...prev, selectedTier: t, selectedMonthIndices: new Set(), selectedWeekdays: new Set() }))}
              priceFor={(t) => q.primaryHomeschoolPricing[t][q.homeschoolGradeTier]}
            />
          </div>
          {s.selectedTier !== null ? (
            <div>
              <StepLabel n={2} done={s.selectedWeekdays.size === q.requiredDays}>
                Choose your {requiredDaysLabel(q.requiredDays)} (Mon–Thu)
              </StepLabel>
              <WeekdayPicker
                label="Days of the week"
                selected={s.selectedWeekdays}
                required={q.requiredDays}
                onToggle={(k) =>
                  setS((prev) => {
                    const next = new Set(prev.selectedWeekdays);
                    if (next.has(k)) next.delete(k);
                    else next.add(k);
                    return { ...prev, selectedWeekdays: next };
                  })
                }
              />
              {s.selectedWeekdays.size > 0 && s.selectedWeekdays.size < q.requiredDays ? (
                <Hint>
                  Select {q.requiredDays - s.selectedWeekdays.size} more day{q.requiredDays - s.selectedWeekdays.size !== 1 ? "s" : ""}
                </Hint>
              ) : null}
            </div>
          ) : null}
          {s.selectedTier !== null ? (
            <div>
              <StepLabel n={3} done={s.selectedMonthIndices.size > 0}>
                Select months to pay
              </StepLabel>
              <MonthPicker
                label="Months to pay"
                selected={s.selectedMonthIndices}
                isPaid={() => false}
                onToggle={(m) =>
                  setS((prev) => {
                    const next = new Set(prev.selectedMonthIndices);
                    if (next.has(m)) next.delete(m);
                    else next.add(m);
                    return { ...prev, selectedMonthIndices: next };
                  })
                }
              />
              {s.selectedMonthIndices.size > 0 ? (
                <div className="mt-3">
                  <TotalRow
                    label={`${s.selectedMonthIndices.size} month${s.selectedMonthIndices.size !== 1 ? "s" : ""}`}
                    value={formatCents(q.homeschoolBundleCents)}
                  />
                </div>
              ) : null}
              <DifferentDaysNote />
            </div>
          ) : null}
        </div>
      ) : step === "fee" ? (
        <div className="flex flex-col gap-5">
          <div className="rounded-[22px] bg-white px-4 py-3 ring-1 ring-[var(--sf-ink)]/10">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-extrabold">Annual Supply Fee</span>
              <span className="sf-display text-lg">
                {q.hasSiblings && allStudents ? `${formatCents(SUPPLY_FEE_CENTS * allStudents.length)} · ${allStudents.length} children` : "$300.00"}
              </span>
            </div>
            <p className="text-xs font-bold text-[var(--sf-soft)]">One-time fee · School Year 26–27</p>
          </div>

          {q.hasSiblings && allStudents ? (
            (() => {
              const bundlableSY = allStudents.filter((st) => st.programType === "school_year" && !st.paidSchoolYearMonths.includes(BUNDLE_MONTH_INDEX));
              const bundlableHS = allStudents.filter((st) => st.programType === "homeschool" && !q.hasPaidHomeschoolMonth(st.studentId, BUNDLE_MONTH_INDEX));
              return (
                <>
                  {bundlableSY.length > 0 ? (
                    <section className="flex flex-col gap-2 rounded-[24px] bg-[var(--sf-mint)]/45 p-4" aria-label="Bundle & save on processing fees">
                      <h3 className="text-[15px] font-extrabold">Bundle &amp; save on processing fees</h3>
                      <p className="text-xs font-semibold text-[var(--sf-soft)]">Add August 2026 tuition for any child — one checkout, one processing fee.</p>
                      {bundlableSY.map((st) => (
                        <CheckRow key={st.studentId} checked={s.selectedBundleIds.has(st.studentId)} onChange={() => toggleIn("selectedBundleIds", st.studentId)}>
                          Add August 2026 tuition for {firstName(st.studentName)}
                          {st.childGrade ? ` · ${st.childGrade}` : ""} · {formatCents(q.getStudentBundleCents(st.childGrade, st.programType))}
                        </CheckRow>
                      ))}
                    </section>
                  ) : null}
                  {bundlableHS.length > 0 ? (
                    <section className="flex flex-col gap-2 rounded-[24px] bg-[var(--sf-mint)]/45 p-4" aria-label="Bundle Homeschool Drop-In">
                      <h3 className="text-[15px] font-extrabold">Bundle Homeschool Drop-In</h3>
                      <p className="text-xs font-semibold text-[var(--sf-soft)]">
                        Add the first month of Drop-In for any child — one checkout, one processing fee. Same schedule for all bundled children.
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep("dropin")}
                        className="inline-flex min-h-11 w-fit cursor-pointer items-center text-sm font-extrabold text-[var(--sf-sage-deep)] underline underline-offset-4"
                      >
                        {s.homeschoolPlanConfigured ? "Edit Drop-In plan" : "Set up Drop-In plan →"}
                      </button>
                      {s.homeschoolPlanConfigured
                        ? bundlableHS.map((st) => (
                            <CheckRow
                              key={st.studentId}
                              checked={s.selectedHomeschoolBundleIds.has(st.studentId)}
                              onChange={() => toggleIn("selectedHomeschoolBundleIds", st.studentId)}
                            >
                              Add first month Drop-In for {firstName(st.studentName)}
                              {st.childGrade ? ` · ${st.childGrade}` : ""} · {formatCents(q.getHomeschoolBundleCents(st.childGrade, st.studentId))}
                            </CheckRow>
                          ))
                        : null}
                    </section>
                  ) : null}
                </>
              );
            })()
          ) : primaryShowUpsell ? (
            <section className="flex flex-col gap-2 rounded-[24px] bg-[var(--sf-mint)]/45 p-4" aria-label="Bundle & save on processing fees">
              <h3 className="text-[15px] font-extrabold">Bundle &amp; save on processing fees</h3>
              <p className="text-xs font-semibold text-[var(--sf-soft)]">
                {p.programType === "school_year"
                  ? `Add August tuition (${formatCents(q.primaryBundleTuitionCents)}) to this payment — one Stripe checkout, one processing fee.`
                  : "Add your first month of Homeschool Drop-In to this payment — one Stripe checkout, one processing fee."}
              </p>
              <CheckRow
                checked={s.addBundle}
                onChange={(checked) => {
                  setS((prev) => ({ ...prev, addBundle: checked }));
                  if (checked && p.programType === "homeschool") setStep("dropin");
                  if (!checked) {
                    resetDropin({ addBundle: false });
                    setStep("fee");
                  }
                }}
              >
                {p.programType === "school_year"
                  ? `Add August 2026 tuition · ${formatCents(q.primaryBundleTuitionCents)}`
                  : s.addBundle && s.selectedTier
                    ? `Drop-In · August 2026 · ${formatCents(q.homeschoolBundleCents)}`
                    : "Set up first month of Drop-In"}
              </CheckRow>
              {s.addBundle && s.selectedTier && p.programType === "homeschool" ? (
                <button
                  type="button"
                  onClick={() => setStep("dropin")}
                  className="inline-flex min-h-11 w-fit cursor-pointer items-center text-sm font-extrabold text-[var(--sf-sage-deep)] underline underline-offset-4"
                >
                  Edit selection
                </button>
              ) : null}
            </section>
          ) : null}

          <TotalRow label="Subtotal" value={formatCents(q.BASE_CENTS)} />
        </div>
      ) : (
        <PaymentMethodStep
          method={paymentMethod}
          onMethod={setPaymentMethod}
          feeLine={q.feeLine}
          coverFees={coverFees}
          onCoverFees={setCoverFees}
          totalCents={q.totalWithFees}
        />
      )}
    </CheckoutSheet>
  );
}
