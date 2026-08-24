// Keep in sync with shared/action-needed.ts (web uses repo-root shared/).

import { SCHOOL_YEAR_MONTHS } from "./school-year";

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
      (paidSchoolYearByStudent[id]?.length ?? 0) < SCHOOL_YEAR_MONTHS.length,
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
    : "Due September 1 · Tap to pay now";
}
