"use client";

import { useState } from "react";
import { SCHOOL_YEAR_MONTHS, formatCents } from "@/shared/billing/school-year";
import { StepLabel } from "@/app/parent/_garden/ui";
import type { PaidSchoolYearByStudent, StudentInfo } from "../page";
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
import {
  buildSyTuitionCheckout,
  siblingUnits,
  syTuitionBaseCents,
  syTuitionEligibleSiblings,
  syTuitionPaymentQuote,
  syTuitionSiblingPayloads,
  type PaymentMethod,
  type SchoolYearSibling,
} from "./payloads";
import { MonthPicker } from "./pickers";
import { TotalRow } from "./parts";

type Props = {
  studentId: string;
  studentName: string | null;
  childGrade: string | null;
  parentId: string;
  parentEmail: string;
  paidMonthIndices: Set<number>;
  siblingStudents: SchoolYearSibling[];
  siblingPaidSchoolYear: PaidSchoolYearByStudent;
  siblingStudentMap: Record<string, StudentInfo>;
  readOnly?: boolean;
  onClose: () => void;
};

const short = (m: number) => SCHOOL_YEAR_MONTHS.find((sm) => sm.index === m)?.short ?? m;

export default function SchoolYearTuitionFlow(p: Props) {
  const BASE_CENTS = syTuitionBaseCents(p.childGrade);
  const [step, setStep] = useState<"plan" | "sibling" | "payment">("plan");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [coverFees, setCoverFees] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { busy, pay } = usePayCheckout(p.readOnly);

  const unitCount = selected.size;
  const totalBaseCents = BASE_CENTS * unitCount;
  const eligible = syTuitionEligibleSiblings(p.siblingStudents, p.siblingPaidSchoolYear, selected);
  const paidOf = (id: string) => new Set(p.siblingPaidSchoolYear[id] ?? []);
  const sib = useSiblingSelection({
    eligibleIds: eligible.map((s) => s.student_id),
    primary: selected,
    isPaid: (id, m) => paidOf(id).has(m),
  });
  const siblingPayloads = syTuitionSiblingPayloads(eligible, sib.selection, selected, p.siblingPaidSchoolYear, p.siblingStudentMap);
  const siblingTotal = siblingPayloads.reduce((sum, s) => sum + s.intendedAmountCents, 0);
  const combinedIntendedCents = totalBaseCents + siblingTotal;
  const quote = syTuitionPaymentQuote(combinedIntendedCents, unitCount, coverFees, paymentMethod);

  const steps = eligible.length > 0 ? ["Months", "Siblings", "Pay"] : ["Months", "Pay"];
  const stepNo = step === "plan" ? 1 : step === "sibling" ? 2 : steps.length;

  const toggle = (m: number) => {
    if (p.paidMonthIndices.has(m)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const onPay = () =>
    pay(() =>
      buildSyTuitionCheckout({
        parentId: p.parentId,
        parentEmail: p.parentEmail,
        studentId: p.studentId,
        totalBaseCents,
        selectedMonthIndices: selected,
        coverFees,
        paymentMethod,
        siblings: siblingPayloads,
      }),
    );

  const footer =
    step === "plan" ? (
      <CheckoutFooter
        primary={
          <ContinueButton disabled={unitCount < 1} onClick={() => setStep(eligible.length > 0 ? "sibling" : "payment")}>
            {unitCount > 0 ? `Continue · ${formatCents(totalBaseCents)}` : "Continue"}
          </ContinueButton>
        }
        status={unitCount === 0 ? "Pick at least one month" : null}
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
      title="School Year Tuition"
      icon="🎒"
      note={p.studentName ?? undefined}
      steps={steps}
      step={stepNo}
      footer={footer}
    >
      {step === "plan" ? (
        <div>
          <StepLabel n={1}>Select months to pay · {formatCents(BASE_CENTS)}/mo</StepLabel>
          <MonthPicker label="Months to pay" selected={selected} isPaid={(m) => p.paidMonthIndices.has(m)} onToggle={toggle} />
          {unitCount > 0 ? (
            <div className="mt-4">
              <TotalRow label={`${unitCount} month${unitCount !== 1 ? "s" : ""} × ${formatCents(BASE_CENTS)}/mo`} value={formatCents(totalBaseCents)} />
            </div>
          ) : null}
        </div>
      ) : step === "sibling" ? (
        <SiblingStep
          rows={eligible.map((s) => {
            const paidMonths = paidOf(s.student_id);
            const override = sib.overrides[s.student_id];
            const months = siblingUnits(override, selected, (m) => paidMonths.has(m));
            const amount = (syTuitionBaseCents(s.child_grade)) * months.length;
            const name = p.siblingStudentMap[s.student_id]?.name ?? "Sibling";
            return {
              id: s.student_id,
              name,
              grade: null,
              amountCents: amount,
              summary: months.length === 0 ? "No months selected" : `${months.length} mo. · ${months.map(short).join(", ")}`,
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
          checkNote="noFee"
          totalCents={combinedIntendedCents > 0 ? quote.totalWithFees : null}
          totalLabel={
            unitCount === 0
              ? "No months selected"
              : siblingPayloads.length > 0
                ? `${1 + siblingPayloads.length} children`
                : `${unitCount} month${unitCount !== 1 ? "s" : ""} × ${formatCents(BASE_CENTS)}/mo`
          }
        />
      )}
    </CheckoutSheet>
  );
}
