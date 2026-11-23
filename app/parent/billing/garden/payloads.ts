/**
 * Request bodies, price math and fee math for every Tuition & Billing write.
 *
 * Everything in here is copied VERBATIM from the pre-redesign BillingPage.tsx
 * (one function per old modal). The Garden UI only calls these functions, so what
 * a parent sees and what is sent to the API stay exactly what they were.
 *
 * Known mismatches between the shown and charged amounts (and the "12 weeks on the
 * weekly tab" charge) are intentionally preserved here; they belong to the server-side
 * pricing follow-up. The three fee formulas are also kept separate on purpose:
 *  - feesLinear:     card = round(base·2.9%) + 30,  ach = min(round(base·0.8%), 500)
 *  - feesGrossUp:    card = round((base+30)/(1−2.9%)) − base,  ach = same as above
 *  - feesDollars:    the dollar-rounded estimate shown by the summer + add-on modals
 */
import {
  AFTERCARE_DAILY_CENTS,
  AFTERCARE_MONTHLY_CENTS,
  FUN_FRIDAY_MONTHLY_CENTS,
  BUNDLE_MONTH_INDEX,
  FUN_FRIDAY_DROPIN_CENTS,
  SCHOOL_YEAR_AFTERCARE_MONTHS,
  SCHOOL_YEAR_FUN_FRIDAY_MONTHS,
  SUPPLY_FEE_CENTS,
  formatCents,
  getGradeTier,
  getHomeschoolSchoolYearPricing,
  schoolYearAftercareMonthCents,
  schoolYearFunFridayMonthCents,
  type HomeschoolTier,
} from "@/shared/billing/school-year";
import type {
  HomeschoolDropInApp,
  PaidHomeschoolByStudent,
  PaidSchoolYearByStudent,
  StudentInfo,
  SummerEnrollment,
} from "../page";
import {
  AFTERCARE_MONTHS,
  FUN_FRIDAY_MONTHS,
  HOMESCHOOL_SUMMER_PRICING,
  SUMMER_FULL_CENTS,
  SUMMER_FULL_ORIGINAL_CENTS,
  SUMMER_WEEKLY_CENTS,
  TOTAL_WEEKS,
  aftercareMonthCents,
  deriveTier,
  funFridayMonthCents,
} from "./data";

export type PaymentMethod = "card" | "ach";

export type CheckoutRequest = { endpoint: string; body: Record<string, unknown> };

// ─── Fee formulas (verbatim, deliberately not unified) ──────────────────────

/** Used by both homeschool modals for the displayed estimate (and the summer homeschool total). */
export function feesLinear(baseCents: number) {
  const cardFeeRate = 0.029;
  const cardFeeFixed = 30;
  const achFeeRate = 0.008;
  const achFeeCap = 500;
  const cardFee = Math.round(baseCents * cardFeeRate) + cardFeeFixed;
  const achFee = Math.min(Math.round(baseCents * achFeeRate), achFeeCap);
  return { cardFee, achFee };
}

/** Gross-up card fee used for most totals. */
export function feesGrossUp(baseCents: number) {
  const cardFee = Math.round((baseCents + 30) / (1 - 0.029)) - baseCents;
  const achFee = Math.min(Math.round(baseCents * 0.008), 500);
  return { cardFee, achFee };
}

/** Dollar estimate shown by the summer tuition and add-on modals. */
export function feesDollars(baseCents: number) {
  const cardFeeDisplay = Math.round(((baseCents / 100) * 0.029 + 0.3) * 100) / 100;
  const achFeeDisplay = Math.min(Math.round((baseCents / 100) * 0.008 * 100) / 100, 5.0);
  return { cardFeeDisplay, achFeeDisplay };
}

export function feeLineCents(method: PaymentMethod, cardFee: number, achFee: number): string {
  return method === "card"
    ? `Processing fee (est.): ~${formatCents(cardFee)}`
    : `Processing fee (est.): ~${formatCents(achFee)} (0.8%, max $5.00)`;
}

export function feeLineDollars(method: PaymentMethod, cardFeeDisplay: number, achFeeDisplay: number): string {
  return method === "card"
    ? `Processing fee (est.): ~$${cardFeeDisplay.toFixed(2)}`
    : `Processing fee (est.): ~$${achFeeDisplay.toFixed(2)} (0.8%, max $5.00)`;
}

/** What the payment step shows: fee line + total. */
export type PaymentQuote = { feeLine: string; totalWithFees: number };

// ─── Siblings (shared selection state shape) ────────────────────────────────

export type SiblingSelection = {
  included: Record<string, boolean>;
  overrides: Record<string, Set<number>>;
};

/** `override ? override − paid : primary − paid`, sorted. Verbatim from all three sibling steps. */
export function siblingUnits(
  override: Set<number> | undefined,
  primary: Set<number>,
  isPaid: (unit: number) => boolean,
): number[] {
  return override
    ? Array.from(override)
        .filter((m) => !isPaid(m))
        .sort((a, b) => a - b)
    : Array.from(primary)
        .filter((m) => !isPaid(m))
        .sort((a, b) => a - b);
}

// ─── Summer tuition (SummerPaymentModal) ────────────────────────────────────

export function summerPricing(childGrade: string | null, tab: "weekly" | "full", selectedWeeks: Set<number>) {
  const tier = getGradeTier(childGrade);
  const weeklyRate = SUMMER_WEEKLY_CENTS[tier];
  const fullRate = SUMMER_FULL_CENTS[tier];
  const fullOriginal = SUMMER_FULL_ORIGINAL_CENTS[tier];
  const savings = fullOriginal - fullRate;
  const weeklyTotal = selectedWeeks.size * weeklyRate;
  const allWeeksSelected = selectedWeeks.size === TOTAL_WEEKS;
  const effectiveTotal = allWeeksSelected ? fullRate : weeklyTotal;
  const canContinue = tab === "full" || selectedWeeks.size > 0;
  const intendedAmountCents = tab === "full" ? fullRate : effectiveTotal;
  return { tier, weeklyRate, fullRate, fullOriginal, savings, weeklyTotal, allWeeksSelected, effectiveTotal, canContinue, intendedAmountCents };
}

