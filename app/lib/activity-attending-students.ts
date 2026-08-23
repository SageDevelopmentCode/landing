import type { SupabaseClient } from "@supabase/supabase-js";
import { computePaidDates } from "@/app/lib/compute-paid-dates";
import { fetchSchoolYearAttendingStudentIds } from "@/app/lib/school-year-attending-students";
import {
  SUMMER_FIRST_DATE,
  SUMMER_LAST_DATE,
} from "@/shared/parent/activity-preferences";

const DONT_INCLUDE_TAG = "Don't Include";

async function fetchSummerAttendingStudentIds(
  db: SupabaseClient,
  date: string,
): Promise<string[]> {
  const [appsRes, txnsRes] = await Promise.all([
    db
      .schema("parent_app")
      .from("applications")
      .select("student_id, admin_tags")
      .eq("status", "enrolled"),
    db
      .schema("billing")
      .from("stripe_transactions")
      .select("payment_type, status, student_id, metadata")
      .eq("status", "completed"),
  ]);

  if (appsRes.error) throw new Error(appsRes.error.message);
  if (txnsRes.error) throw new Error(txnsRes.error.message);

  const enrolledIds = (appsRes.data ?? [])
    .filter(
      (a) =>
        a.student_id &&
        !(a.admin_tags ?? []).includes(DONT_INCLUDE_TAG),
    )
    .map((a) => a.student_id as string);

  const paidSets = computePaidDates(txnsRes.data ?? []);

  return enrolledIds.filter((studentId) => paidSets[studentId]?.has(date));
}

/** Student IDs attending on `date` — matches staff home activity prefs sheet logic. */
export async function fetchAttendingStudentIdsForActivityDate(
  db: SupabaseClient,
  date: string,
): Promise<Set<string>> {
  const isSummer =
    date >= SUMMER_FIRST_DATE && date <= SUMMER_LAST_DATE;

  const ids = isSummer
    ? await fetchSummerAttendingStudentIds(db, date)
    : await fetchSchoolYearAttendingStudentIds(db, date);

  return new Set(ids);
}
