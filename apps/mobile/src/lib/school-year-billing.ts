import { SCHOOL_YEAR_FUN_FRIDAY_MONTHS } from "@/lib/school-year";

export type ApplicationRow = {
  id: string;
  student_id: string;
  status: string;
  program: string | null;
  drop_in_program: string | null;
  child_legal_name: string | null;
  child_grade: string | null;
};

export type PaidHomeschoolEntry = {
  weeks: number[];
  tier: string;
  days: string[];
  weekDays: Record<number, string[]>;
  amountCents: number;
  createdAt: string;
};

export type PaidHomeschoolByStudent = Record<
  string,
  { summer: PaidHomeschoolEntry[]; schoolYear: PaidHomeschoolEntry[] }
>;

export const SY_FUN_FRIDAY_KEYS = new Set(
  SCHOOL_YEAR_FUN_FRIDAY_MONTHS.map((m) => m.key),
);

export function hasSchoolYearContent(
  applications: ApplicationRow[],
  studentId: string,
): boolean {
  return applications.some(
    (a) =>
      a.student_id === studentId &&
      a.status === "enrolled" &&
      (a.program === "school_year_26_27" ||
        a.program === "both" ||
        (a.program === "homeschool_drop_in" &&
          (a.drop_in_program === "school_year_26_27" ||
            a.drop_in_program === "both"))),
  );
}

export function getSchoolYearHomeschoolApps(
  applications: ApplicationRow[],
  studentId: string,
): ApplicationRow[] {
  return applications.filter(
    (a) =>
      a.student_id === studentId &&
      a.status === "enrolled" &&
      a.program === "homeschool_drop_in" &&
      (a.drop_in_program === "school_year_26_27" ||
        a.drop_in_program === "both"),
  );
}

export function resolveSupplyFeeProgramType(
  applications: ApplicationRow[],
  studentId: string,
): "school_year" | "homeschool" | null {
  const apps = applications.filter(
    (a) => a.student_id === studentId && a.status === "enrolled",
  );
  if (apps.some((a) => a.program === "school_year_26_27")) return "school_year";
  if (
    apps.some(
      (a) =>
        a.program === "homeschool_drop_in" &&
        (a.drop_in_program === "school_year_26_27" ||
          a.drop_in_program === "both"),
    )
  ) {
    return "homeschool";
  }
  if (apps.some((a) => a.program === "both")) return "school_year";
  return null;
}

export function countSchoolYearFunFridayPaidMonths(
  paidFunFriday: { months: string[]; fridays: string[] } | undefined,
): number {
  return (paidFunFriday?.months ?? []).filter((k) => SY_FUN_FRIDAY_KEYS.has(k))
    .length;
}