export function summerEligibleSiblings(
  siblingEnrollments: SummerEnrollment[],
  siblingPaidWeeks: Record<string, number[]>,
  tab: "weekly" | "full",
  selectedWeeks: Set<number>,
): SummerEnrollment[] {
  return siblingEnrollments.filter((sib) => {
    const paid = siblingPaidWeeks[sib.student_id] ?? [];
    if (paid.length >= 12) return false;
    if (tab === "full") return paid.length === 0; // full plan: only siblings with nothing paid
    return Array.from(selectedWeeks).some((w) => !paid.includes(w));
  });
}

export function summerSiblingRow(
  sib: SummerEnrollment,
  sel: SiblingSelection,
  selectedWeeks: Set<number>,
  tab: "weekly" | "full",
  siblingPaidWeeks: Record<string, number[]>,
) {
  const sibTier = getGradeTier(sib.child_grade);
  const paid = siblingPaidWeeks[sib.student_id] ?? [];
  const override = sel.overrides[sib.student_id];
  const sibWeeks = siblingUnits(override, selectedWeeks, (w) => paid.includes(w));
  const sibPlanType: "weekly" | "full" = tab === "full" && paid.length === 0 ? "full" : "weekly";
  const sibAmount = sibPlanType === "full" ? SUMMER_FULL_CENTS[sibTier] : sibWeeks.length * SUMMER_WEEKLY_CENTS[sibTier];
  return { sibTier, paid, override, sibWeeks, sibPlanType, sibAmount };
}

export function summerSiblingPayloads(
  eligible: SummerEnrollment[],
  sel: SiblingSelection,
  selectedWeeks: Set<number>,
  tab: "weekly" | "full",
  siblingPaidWeeks: Record<string, number[]>,
  siblingStudentMap: Record<string, StudentInfo>,
) {
  return eligible
    .filter((sib) => sel.included[sib.student_id])
    .map((sib) => {
      const r = summerSiblingRow(sib, sel, selectedWeeks, tab, siblingPaidWeeks);
      return {
        studentId: sib.student_id,
        applicationId: sib.id,
        planType: r.sibPlanType,
        selectedWeeks: r.sibWeeks,
        gradeTier: r.sibTier,
        intendedAmountCents: r.sibAmount,
        studentName: siblingStudentMap[sib.student_id]?.name,
      };
    });
}

/** Summer: gross-up total, dollar estimate in the fee line. */
export function summerPaymentQuote(combinedIntendedCents: number, coverFees: boolean, method: PaymentMethod): PaymentQuote {
  const feeCents = coverFees
    ? method === "ach"
      ? Math.min(Math.round(combinedIntendedCents * 0.008), 500)
      : Math.round((combinedIntendedCents + 30) / (1 - 0.029)) - combinedIntendedCents
    : 0;
  const totalWithFees = combinedIntendedCents + feeCents;
  const { cardFeeDisplay, achFeeDisplay } = feesDollars(combinedIntendedCents);
  return { feeLine: feeLineDollars(method, cardFeeDisplay, achFeeDisplay), totalWithFees };
}

