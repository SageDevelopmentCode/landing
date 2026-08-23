import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isSchoolYearFieldFridayPaid,
  isSchoolYearWeekdayPaid,
  type StripeTxnLike,
} from "@/shared/billing/school-year-attendance";

const DONT_INCLUDE_TAG = "Don't Include";

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

function isSchoolYearApp(a: AppRow): boolean {
  return (
    a.program === "school_year_26_27" ||
    a.program === "both" ||
    (a.program === "homeschool_drop_in" &&
      (a.drop_in_program === "school_year_26_27" ||
        a.drop_in_program === "both"))
  );
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
        isSchoolYearApp(a) &&
        !(a.admin_tags ?? []).includes(DONT_INCLUDE_TAG),
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
        ? Promise.resolve({ data: [] as { student_id: string }[], error: null })
        : db
            .schema("attendance")
            .from("school_year_records")
            .select("student_id")
            .eq("date", date)
            .in("student_id", enrolledIds),
      isFridayDate
        ? db
            .schema("attendance")
            .from("school_year_field_friday_records")
            .select("student_id")
            .eq("date", date)
            .in("student_id", enrolledIds)
        : Promise.resolve({ data: [] as { student_id: string }[], error: null }),
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

  const schoolYearRecordIds = new Set(
    ((schoolYearRecordsRes.data ?? []) as { student_id: string }[]).map(
      (r) => r.student_id,
    ),
  );
  const schoolYearFridayRecordIds = new Set(
    ((schoolYearFridayRecordsRes.data ?? []) as { student_id: string }[]).map(
      (r) => r.student_id,
    ),
  );

  return enrolledIds.filter((studentId) =>
    isFridayDate
      ? schoolYearFridayPaidIds.has(studentId) ||
        schoolYearFridayRecordIds.has(studentId)
      : schoolYearPaidIds.has(studentId) || schoolYearRecordIds.has(studentId),
  );
}
