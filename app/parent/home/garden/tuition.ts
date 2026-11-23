import {
  SCHOOL_YEAR_AFTERCARE_MONTHS,
  SCHOOL_YEAR_FUN_FRIDAY_MONTHS,
} from "@/shared/billing/school-year";
import type {
  HomePendingPayment,
  HomeschoolDropInApp,
  PaidAftercareByStudent,
  PaidFunFridayByStudent,
  PaidHomeschoolByStudent,
  PaidSchoolYearByStudent,
  SchoolYearOnlyApp,
  StudentMap,
  SummerEnrollment,
} from "../page";

const SCHOOL_YEAR_AFTERCARE_KEYS = new Set(SCHOOL_YEAR_AFTERCARE_MONTHS.map((m) => m.key));
const SCHOOL_YEAR_FUN_FRIDAY_KEYS = new Set(SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((m) => m.key));

/** How the card's call-to-action reads. Status is always carried by text, not just colour. */
export type TuitionCtaTone = "pay" | "paid" | "plan" | "optional" | "locked";

export type TuitionCard = {
  key: string;
  image: string;
  imagePosition?: string;
  names: string | null;
  term: string | null;
  title: string;
  badgeLeft?: string;
  badgeRight?: { label: string; tone: "paid" | "neutral" };
  cta: { label: string; tone: TuitionCtaTone };
  amount?: string;
  /** Locked cards don't navigate (tuition waits on the supply fee). */
  locked?: boolean;
  tint: "peach" | "mint" | "sky" | "lav" | "butter" | "coral";
};

function formatCents(cents: number | null): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

type Input = {
  pendingPayments: HomePendingPayment[];
  studentMap: StudentMap;
  summerEnrollments: SummerEnrollment[];
  schoolYearOnlyApps: SchoolYearOnlyApp[];
  homeschoolDropInApps: HomeschoolDropInApp[];
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  paidAftercareByStudent: PaidAftercareByStudent;
  paidFunFridayByStudent: PaidFunFridayByStudent;
  paidSchoolYearByStudent: PaidSchoolYearByStudent;
  paidSupplyFeeByStudent: Record<string, boolean>;
};

