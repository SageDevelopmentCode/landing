import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasDontIncludeTag,
  isSchoolYearApp,
} from "@/app/lib/school-year-program";
import {
  isSchoolYearFieldFridayPaid,
  isSchoolYearWeekdayPaid,
  type StripeTxnLike,
} from "@/shared/billing/school-year-attendance";

type AppRow = {
  student_id: string;
  admin_tags: string[] | null;
  program: string | null;
  drop_in_program: string | null;
};

type TxnRow = StripeTxnLike & {
  student_id: string;
};

function getDayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
    new Date(y, m - 1, d).getDay()
  ];
}

/** Matches apps/mobile fetchSchoolYearTodayStudents attending filter (paid or has record). */
export async function fetchSchoolYearAttendingStudentIds(
  db: SupabaseClient,
  date: string,
): Promise<string[]> {
  const appsRes = await db
    .schema("parent_app")
    .from("applications")
    .select("student_id, admin_tags, program, drop_in_program")
    .eq("status", "enrolled");

  if (appsRes.error) throw new Error(appsRes.error.message);

  const appsData = (appsRes.data ?? []) as AppRow[];
  const enrolledIds = appsData
    .filter(
      (a) =>
        isSchoolYearApp(a) && !hasDontIncludeTag(a.admin_tags),
    )
    .map((a) => a.student_id);

  if (enrolledIds.length === 0) return [];

  const dayOfWeek = getDayOfWeek(date);
  const isFridayDate = dayOfWeek === "fri";

  const [txnsRes, schoolYearRecordsRes, schoolYearFridayRecordsRes] =
    await Promise.all([
      db
        .schema("billing")
        .from("stripe_transactions")
        .select("student_id, payment_type, metadata")
        .in("payment_type", [
          "school_year_tuition",
          "homeschool_dropin",
          "fun_friday_tuition",
        ])
        .eq("status", "completed")
        .eq("is_deleted", false)
        .in("student_id", enrolledIds),
      isFridayDate
        ? Promise.resolve({
            data: [] as {
              student_id: string;
              excluded_from_roster: boolean;
            }[],
            error: null,
          })
        : db
            .schema("attendance")
            .from("school_year_records")
            .select("student_id, excluded_from_roster")
            .eq("date", date)
            .in("student_id", enrolledIds),
      isFridayDate
        ? db
            .schema("attendance")
            .from("school_year_field_friday_records")
            .select("student_id, excluded_from_roster")
            .eq("date", date)
            .in("student_id", enrolledIds)
        : Promise.resolve({
            data: [] as {
              student_id: string;
              excluded_from_roster: boolean;
            }[],
            error: null,
          }),
    ]);

  if (txnsRes.error) throw new Error(txnsRes.error.message);
  if (schoolYearRecordsRes.error) {
    throw new Error(schoolYearRecordsRes.error.message);
  }
  if (schoolYearFridayRecordsRes.error) {
    throw new Error(schoolYearFridayRecordsRes.error.message);
  }

  const txns = (txnsRes.data ?? []) as TxnRow[];
  const schoolYearPaidIds = new Set<string>();
  const schoolYearFridayPaidIds = new Set<string>();

  for (const txn of txns) {
    if (isSchoolYearWeekdayPaid(txn, date)) {
      schoolYearPaidIds.add(txn.student_id);
    }
    if (isSchoolYearFieldFridayPaid(txn, date)) {
      schoolYearFridayPaidIds.add(txn.student_id);
    }
  }

  type RecordRow = { student_id: string; excluded_from_roster: boolean };

  const schoolYearRecordMap = new Map(
    ((schoolYearRecordsRes.data ?? []) as RecordRow[]).map((r) => [
      r.student_id,
      r,
    ]),
  );
  const schoolYearFridayRecordMap = new Map(
    ((schoolYearFridayRecordsRes.data ?? []) as RecordRow[]).map((r) => [
      r.student_id,
      r,
    ]),
  );

  return enrolledIds.filter((studentId) => {
    const record = isFridayDate
      ? schoolYearFridayRecordMap.get(studentId)
      : schoolYearRecordMap.get(studentId);
    if (record?.excluded_from_roster) return false;
    const isPaid = isFridayDate
      ? schoolYearFridayPaidIds.has(studentId)
      : schoolYearPaidIds.has(studentId);
    return isPaid || record != null;
  });
}
