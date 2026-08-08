// Keep in sync with shared/action-needed.ts (web uses repo-root shared/).

// Aug 2026 – May 2027; keep in sync with shared/billing/school-year.ts SCHOOL_YEAR_MONTHS
const SCHOOL_YEAR_MONTH_COUNT = 10;

export type PaidSchoolYearByStudent = Record<string, number[]>;

export function getSchoolYearTuitionStudentIds(
  schoolYearOnlyStudentIds: string[],
  bothProgramStudentIds: string[],
): Set<string> {
  return new Set([...schoolYearOnlyStudentIds, ...bothProgramStudentIds]);
}

export function needsSchoolYearTuitionAction(
  schoolYearTuitionStudentIds: Set<string>,
  paidSchoolYearByStudent: PaidSchoolYearByStudent,
): boolean {
  if (schoolYearTuitionStudentIds.size === 0) return false;
  return [...schoolYearTuitionStudentIds].some(
    (id) =>
      (paidSchoolYearByStudent[id]?.length ?? 0) < SCHOOL_YEAR_MONTH_COUNT,
  );
}

export function needsConferenceScheduling(
  conferenceStudentIds: string[],
  bookingsByStudent: Record<string, unknown>,
): boolean {
  if (conferenceStudentIds.length === 0) return false;
  return !conferenceStudentIds.every((id) => bookingsByStudent[id]);
}

export function getTuitionActionSubtext(
  schoolYearTuitionStudentIds: Set<string>,
  paidSupplyFeeByStudent: Record<string, boolean>,
): string {
  const anySupplyFeeUnpaid = [...schoolYearTuitionStudentIds].some(
    (id) => !paidSupplyFeeByStudent[id],
  );
  return anySupplyFeeUnpaid
    ? "Pay supply fee first"
    : "Due August 10 · Tap to pay now";
}
