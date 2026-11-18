// Keep in sync with shared/action-needed.ts (web uses repo-root shared/).

export type PaidSchoolYearByStudent = Record<string, number[]>;

/** School-year month index (1–10) the Home tuition reminder checks. 5 = December 2026. */
export const TUITION_ACTION_MONTH_INDEX = 5;

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
      !(paidSchoolYearByStudent[id] ?? []).includes(TUITION_ACTION_MONTH_INDEX),
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
    : "Due Tuesday, December 1 · Tap to pay now";
}