export function buildSummerCheckout(a: {
  parentId: string;
  parentEmail: string;
  enrollment: SummerEnrollment;
  tab: "weekly" | "full";
  selectedWeeks: Set<number>;
  intendedAmountCents: number;
  coverFees: boolean;
  paymentMethod: PaymentMethod;
  siblings: ReturnType<typeof summerSiblingPayloads>;
}): CheckoutRequest {
  return {
    endpoint: "/api/stripe/create-summer-checkout",
    body: {
      parentId: a.parentId,
      parentEmail: a.parentEmail,
      studentId: a.enrollment.student_id,
      applicationId: a.enrollment.id,
      planType: a.tab,
      selectedWeeks: Array.from(a.selectedWeeks).sort((x, y) => x - y),
      gradeTier: getGradeTier(a.enrollment.child_grade),
      intendedAmountCents: a.intendedAmountCents,
      coverFees: a.coverFees,
      paymentMethod: a.paymentMethod,
      siblings: a.siblings,
    },
  };
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export function buildSummerNote(parentId: string, enrollment: SummerEnrollment, noteText: string): CheckoutRequest {
  return {
    endpoint: "/api/billing/save-summer-note",
    body: { parentId, studentId: enrollment.student_id, applicationId: enrollment.id, note: noteText.trim() },
  };
}

export function buildHomeschoolNote(parentId: string, app: HomeschoolDropInApp, noteText: string): CheckoutRequest {
  return {
    endpoint: "/api/billing/save-homeschool-note",
    body: { parentId, studentId: app.student_id, applicationId: app.id, note: noteText.trim() },
  };
}

// ─── Summer homeschool (HomeschoolPaymentModal) ─────────────────────────────

export function summerHomeschoolPaidDaysByWeek(paidData: PaidHomeschoolByStudent[string] | undefined) {
  const paidDaysByWeek: Record<number, Set<string>> = {};
  for (const entry of paidData?.summer ?? []) {
    for (const [wk, entryDays] of Object.entries(entry.weekDays)) {
      const w = Number(wk);
      if (!paidDaysByWeek[w]) paidDaysByWeek[w] = new Set();
      entryDays.forEach((d) => paidDaysByWeek[w].add(d));
    }
  }
  return paidDaysByWeek;
}

export function summerHomeschoolBase(weekSelections: Record<number, Set<string>>, childGrade: string | null): number {
  const gradeTier = getGradeTier(childGrade);
  return Object.entries(weekSelections).reduce((sum, [, days]) => {
    if (days.size === 0) return sum;
    return sum + HOMESCHOOL_SUMMER_PRICING[deriveTier(days.size)][gradeTier];
  }, 0);
}

/** Summer homeschool: linear fee for both the estimate and the total. */
export function summerHomeschoolPaymentQuote(baseAmountCents: number, coverFees: boolean, method: PaymentMethod): PaymentQuote {
  const { cardFee, achFee } = feesLinear(baseAmountCents);
  const feeAmount = method === "card" ? cardFee : achFee;
  const totalWithFees = coverFees ? baseAmountCents + feeAmount : baseAmountCents;
  return { feeLine: feeLineCents(method, cardFee, achFee), totalWithFees };
}

export function buildSummerHomeschoolCheckout(a: {
  parentId: string;
  parentEmail: string;
  app: HomeschoolDropInApp;
  weekSelections: Record<number, Set<string>>;
  coverFees: boolean;
  paymentMethod: PaymentMethod;
}): CheckoutRequest {
  const { weekSelections } = a;
  const gradeTier = getGradeTier(a.app.child_grade);
  const baseAmountCents = summerHomeschoolBase(weekSelections, a.app.child_grade);
  // Derive a representative tier from the most common day count
  const dayCounts = Object.values(weekSelections)
    .filter((d) => d.size > 0)
    .map((d) => d.size);
  const freq: Record<number, number> = {};
  dayCounts.forEach((c) => {
    freq[c] = (freq[c] ?? 0) + 1;
  });
  const dominantCount = dayCounts.sort((x, y) => (freq[y] ?? 0) - (freq[x] ?? 0))[0] ?? 1;
  const dominantTier = deriveTier(dominantCount);

  const selectedWeeksList = Object.entries(weekSelections)
    .filter(([, d]) => d.size > 0)
    .map(([wk]) => Number(wk))
    .sort((x, y) => x - y);

  const allSelectedDays = Array.from(new Set(Object.values(weekSelections).flatMap((d) => Array.from(d))));

  const weekSelectionsJson = JSON.stringify(
    selectedWeeksList.map((wk) => ({
      week: wk,
      days: Array.from(weekSelections[wk] ?? []),
    })),
  );

  return {
    endpoint: "/api/stripe/create-homeschool-checkout",
    body: {
      parentId: a.parentId,
      parentEmail: a.parentEmail,
      studentId: a.app.student_id,
      applicationId: a.app.id,
      program: "summer_26",
      tier: dominantTier,
      gradeTier,
      selectedDays: allSelectedDays,
      selectedWeeks: selectedWeeksList,
      weekSelectionsJson,
      intendedAmountCents: baseAmountCents,
      coverFees: a.coverFees,
      paymentMethod: a.paymentMethod,
    },
  };
}

// ─── School-year homeschool (HomeschoolSchoolYearModal) ─────────────────────

export function syHomeschoolPaidMonthsOf(paid: PaidHomeschoolByStudent, studentId: string) {
  return new Set((paid[studentId]?.schoolYear ?? []).flatMap((entry) => entry.weeks));
}

export function syHomeschoolEligibleSiblings(
  siblingApps: HomeschoolDropInApp[],
  siblingPaidHomeschool: PaidHomeschoolByStudent,
  selectedMonthIndices: Set<number>,
) {
  return siblingApps.filter((sib) => {
    const paidMonths = syHomeschoolPaidMonthsOf(siblingPaidHomeschool, sib.student_id);
    return Array.from(selectedMonthIndices).some((m) => !paidMonths.has(m));
  });
}

export function syHomeschoolSiblingAmount(sib: HomeschoolDropInApp, tier: HomeschoolTier | null, months: number[]) {
  const sibGradeTier = getGradeTier(sib.child_grade);
  const sibPricing = getHomeschoolSchoolYearPricing(sib.use_updated_homeschool_pricing);
  return tier ? sibPricing[tier][sibGradeTier] * months.length : 0;
}

export function syHomeschoolSiblingPayloads(
  eligible: HomeschoolDropInApp[],
  sel: SiblingSelection,
  selectedTier: HomeschoolTier | null,
  selectedMonthIndices: Set<number>,
  selectedWeekdays: Set<string>,
  siblingPaidHomeschool: PaidHomeschoolByStudent,
  siblingStudentMap: Record<string, StudentInfo>,
) {
  return selectedTier === null
    ? []
    : eligible
        .filter((sib) => sel.included[sib.student_id])
        .map((sib) => {
          const sibGradeTier = getGradeTier(sib.child_grade);
          const paidMonths = syHomeschoolPaidMonthsOf(siblingPaidHomeschool, sib.student_id);
          const override = sel.overrides[sib.student_id];
          const sibMonths = siblingUnits(override, selectedMonthIndices, (m) => paidMonths.has(m));
          const sibDays = Array.from(selectedWeekdays);
          const tier = selectedTier;
          const sibPricing = getHomeschoolSchoolYearPricing(sib.use_updated_homeschool_pricing);
          const sibAmount = sibPricing[tier][sibGradeTier] * sibMonths.length;
          const weekSelectionsJson = JSON.stringify(sibMonths.map((w) => ({ week: w, days: sibDays })));
          return {
            studentId: sib.student_id,
            applicationId: sib.id,
            tier,
            gradeTier: sibGradeTier,
            selectedDays: sibDays,
            selectedWeeks: sibMonths,
            weekSelectionsJson,
            intendedAmountCents: sibAmount,
            studentName: siblingStudentMap[sib.student_id]?.name,
          };
        });
}

export function syHomeschoolBase(app: HomeschoolDropInApp, selectedTier: HomeschoolTier | null, selectedMonthIndices: Set<number>) {
  const gradeTier = getGradeTier(app.child_grade);
  const pricing = getHomeschoolSchoolYearPricing(app.use_updated_homeschool_pricing);
  const unitCount = selectedMonthIndices.size;
  const pricePerUnit = selectedTier ? pricing[selectedTier][gradeTier] : 0;
  return pricePerUnit * unitCount;
}

/** SY homeschool: linear estimate shown, gross-up card total. */
export function syHomeschoolPaymentQuote(combinedIntendedCents: number, coverFees: boolean, method: PaymentMethod): PaymentQuote {
  const { cardFee, achFee } = feesLinear(combinedIntendedCents);
  const achFeeRate = 0.008;
  const achFeeCap = 500;
  const feeCents = coverFees
    ? method === "ach"
      ? Math.min(Math.round(combinedIntendedCents * achFeeRate), achFeeCap)
      : Math.round((combinedIntendedCents + 30) / (1 - 0.029)) - combinedIntendedCents
    : 0;
  return { feeLine: feeLineCents(method, cardFee, achFee), totalWithFees: combinedIntendedCents + feeCents };
}

export function syHomeschoolRequiredDays(selectedTier: HomeschoolTier | null) {
  return selectedTier === "dropin" ? 1 : selectedTier === "2day" ? 2 : selectedTier === "3day" ? 3 : 0;
}

export function buildSyHomeschoolCheckout(a: {
  parentId: string;
  parentEmail: string;
  app: HomeschoolDropInApp;
  selectedTier: HomeschoolTier;
  selectedWeekdays: Set<string>;
  selectedMonthIndices: Set<number>;
  coverFees: boolean;
  paymentMethod: PaymentMethod;
  siblings: ReturnType<typeof syHomeschoolSiblingPayloads>;
}): CheckoutRequest {
  const selectedDays = Array.from(a.selectedWeekdays);
  const selectedWeeks = Array.from(a.selectedMonthIndices).sort((x, y) => x - y);
  const weekSelectionsJson = JSON.stringify(selectedWeeks.map((w) => ({ week: w, days: selectedDays })));
  return {
    endpoint: "/api/stripe/create-homeschool-checkout",
    body: {
      parentId: a.parentId,
      parentEmail: a.parentEmail,
      studentId: a.app.student_id,
      applicationId: a.app.id,
      program: "school_year_26_27",
      tier: a.selectedTier,
      gradeTier: getGradeTier(a.app.child_grade),
      selectedDays,
      selectedWeeks,
      weekSelectionsJson,
      intendedAmountCents: syHomeschoolBase(a.app, a.selectedTier, a.selectedMonthIndices),
      coverFees: a.coverFees,
      paymentMethod: a.paymentMethod,
      siblings: a.siblings,
    },
  };
}

// ─── School-year tuition (SchoolYearTuitionModal) ───────────────────────────

export type SchoolYearSibling = { student_id: string; child_grade: string | null };

export function syTuitionBaseCents(childGrade: string | null) {
  const gradeTier = getGradeTier(childGrade);
  return gradeTier === "primary" ? 119500 : 109500;
}

export function syTuitionEligibleSiblings(
  siblingStudents: SchoolYearSibling[],
  siblingPaidSchoolYear: PaidSchoolYearByStudent,
  selectedMonthIndices: Set<number>,
) {
  return siblingStudents.filter((sib) => {
    const paidMonths = new Set(siblingPaidSchoolYear[sib.student_id] ?? []);
    return Array.from(selectedMonthIndices).some((m) => !paidMonths.has(m));
  });
}

export function syTuitionSiblingPayloads(
  eligible: SchoolYearSibling[],
  sel: SiblingSelection,
  selectedMonthIndices: Set<number>,
  siblingPaidSchoolYear: PaidSchoolYearByStudent,
  siblingStudentMap: Record<string, StudentInfo>,
) {
  return eligible
    .filter((sib) => sel.included[sib.student_id])
    .map((sib) => {
      const sibGradeTier = getGradeTier(sib.child_grade);
      const sibBaseCents = sibGradeTier === "primary" ? 119500 : 109500;
      const paidMonths = new Set(siblingPaidSchoolYear[sib.student_id] ?? []);
      const override = sel.overrides[sib.student_id];
      const sibMonths = siblingUnits(override, selectedMonthIndices, (m) => paidMonths.has(m));
      return {
        studentId: sib.student_id,
        gradeTier: sibGradeTier,
        selectedMonths: sibMonths,
        intendedAmountCents: sibBaseCents * sibMonths.length,
        studentName: siblingStudentMap[sib.student_id]?.name,
      };
    });
}

/** SY tuition: gross-up for estimate and total, zero when no months are picked. */
export function syTuitionPaymentQuote(
  combinedIntendedCents: number,
  unitCount: number,
  coverFees: boolean,
  method: PaymentMethod,
): PaymentQuote {
  const cardFee = unitCount > 0 ? Math.round((combinedIntendedCents + 30) / (1 - 0.029)) - combinedIntendedCents : 0;
  const achFee = unitCount > 0 ? Math.min(Math.round(combinedIntendedCents * 0.008), 500) : 0;
  const feeAmount = method === "card" ? cardFee : achFee;
  const totalWithFees = coverFees ? combinedIntendedCents + feeAmount : combinedIntendedCents;
  return { feeLine: feeLineCents(method, cardFee, achFee), totalWithFees };
}

export function buildSyTuitionCheckout(a: {
  parentId: string;
  parentEmail: string;
  studentId: string;
  totalBaseCents: number;
  selectedMonthIndices: Set<number>;
  coverFees: boolean;
  paymentMethod: PaymentMethod;
  siblings: ReturnType<typeof syTuitionSiblingPayloads>;
}): CheckoutRequest {
  return {
    endpoint: "/api/stripe/create-school-year-tuition-checkout",
    body: {
      parentId: a.parentId,
      parentEmail: a.parentEmail,
      studentId: a.studentId,
      intendedAmountCents: a.totalBaseCents,
      coverFees: a.coverFees,
      paymentMethod: a.paymentMethod,
      selectedMonths: Array.from(a.selectedMonthIndices).sort((x, y) => x - y),
      siblings: a.siblings,
    },
  };
}

// ─── Supply fee (SupplyFeeModal) ────────────────────────────────────────────

export type ProgramType = "school_year" | "homeschool" | null;

export type SupplyFeeStudent = {
  studentId: string;
  studentName: string | null;
  childGrade: string | null;
  programType: ProgramType;
  paidSchoolYearMonths: number[];
  applicationId?: string;
};

export type SupplyFeeState = {
  selectedBundleIds: Set<string>;
  selectedHomeschoolBundleIds: Set<string>;
  homeschoolPlanConfigured: boolean;
  addBundle: boolean;
  selectedTier: HomeschoolTier | null;
  selectedMonthIndices: Set<number>;
  selectedWeekdays: Set<string>;
};

export type SupplyFeeContext = {
  studentId: string;
  childGrade: string | null;
  programType: ProgramType;
  paidSchoolYearMonths: number[];
  applicationId?: string;
  siblingStudents?: SupplyFeeStudent[];
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  homeschoolPricingByStudentId: Record<string, boolean>;
};

/** Every derived number the supply-fee sheet shows, verbatim. */
export function supplyFeeQuote(c: SupplyFeeContext, s: SupplyFeeState, coverFees: boolean, method: PaymentMethod) {
  const hasSiblings = !!c.siblingStudents && c.siblingStudents.length > 0;
  const allStudents: SupplyFeeStudent[] | null = hasSiblings
    ? [
        {
          studentId: c.studentId,
          studentName: null,
          childGrade: c.childGrade,
          programType: c.programType,
          paidSchoolYearMonths: c.paidSchoolYearMonths,
          applicationId: c.applicationId,
        },
        ...c.siblingStudents!,
      ]
    : null;

  const primaryGradeTier = getGradeTier(c.childGrade);
  const primaryBundleTuitionCents = primaryGradeTier === "primary" ? 119500 : 109500;
  const homeschoolGradeTier = getGradeTier(c.childGrade);
  const primaryHomeschoolPricing = getHomeschoolSchoolYearPricing(c.homeschoolPricingByStudentId[c.studentId] ?? false);
  const dropinPricePerDay = s.selectedTier ? primaryHomeschoolPricing[s.selectedTier][homeschoolGradeTier] : 0;
  const dropinUnitCount = s.selectedMonthIndices.size;
  const homeschoolBundleCents = s.addBundle && c.programType === "homeschool" ? dropinPricePerDay * dropinUnitCount : 0;
  const requiredDays = s.selectedTier === "dropin" ? 1 : s.selectedTier === "2day" ? 2 : 3;
  const canContinueDropin = s.selectedTier !== null && dropinUnitCount >= 1 && s.selectedWeekdays.size === requiredDays;

  const getStudentBundleCents = (grade: string | null, prog: ProgramType) => {
    if (prog !== "school_year") return 0;
    return getGradeTier(grade) === "primary" ? 119500 : 109500;
  };
  const getHomeschoolBundleCents = (grade: string | null, sid: string = c.studentId) => {
    if (!s.selectedTier || dropinUnitCount < 1) return 0;
    const studentPricing = getHomeschoolSchoolYearPricing(c.homeschoolPricingByStudentId[sid] ?? false);
    return studentPricing[s.selectedTier][getGradeTier(grade)] * dropinUnitCount;
  };

  let BASE_CENTS: number;
  if (hasSiblings && allStudents) {
    const supplyTotal = SUPPLY_FEE_CENTS * allStudents.length;
    const schoolYearBundleTotal = allStudents
      .filter((st) => s.selectedBundleIds.has(st.studentId))
      .reduce((sum, st) => sum + getStudentBundleCents(st.childGrade, st.programType), 0);
    const homeschoolBundleTotal = allStudents
      .filter((st) => s.selectedHomeschoolBundleIds.has(st.studentId))
      .reduce((sum, st) => sum + getHomeschoolBundleCents(st.childGrade, st.studentId), 0);
    BASE_CENTS = supplyTotal + schoolYearBundleTotal + homeschoolBundleTotal;
  } else {
    const bundleAmountCents = c.programType === "school_year" ? primaryBundleTuitionCents : homeschoolBundleCents;
    BASE_CENTS = SUPPLY_FEE_CENTS + (s.addBundle ? bundleAmountCents : 0);
  }

  const { cardFee, achFee } = feesGrossUp(BASE_CENTS);
  const feeAmount = method === "card" ? cardFee : achFee;
  const totalWithFees = coverFees ? BASE_CENTS + feeAmount : BASE_CENTS;

  const hasPaidHomeschoolMonth = (sid: string, monthIndex: number) =>
    (c.paidHomeschoolByStudent[sid]?.schoolYear ?? []).some((e) => e.weeks.includes(monthIndex));

  return {
    hasSiblings,
    allStudents,
    primaryBundleTuitionCents,
    homeschoolGradeTier,
    primaryHomeschoolPricing,
    dropinUnitCount,
    homeschoolBundleCents,
    requiredDays,
    canContinueDropin,
    getStudentBundleCents,
    getHomeschoolBundleCents,
    hasPaidHomeschoolMonth,
    BASE_CENTS,
    feeLine: feeLineCents(method, cardFee, achFee),
    totalWithFees,
  };
}

/** Returns null where the old handler returned early without sending anything. */
export function buildSupplyFeeCheckout(
  a: { parentId: string; parentEmail: string; coverFees: boolean; paymentMethod: PaymentMethod },
  c: SupplyFeeContext,
  s: SupplyFeeState,
): CheckoutRequest | null {
  const q = supplyFeeQuote(c, s, a.coverFees, a.paymentMethod);
  const { hasSiblings, allStudents, dropinUnitCount, requiredDays, getStudentBundleCents, getHomeschoolBundleCents } = q;
  const { studentId, programType, childGrade, applicationId } = c;
  const siblingStudents = c.siblingStudents;
  const { selectedTier, selectedMonthIndices, selectedWeekdays, selectedBundleIds, selectedHomeschoolBundleIds } = s;

  if (!hasSiblings && s.addBundle && programType === "homeschool" && dropinUnitCount < 1) return null;
  if (hasSiblings && allStudents) {
    const anyHomeschoolBundle = allStudents.some(
      (st) => st.programType === "homeschool" && selectedHomeschoolBundleIds.has(st.studentId),
    );
    if (
      anyHomeschoolBundle &&
      (!s.homeschoolPlanConfigured || !selectedTier || dropinUnitCount < 1 || selectedWeekdays.size !== requiredDays)
    )
      return null;
  }

  const buildHomeschoolWeekSelectionsJson = () => {
    const selectedItems = Array.from(selectedMonthIndices).sort((x, y) => x - y);
    const weekdayArray = Array.from(selectedWeekdays);
    return JSON.stringify(selectedItems.map((w) => ({ week: w, days: weekdayArray })));
  };

  const body: Record<string, unknown> = {
    parentId: a.parentId,
    parentEmail: a.parentEmail,
    studentId,
    coverFees: a.coverFees,
    paymentMethod: a.paymentMethod,
  };

  if (hasSiblings && allStudents) {
    const primarySchoolYearBundle = selectedBundleIds.has(studentId) && programType === "school_year";
    if (primarySchoolYearBundle) {
      body.bundleType = "school_year_tuition";
      body.bundleAmountCents = getStudentBundleCents(childGrade, programType);
      body.bundleMonthIndex = BUNDLE_MONTH_INDEX;
    }

    const primaryHomeschoolBundle = selectedHomeschoolBundleIds.has(studentId) && programType === "homeschool";
    const hsSiblingBundles = siblingStudents!.filter(
      (st) => st.programType === "homeschool" && selectedHomeschoolBundleIds.has(st.studentId),
    );
    const anyHomeschoolBundle = primaryHomeschoolBundle || hsSiblingBundles.length > 0;

    if (anyHomeschoolBundle && selectedTier) {
      const selectedItems = Array.from(selectedMonthIndices).sort((x, y) => x - y);
      const weekdayArray = Array.from(selectedWeekdays);
      body.bundleHomeschoolTier = selectedTier;
      body.bundleHomeschoolSelectedDays = selectedItems;
      body.bundleHomeschoolWeekSelectionsJson = buildHomeschoolWeekSelectionsJson();
      if (selectedTier === "dropin" && weekdayArray.length > 0) {
        body.bundleHomeschoolDropinWeekday = weekdayArray[0];
      }
      if (primaryHomeschoolBundle) {
        body.bundleType = "homeschool";
        body.bundleAmountCents = getHomeschoolBundleCents(childGrade);
        body.bundleMonthIndex = BUNDLE_MONTH_INDEX;
        body.bundleHomeschoolGradeTier = q.homeschoolGradeTier;
        body.bundleHomeschoolApplicationId = applicationId;
      }
      if (hsSiblingBundles.length > 0) {
        body.siblingHomeschoolBundleStudentIds = hsSiblingBundles.map((st) => st.studentId);
        body.siblingHomeschoolBundleAmounts = hsSiblingBundles.map((st) => getHomeschoolBundleCents(st.childGrade, st.studentId));
        body.siblingHomeschoolApplicationIds = hsSiblingBundles.map((st) => st.applicationId ?? "");
        body.siblingHomeschoolGradeTiers = hsSiblingBundles.map((st) => getGradeTier(st.childGrade));
      }
    }

    const sibs = siblingStudents!;
    body.siblingStudentIds = sibs.map((st) => st.studentId);
    body.siblingBundleStudentIds = sibs.filter((st) => selectedBundleIds.has(st.studentId)).map((st) => st.studentId);
    body.siblingGrades = sibs.map((st) => st.childGrade ?? "");
    body.siblingBundleAmounts = sibs
      .filter((st) => selectedBundleIds.has(st.studentId))
      .map((st) => getStudentBundleCents(st.childGrade, st.programType));
  } else {
    if (s.addBundle && programType) {
      if (programType === "school_year") {
        body.bundleType = "school_year_tuition";
        body.bundleAmountCents = q.primaryBundleTuitionCents;
        body.bundleMonthIndex = BUNDLE_MONTH_INDEX;
      } else {
        // homeschool drop-in bundle
        body.bundleType = "homeschool";
        body.bundleAmountCents = q.homeschoolBundleCents;
        body.bundleMonthIndex = BUNDLE_MONTH_INDEX;
        body.bundleHomeschoolTier = selectedTier;
        body.bundleHomeschoolGradeTier = q.homeschoolGradeTier;
        body.bundleHomeschoolApplicationId = applicationId;
        const selectedItems = Array.from(selectedMonthIndices).sort((x, y) => x - y);
        body.bundleHomeschoolSelectedDays = selectedItems;
        const weekdayArray = Array.from(selectedWeekdays);
        if (selectedTier === "dropin" && weekdayArray.length > 0) {
          body.bundleHomeschoolDropinWeekday = weekdayArray[0];
        }
        body.bundleHomeschoolWeekSelectionsJson = JSON.stringify(
          selectedItems.map((w) => ({
            week: w,
            days: weekdayArray,
          })),
        );
      }
    }
  }

  return { endpoint: "/api/stripe/create-supply-fee-checkout", body };
}

/** Sibling pre-step total: $300 per child. */
export function supplyFeeSiblingTotal(selectedCount: number) {
  const totalChildren = 1 + selectedCount;
  return { totalChildren, totalCents: 30000 * totalChildren };
}

// ─── Add-ons: aftercare + Fun Friday, summer + school year ──────────────────

export type AddonKind = "aftercare" | "aftercare_sy" | "funfriday" | "funfriday_sy";

type AddonMonth = { key: string; label: string; items: { label: string; date: string }[] };

export type AddonConfig = {
  kind: AddonKind;
  endpoint: string;
  /** Second plan tab key as sent in `planType`. */
  secondTab: "daily" | "dropin";
  /** Key the dates are sent under. */
  itemsField: "selectedDays" | "selectedFridays";
  months: AddonMonth[];
  /** Price used for the total (and the charge). */
  monthCents: (key: string) => number;
  /** Price shown under each month card. */
  monthLabel: (key: string) => string;
  /** Whether the running total says "N months × $X/mo". */
  isNormalMonth: (key: string) => boolean;
  normalMonthlyCents: number;
  unitCents: number;
};

const byKey = <T extends { key: string }>(list: readonly T[], key: string) => list.find((m) => m.key === key)!;

export function addonConfig(kind: AddonKind): AddonConfig {
  if (kind === "aftercare") {
    return {
      kind,
      endpoint: "/api/stripe/create-aftercare-checkout",
      secondTab: "daily",
      itemsField: "selectedDays",
      months: AFTERCARE_MONTHS.map((m) => ({ key: m.key, label: m.label, items: m.days })),
      monthCents: (k) => aftercareMonthCents(byKey(AFTERCARE_MONTHS, k)),
      monthLabel: (k) => {
        const m = byKey(AFTERCARE_MONTHS, k);
        return `${m.days.length} days · ${
          aftercareMonthCents(m) === AFTERCARE_MONTHLY_CENTS ? `${formatCents(AFTERCARE_MONTHLY_CENTS)}/mo` : formatCents(aftercareMonthCents(m))
        }`;
      },
      isNormalMonth: (k) => aftercareMonthCents(byKey(AFTERCARE_MONTHS, k)) === AFTERCARE_MONTHLY_CENTS,
      normalMonthlyCents: AFTERCARE_MONTHLY_CENTS,
      unitCents: AFTERCARE_DAILY_CENTS,
    };
  }
  if (kind === "aftercare_sy") {
    return {
      kind,
      endpoint: "/api/stripe/create-aftercare-checkout",
      secondTab: "daily",
      itemsField: "selectedDays",
      months: SCHOOL_YEAR_AFTERCARE_MONTHS.map((m) => ({ key: m.key, label: m.label, items: m.days })),
      monthCents: (k) => schoolYearAftercareMonthCents(byKey(SCHOOL_YEAR_AFTERCARE_MONTHS, k)),
      monthLabel: (k) => {
        const m = byKey(SCHOOL_YEAR_AFTERCARE_MONTHS, k);
        return `${m.days.length} days · ${
          schoolYearAftercareMonthCents(m) === AFTERCARE_MONTHLY_CENTS
            ? `${formatCents(AFTERCARE_MONTHLY_CENTS)}/mo`
            : formatCents(schoolYearAftercareMonthCents(m))
        }`;
      },
      isNormalMonth: (k) => schoolYearAftercareMonthCents(byKey(SCHOOL_YEAR_AFTERCARE_MONTHS, k)) === AFTERCARE_MONTHLY_CENTS,
      normalMonthlyCents: AFTERCARE_MONTHLY_CENTS,
      unitCents: AFTERCARE_DAILY_CENTS,
    };
  }
  if (kind === "funfriday") {
    return {
      kind,
      endpoint: "/api/stripe/create-fun-friday-checkout",
      secondTab: "dropin",
      itemsField: "selectedFridays",
      months: FUN_FRIDAY_MONTHS.map((m) => ({ key: m.key, label: m.label, items: m.fridays })),
      // The summer total uses the school-year helper, exactly as before.
      monthCents: (k) => schoolYearFunFridayMonthCents(byKey(FUN_FRIDAY_MONTHS, k) as (typeof SCHOOL_YEAR_FUN_FRIDAY_MONTHS)[number]),
      monthLabel: (k) => {
        const m = byKey(FUN_FRIDAY_MONTHS, k);
        return `${m.fridays.length} Friday${m.fridays.length !== 1 ? "s" : ""} · ${
          m.fridays.length >= 4 ? `${formatCents(FUN_FRIDAY_MONTHLY_CENTS)}/mo` : formatCents(funFridayMonthCents(m))
        }`;
      },
      isNormalMonth: (k) => byKey(FUN_FRIDAY_MONTHS, k).fridays.length >= 4,
      normalMonthlyCents: FUN_FRIDAY_MONTHLY_CENTS,
      unitCents: FUN_FRIDAY_DROPIN_CENTS,
    };
  }
  return {
    kind,
    endpoint: "/api/stripe/create-fun-friday-checkout",
    secondTab: "dropin",
    itemsField: "selectedFridays",
    months: SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((m) => ({ key: m.key, label: m.label, items: m.fridays })),
    monthCents: (k) => schoolYearFunFridayMonthCents(byKey(SCHOOL_YEAR_FUN_FRIDAY_MONTHS, k)),
    monthLabel: (k) => {
      const m = byKey(SCHOOL_YEAR_FUN_FRIDAY_MONTHS, k);
      return `${m.fridays.length} Friday${m.fridays.length !== 1 ? "s" : ""} · ${
        m.fridays.length >= 4 ? `${formatCents(FUN_FRIDAY_MONTHLY_CENTS)}/mo` : formatCents(schoolYearFunFridayMonthCents(m))
      }`;
    },
    isNormalMonth: (k) => byKey(SCHOOL_YEAR_FUN_FRIDAY_MONTHS, k).fridays.length >= 4,
    normalMonthlyCents: FUN_FRIDAY_MONTHLY_CENTS,
    unitCents: FUN_FRIDAY_DROPIN_CENTS,
  };
}

export function addonTotals(cfg: AddonConfig, tab: "monthly" | "daily" | "dropin", selectedMonths: Set<string>, selectedItems: Set<string>) {
  const monthlyTotal = cfg.months.filter((m) => selectedMonths.has(m.key)).reduce((sum, m) => sum + cfg.monthCents(m.key), 0);
  const itemTotal = selectedItems.size * cfg.unitCents;
  const intendedAmountCents = tab === "monthly" ? monthlyTotal : itemTotal;
  const canContinue = tab === "monthly" ? selectedMonths.size > 0 : selectedItems.size > 0;
  return { monthlyTotal, itemTotal, intendedAmountCents, canContinue };
}

/** Add-ons: gross-up total, dollar estimate in the fee line (same as summer tuition). */
export const addonPaymentQuote = summerPaymentQuote;

export function buildAddonCheckout(a: {
  cfg: AddonConfig;
  parentId: string;
  parentEmail: string;
  enrollment: { student_id: string; id: string };
  tab: "monthly" | "daily" | "dropin";
  selectedMonths: Set<string>;
  selectedItems: Set<string>;
  intendedAmountCents: number;
  coverFees: boolean;
  paymentMethod: PaymentMethod;
}): CheckoutRequest {
  return {
    endpoint: a.cfg.endpoint,
    body: {
      parentId: a.parentId,
      parentEmail: a.parentEmail,
      studentId: a.enrollment.student_id,
      applicationId: a.enrollment.id,
      planType: a.tab,
      selectedMonths: Array.from(a.selectedMonths),
      [a.cfg.itemsField]: Array.from(a.selectedItems).sort(),
      intendedAmountCents: a.intendedAmountCents,
      coverFees: a.coverFees,
      paymentMethod: a.paymentMethod,
    },
  };
}

/** Paid dates for an add-on sheet: individually paid dates plus every date of a paid month. */
export function addonPaidItems(cfg: AddonConfig, paid: { months: string[]; items: string[] } | undefined) {
  return new Set([
    ...(paid?.items ?? []),
    ...(paid?.months ?? []).flatMap((mk) => cfg.months.find((m) => m.key === mk)?.items.map((d) => d.date) ?? []),
  ]);
}

// ─── Tuition code (TuitionCodeEntryModal + TuitionCodePaymentModal) ─────────

export type TuitionCodeResult = { label: string; amount_cents: number; code: string };

export function buildValidateTuitionCode(code: string, parentId: string): CheckoutRequest {
  return { endpoint: "/api/billing/validate-tuition-code", body: { code: code.trim(), parentId } };
}

export function tuitionCodePaymentQuote(intendedAmountCents: number, coverFees: boolean, method: PaymentMethod): PaymentQuote {
  const { cardFee, achFee } = feesGrossUp(intendedAmountCents);
  const feeCents = coverFees ? (method === "card" ? cardFee : achFee) : 0;
  return { feeLine: feeLineCents(method, cardFee, achFee), totalWithFees: intendedAmountCents + feeCents };
}

export function buildTuitionCodeCheckout(a: {
  parentId: string;
  parentEmail: string;
  result: TuitionCodeResult;
  coverFees: boolean;
  paymentMethod: PaymentMethod;
}): CheckoutRequest {
  return {
    endpoint: "/api/stripe/create-custom-tuition-checkout",
    body: {
      parentId: a.parentId,
      parentEmail: a.parentEmail,
      tuitionCode: a.result.code,
      label: a.result.label,
      intendedAmountCents: a.result.amount_cents,
      coverFees: a.coverFees,
      paymentMethod: a.paymentMethod,
    },
  };
}

// ─── Registration ("Commit to School Year") ─────────────────────────────────

export const REGISTRATION_BASE_CENTS = 50000;

export function registrationPaymentQuote(coverFees: boolean, method: PaymentMethod): PaymentQuote {
  const BASE_CENTS = REGISTRATION_BASE_CENTS;
  const { cardFee, achFee } = feesGrossUp(BASE_CENTS);
  const feeAmount = method === "card" ? cardFee : achFee;
  return { feeLine: feeLineCents(method, cardFee, achFee), totalWithFees: coverFees ? BASE_CENTS + feeAmount : BASE_CENTS };
}

export function buildRegistrationCheckout(a: {
  parentId: string;
  parentEmail: string;
  app: { student_id: string; id: string };
  type: "drop_in" | "full_time";
  coverFees: boolean;
  paymentMethod: PaymentMethod;
}): CheckoutRequest {
  return {
    endpoint: "/api/stripe/create-registration-checkout",
    body: {
      parentId: a.parentId,
      parentEmail: a.parentEmail,
      studentId: a.app.student_id,
      applicationId: a.app.id,
      ...(a.type === "full_time"
        ? { program: "school_year_26_27" }
        : {
            program: "homeschool_drop_in",
            dropInProgram: "school_year_26_27",
          }),
      coverFees: a.coverFees,
      paymentMethod: a.paymentMethod,
    },
  };
}

// ─── Tuition feedback (TuitionFeedbackPopup → submitTuitionFeedback) ────────

export function buildTuitionFeedback(rating: number, message: string) {
  return { rating, message };
}
