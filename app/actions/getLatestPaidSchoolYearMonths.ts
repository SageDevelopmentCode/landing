"use server";

import { createAdminClient } from "@/app/lib/supabase-server";
import {
  buildLatestPaidSchoolYearMonthByStudentId,
  type EnrollmentTxn,
} from "@/shared/billing/student-month-enrollment";

const SCHOOL_YEAR_PAYMENT_TYPES = [
  "school_year_tuition",
  "homeschool_dropin",
  "supply_fee",
  "homeschool",
] as const;

export async function getLatestPaidSchoolYearMonths(
  studentIds: string[],
): Promise<Record<string, number>> {
  const uniqueIds = [...new Set(studentIds.filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  const client = createAdminClient();
  const { data, error } = await client
    .schema("billing")
    .from("stripe_transactions")
    .select("student_id, payment_type, metadata")
    .in("student_id", uniqueIds)
    .eq("status", "completed")
    .eq("is_deleted", false)
    .in("payment_type", [...SCHOOL_YEAR_PAYMENT_TYPES]);

  if (error) {
    console.error("getLatestPaidSchoolYearMonths:", error.message);
    return {};
  }

  const txns = (data ?? []).filter(
    (row): row is EnrollmentTxn =>
      typeof row.student_id === "string" && row.student_id.length > 0,
  );

  return buildLatestPaidSchoolYearMonthByStudentId(txns);
}
