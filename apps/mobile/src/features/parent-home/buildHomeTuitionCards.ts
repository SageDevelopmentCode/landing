// Tuition & billing preview cards for the parent Home (moved verbatim from the
// inline block in (tabs)/home.tsx so every Home layout shares the same logic).
import {
  countSchoolYearAftercarePaidMonths,
  countSchoolYearFunFridayPaidMonths,
  type PaidHomeschoolByStudent,
} from "@/lib/school-year-billing";
import type { PaidSchoolYearByStudent } from "@/lib/action-needed";
import {
  HOME_CARD_IMAGES,
  formatCents,
  formatHomeCardStatus,
  isSupplyFeePendingPayment,
} from "./constants";
import type {
  HomeApplicationRow,
  HomeProgramCardDef,
  PendingPaymentPreview,
} from "./types";

export type HomeTuitionCard = { key: string } & HomeProgramCardDef;

export type BuildHomeTuitionCardsInput = {
  applications: HomeApplicationRow[];
  students: { id: string; child_legal_name: string }[];
  paidSupplyFeeByStudent: Record<string, boolean>;
  paidSchoolYearByStudent: PaidSchoolYearByStudent;
  paidAftercareByStudent: Record<string, { months: string[]; days: string[] }>;
  paidFunFridayByStudent: Record<string, { months: string[]; fridays: string[] }>;
  paidHomeschoolByStudent: PaidHomeschoolByStudent;
  pendingPayments: PendingPaymentPreview[];
};