/** Same rules as the previous Home "Tuition & billing" block, as data. */
export function buildTuitionCards({
  pendingPayments,
  studentMap,
  summerEnrollments,
  schoolYearOnlyApps,
  homeschoolDropInApps,
  paidHomeschoolByStudent,
  paidAftercareByStudent,
  paidFunFridayByStudent,
  paidSchoolYearByStudent,
  paidSupplyFeeByStudent,
}: Input): { hasAnything: boolean; cards: TuitionCard[]; supplyFeeBlocksTuition: boolean } {
  const schoolYearHomeschoolApps = homeschoolDropInApps.filter(
    (a) => a.drop_in_program === "school_year_26_27" || a.drop_in_program === "both",
  );
  const bothEnrollments = summerEnrollments.filter((e) => e.program === "both");

  const schoolYearTuitionStudentIds = new Set([
    ...schoolYearOnlyApps.map((a) => a.student_id),
    ...bothEnrollments.map((e) => e.student_id),
  ]);
  const schoolYearStudentIds = new Set([
    ...schoolYearOnlyApps.map((a) => a.student_id),
    ...bothEnrollments.map((e) => e.student_id),
    ...schoolYearHomeschoolApps.map((a) => a.student_id),
  ]);

  const schoolYearNames = [...schoolYearStudentIds]
    .map((id) => studentMap[id]?.name)
    .filter(Boolean) as string[];
  const tuitionNames = [...schoolYearTuitionStudentIds]
    .map((id) => studentMap[id]?.name)
    .filter(Boolean) as string[];

  const allSupplyFeesPaid =
    schoolYearStudentIds.size > 0 && [...schoolYearStudentIds].every((id) => paidSupplyFeeByStudent[id]);
  const anyTuitionSupplyFeeUnpaid = [...schoolYearTuitionStudentIds].some((id) => !paidSupplyFeeByStudent[id]);

  const totalTuitionMonthsPaid = [...schoolYearTuitionStudentIds].reduce(
    (acc, id) => acc + (paidSchoolYearByStudent[id]?.length ?? 0),
    0,
  );
  const totalAftercareMonths = [...schoolYearStudentIds].reduce(
    (acc, id) => acc + (paidAftercareByStudent[id]?.months?.filter((k) => SCHOOL_YEAR_AFTERCARE_KEYS.has(k)) ?? []).length,
    0,
  );
  const totalFunFridayMonths = [...schoolYearStudentIds].reduce(
    (acc, id) => acc + (paidFunFridayByStudent[id]?.months?.filter((k) => SCHOOL_YEAR_FUN_FRIDAY_KEYS.has(k)) ?? []).length,
    0,
  );

  const hasAnything = pendingPayments.length > 0 || schoolYearStudentIds.size > 0;
  const cards: TuitionCard[] = [];
  const term = "School Year 26–27";

  if (schoolYearNames.length > 0) {
    cards.push({
      key: "supply-fee",
      image: "/assets/Stock2.jpg",
      imagePosition: "center 65%",
      names: schoolYearNames.join(", "),
      term,
      title: "Annual Supply Fee",
      badgeRight: { label: "$300", tone: "neutral" },
      cta: allSupplyFeesPaid ? { label: "Paid", tone: "paid" } : { label: "Pay now", tone: "pay" },
      tint: "peach",
    });
  }

  if (tuitionNames.length > 0) {
    cards.push({
      key: "school-year-tuition",
      image: "/assets/Stock1.jpg",
      names: tuitionNames.join(", "),
      term,
      title: "School Year Tuition",
      badgeRight: totalTuitionMonthsPaid > 0 ? { label: `${totalTuitionMonthsPaid} mo. paid`, tone: "paid" } : undefined,
      cta: anyTuitionSupplyFeeUnpaid
        ? { label: "Pay supply fee first", tone: "locked" }
        : { label: "Pay tuition", tone: "pay" },
      locked: anyTuitionSupplyFeeUnpaid,
      tint: "mint",
    });
  }

  for (const app of schoolYearHomeschoolApps) {
    const hasSchoolYear = (paidHomeschoolByStudent[app.student_id]?.schoolYear?.length ?? 0) > 0;
    cards.push({
      key: `homeschool-sy-${app.id}`,
      image: "/assets/Homeschool.jpg",
      names: studentMap[app.student_id]?.name ?? null,
      term,
      title: "Homeschool Drop-In",
      badgeRight: hasSchoolYear ? { label: "School year active", tone: "paid" } : undefined,
      cta: { label: hasSchoolYear ? "Manage plan" : "Set up plan", tone: "plan" },
      tint: "sky",
    });
  }

  if (schoolYearNames.length > 0) {
    cards.push({
      key: "extended-learning",
      image: "/assets/Stock3.jpg",
      names: schoolYearNames.join(", "),
      term,
      title: "Extended Learning (3:00 – 5:00pm)",
      badgeLeft: "Optional",
      badgeRight: totalAftercareMonths > 0 ? { label: `${totalAftercareMonths}mo paid`, tone: "paid" } : undefined,
      cta: { label: totalAftercareMonths > 0 ? "Add months" : "Select plan", tone: "optional" },
      tint: "butter",
    });

    cards.push({
      key: "friday-enrichment",
      image: "/assets/Stock4.jpg",
      names: schoolYearNames.join(", "),
      term,
      title: "Friday Enrichment Day",
      badgeLeft: totalFunFridayMonths > 0 ? undefined : "Optional",
      badgeRight: totalFunFridayMonths > 0 ? { label: `${totalFunFridayMonths} mo. paid`, tone: "paid" } : undefined,
      cta: { label: totalFunFridayMonths > 0 ? "Add months" : "Select plan", tone: "optional" },
      tint: "lav",
    });
  }

  for (const payment of pendingPayments) {
    cards.push({
      key: payment.id,
      image: "/assets/ImageTen.jpg",
      names: payment.student_id ? (studentMap[payment.student_id]?.name ?? "Student") : "Student",
      term: null,
      title: payment.label,
      cta: { label: "Pay now", tone: "pay" },
      amount: formatCents(payment.amount_cents),
      tint: "coral",
    });
  }

  return { hasAnything, cards, supplyFeeBlocksTuition: anyTuitionSupplyFeeUnpaid && tuitionNames.length > 0 };
}
