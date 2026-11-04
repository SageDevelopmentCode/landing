"use server";

import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/app/lib/supabase-server";
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

async function assertSuperAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not authenticated" };

  const adminClient = createAdminClient();
  const { data: adminUser } = await adminClient
    .schema("admin")
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminUser?.role !== "super_admin") {
    return { ok: false as const, error: "Unauthorized" };
  }

  return { ok: true as const, adminClient };
}

export async function getLatestPaidSchoolYearMonths(
  studentIds: string[],
): Promise<Record<string, number>> {
  const auth = await assertSuperAdmin();
  if (!auth.ok) return {};

  const uniqueIds = [...new Set(studentIds.filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  const { data, error } = await auth.adminClient
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