export function buildHomeTuitionCards({
  applications,
  students,
  paidSupplyFeeByStudent,
  paidSchoolYearByStudent,
  paidAftercareByStudent,
  paidFunFridayByStudent,
  paidHomeschoolByStudent,
  pendingPayments,
}: BuildHomeTuitionCardsInput) {
  const enrolledApps = applications.filter(
    (a) => a.status === "enrolled",
  );
  const schoolYearHomeschoolApps = enrolledApps.filter(
    (a) =>
      a.program === "homeschool_drop_in" &&
      (a.drop_in_program === "school_year_26_27" ||
        a.drop_in_program === "both"),
  );
  const bothEnrollments = enrolledApps.filter(
    (a) => a.program === "both",
  );
  const schoolYearTuitionStudentIds = new Set([
    ...enrolledApps
      .filter((a) => a.program === "school_year_26_27")
      .map((a) => a.student_id),
    ...bothEnrollments.map((a) => a.student_id),
  ]);
  const schoolYearStudentIds = new Set([
    ...schoolYearTuitionStudentIds,
    ...schoolYearHomeschoolApps.map((a) => a.student_id),
  ]);

  const studentMap = Object.fromEntries(
    students.map((s) => [
      s.id,
      {
        name:
          s.child_legal_name?.trim().split(/\s+/)[0] ??
          s.child_legal_name ??
          "Student",
      },
    ]),
  );

  const schoolYearNames = [...schoolYearStudentIds]
    .map((id) => studentMap[id]?.name)
    .filter(Boolean) as string[];

  const tuitionNames = [...schoolYearTuitionStudentIds]
    .map((id) => studentMap[id]?.name)
    .filter(Boolean) as string[];

  const allSupplyFeesPaid =
    schoolYearStudentIds.size > 0 &&
    [...schoolYearStudentIds].every(
      (id) => paidSupplyFeeByStudent[id],
    );

  const anyTuitionSupplyFeeUnpaid = [
    ...schoolYearTuitionStudentIds,
  ].some((id) => !paidSupplyFeeByStudent[id]);

  const totalTuitionMonthsPaid = [
    ...schoolYearTuitionStudentIds,
  ].reduce(
    (acc, id) =>
      acc + (paidSchoolYearByStudent[id]?.length ?? 0),
    0,
  );

  const totalAftercareMonths = [...schoolYearStudentIds].reduce(
    (acc, id) =>
      acc +
      countSchoolYearAftercarePaidMonths(
        paidAftercareByStudent[id],
      ),
    0,
  );

  const totalFunFridayMonths = [...schoolYearStudentIds].reduce(
    (acc, id) =>
      acc +
      countSchoolYearFunFridayPaidMonths(
        paidFunFridayByStudent[id],
      ),
    0,
  );

  const programLabel = "School Year 26–27";
  const programCards: HomeTuitionCard[] = [];

  if (schoolYearNames.length > 0) {
    programCards.push({
      key: "supply-fee",
      image: HOME_CARD_IMAGES.aftercare,
      programLabel,
      title: "Annual Supply Fee",
      badge: "$300",
      statusLine: formatHomeCardStatus(
        schoolYearNames,
        allSupplyFeesPaid ? "Paid ✓" : "Pay now",
      ),
    });
  }

  if (tuitionNames.length > 0) {
    programCards.push({
      key: "tuition",
      image: HOME_CARD_IMAGES.summer,
      programLabel,
      title: "School Year Tuition",
      badge:
        totalTuitionMonthsPaid > 0
          ? `${totalTuitionMonthsPaid} mo. paid`
          : undefined,
      statusLine: formatHomeCardStatus(
        tuitionNames,
        anyTuitionSupplyFeeUnpaid
          ? "Pay supply fee first"
          : "Pay tuition",
      ),
    });
  }

  for (const app of schoolYearHomeschoolApps) {
    const studentName = studentMap[app.student_id]?.name ?? null;
    const paidData = paidHomeschoolByStudent[app.student_id];
    const hasSchoolYear =
      (paidData?.schoolYear?.length ?? 0) > 0;
    programCards.push({
      key: `homeschool-sy-${app.id}`,
      image: HOME_CARD_IMAGES.homeschool,
      programLabel,
      title: "Homeschool Drop-In",
      badge: hasSchoolYear ? "School year active" : undefined,
      statusLine: formatHomeCardStatus(
        studentName ? [studentName] : [],
        hasSchoolYear ? "Manage plan" : "Set up plan",
      ),
    });
  }

  if (schoolYearNames.length > 0) {
    programCards.push({
      key: "aftercare",
      image: HOME_CARD_IMAGES.funFriday,
      programLabel,
      title: "Extended Learning (3:00–5:00pm)",
      badge:
        totalAftercareMonths > 0
          ? `${totalAftercareMonths} mo. paid`
          : "Optional",
      statusLine: formatHomeCardStatus(
        schoolYearNames,
        totalAftercareMonths > 0 ? "Add months" : "Select plan",
      ),
    });

    programCards.push({
      key: "fun-friday",
      image: HOME_CARD_IMAGES.schoolYear,
      programLabel,
      title: "Friday Enrichment Day",
      badge:
        totalFunFridayMonths > 0
          ? `${totalFunFridayMonths} mo. paid`
          : "Optional",
      statusLine: formatHomeCardStatus(
        schoolYearNames,
        totalFunFridayMonths > 0 ? "Add months" : "Select plan",
      ),
    });
  }

  const visiblePendingPayments = pendingPayments.filter(
    (p) => !isSupplyFeePendingPayment(p),
  );

  for (const p of visiblePendingPayments) {
    programCards.push({
      key: `pending-${p.id}`,
      image: HOME_CARD_IMAGES.schoolYear,
      programLabel: "Pending",
      title: p.label,
      statusLine:
        p.amount_cents != null
          ? formatCents(p.amount_cents)
          : "See details",
    });
  }

  const hasAnything =
    visiblePendingPayments.length > 0 ||
    schoolYearStudentIds.size > 0;

  return {
    programCards,
    hasAnything,
    visiblePendingPayments,
    schoolYearStudentIds,
    allSupplyFeesPaid,
    anyTuitionSupplyFeeUnpaid,
  };
}
