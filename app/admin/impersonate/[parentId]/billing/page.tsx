import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import { resolveEffectiveParentId } from "../../resolveEffectiveParentId";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ImpersonateNotificationBell from "../../ImpersonateNotificationBell";
import BillingPage from "@/app/parent/billing/BillingPage";
import type {
  StripeTransaction,
  PendingPaymentRequest,
  SummerEnrollment,
  NonEnrolledApp,
  HomeschoolDropInApp,
  PaidWeeksByStudent,
  PaidHomeschoolByStudent,
  PaidAftercareByStudent,
  PaidFunFridayByStudent,
  SummerNotesByStudent,
  HomeschoolNotesByStudent,
  StudentInfo,
  SchoolYearOnlyApp,
  PaidSchoolYearByStudent,
} from "@/app/parent/billing/page";

export default async function ImpersonateBillingPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();
  const { effectiveParentId, isSharedAccess, ownerName } = await resolveEffectiveParentId(parentId);

  const [
    { data: txData },
    { data: adminUser },
    { data: pendingData },
    { data: summerData },
    { data: notesData },
    { data: homeschoolNotesData },
  ] = await Promise.all([
    adminClient
      .schema("billing")
      .from("stripe_transactions")
      .select("*")
      .eq("parent_id", effectiveParentId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false }),
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, email, profile_image_url")
      .eq("id", parentId)
      .single(),
    adminClient
      .schema("billing")
      .from("pending_payment_requests")
      .select(
        "id, student_id, program, payment_type, week, month, label, amount_cents, created_at"
      )
      .eq("parent_id", effectiveParentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select(
        "id, student_id, child_grade, status, child_legal_name, program, drop_in_program"
      )
      .eq("user_id", effectiveParentId)
      .eq("approved", true)
      .in("program", ["summer_26", "both", "homeschool_drop_in", "school_year_26_27"]),
    adminClient
      .schema("billing")
      .from("summer_week_commitments")
      .select("student_id, note")
      .eq("parent_id", effectiveParentId),
    adminClient
      .schema("billing")
      .from("homeschool_day_commitments")
      .select("student_id, note")
      .eq("parent_id", effectiveParentId),
  ]);

  if (!adminUser) notFound();

  const fullName = adminUser.full_name ?? null;
  const email = (adminUser.email as string | null) ?? "";
  const transactions = (txData ?? []) as StripeTransaction[];
  const pendingRequests = (pendingData ?? []) as PendingPaymentRequest[];

  const allSummerApps = (
    (summerData ?? []) as {
      id: string;
      student_id: string | null;
      child_grade: string | null;
      status: string | null;
      child_legal_name: string | null;
      program: string | null;
      drop_in_program: string | null;
    }[]
  ).filter((e) => !!e.student_id && !!e.id);

  const summerEnrollments: SummerEnrollment[] = allSummerApps
    .filter((e) => e.status === "enrolled")
    .map((e) => ({
      id: e.id,
      student_id: e.student_id!,
      child_grade: e.child_grade,
      program: e.program ?? null,
    }));

  const nonEnrolledApps: NonEnrolledApp[] = allSummerApps
    .filter((e) => e.status !== "enrolled" && e.program !== "homeschool_drop_in")
    .map((e) => ({
      id: e.id,
      student_id: e.student_id!,
      name: e.child_legal_name,
      program: e.program ?? null,
    }));

  const homeschoolDropInApps: HomeschoolDropInApp[] = allSummerApps
    .filter(
      (e) =>
        e.status === "enrolled" &&
        (e.program === "homeschool_drop_in" || e.program === "both"),
    )
    .map((e) => ({
      id: e.id,
      student_id: e.student_id!,
      drop_in_program:
        e.program === "homeschool_drop_in" ? e.drop_in_program : "summer_26",
      child_grade: e.child_grade,
      name: e.child_legal_name,
    }));

  const paidWeeksByStudent: PaidWeeksByStudent = {};
  for (const tx of transactions) {
    if (
      tx.payment_type === "summer_tuition" &&
      tx.status === "completed" &&
      tx.student_id
    ) {
      const planType = (tx.metadata as Record<string, string>)?.plan_type;
      const weeksStr =
        (tx.metadata as Record<string, string>)?.weeks ?? "";
      if (planType === "full") {
        paidWeeksByStudent[tx.student_id] = Array.from(
          { length: 12 },
          (_, i) => i + 1
        );
      } else {
        const weeks = weeksStr
          .split(",")
          .map(Number)
          .filter(Boolean);
        paidWeeksByStudent[tx.student_id] = [
          ...(paidWeeksByStudent[tx.student_id] ?? []),
          ...weeks,
        ];
      }
    }
  }

  const paidHomeschoolByStudent: PaidHomeschoolByStudent = {};
  for (const tx of transactions) {
    if (
      tx.payment_type === "homeschool_dropin" &&
      tx.status === "completed" &&
      tx.student_id
    ) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const program = meta.program ?? "summer_26";
      const tier = meta.tier ?? "dropin";
      const days = meta.selected_days?.split(",").filter(Boolean) ?? [];
      const weeks =
        meta.selected_weeks?.split(",").map(Number).filter(Boolean) ?? [];
      let weekDays: Record<number, string[]> = {};
      if (meta.week_selections) {
        try {
          const parsed: { week: number; days: string[] }[] = JSON.parse(
            meta.week_selections
          );
          parsed.forEach(({ week, days: d }) => {
            weekDays[week] = d;
          });
        } catch {
          /* fall through */
        }
      }
      if (Object.keys(weekDays).length === 0) {
        weeks.forEach((w) => {
          weekDays[w] = days;
        });
      }
      if (!paidHomeschoolByStudent[tx.student_id]) {
        paidHomeschoolByStudent[tx.student_id] = { summer: [], schoolYear: [] };
      }
      const entry = {
        weeks,
        tier,
        days,
        weekDays,
        amountCents: tx.amount_cents,
        createdAt: tx.created_at,
      };
      if (program === "summer_26") {
        paidHomeschoolByStudent[tx.student_id].summer.push(entry);
      } else {
        paidHomeschoolByStudent[tx.student_id].schoolYear.push(entry);
      }
    }
  }

  const paidAftercareByStudent: PaidAftercareByStudent = {};
  for (const tx of transactions) {
    if (
      tx.payment_type === "aftercare_tuition" &&
      tx.status === "completed" &&
      tx.student_id
    ) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const months =
        meta.plan_type === "monthly"
          ? (meta.selected_months?.split(",").filter(Boolean) ?? [])
          : [];
      const days = meta.selected_days?.split(",").filter(Boolean) ?? [];
      if (!paidAftercareByStudent[tx.student_id]) {
        paidAftercareByStudent[tx.student_id] = { months: [], days: [] };
      }
      paidAftercareByStudent[tx.student_id].months.push(...months);
      paidAftercareByStudent[tx.student_id].days.push(...days);
    }
  }

  const paidFunFridayByStudent: PaidFunFridayByStudent = {};
  for (const tx of transactions) {
    if (
      tx.payment_type === "fun_friday_tuition" &&
      tx.status === "completed" &&
      tx.student_id
    ) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const months =
        meta.selected_months?.split(",").filter(Boolean) ?? [];
      const fridays =
        meta.selected_fridays?.split(",").filter(Boolean) ?? [];
      if (!paidFunFridayByStudent[tx.student_id]) {
        paidFunFridayByStudent[tx.student_id] = { months: [], fridays: [] };
      }
      paidFunFridayByStudent[tx.student_id].months.push(...months);
      paidFunFridayByStudent[tx.student_id].fridays.push(...fridays);
    }
  }

  const paidSchoolYearByStudent: PaidSchoolYearByStudent = {};
  for (const tx of transactions) {
    if (tx.payment_type === "school_year_tuition" && tx.status === "completed" && tx.student_id) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const months = meta.selected_months?.split(",").map(Number).filter(Boolean) ?? [];
      if (!paidSchoolYearByStudent[tx.student_id]) {
        paidSchoolYearByStudent[tx.student_id] = [];
      }
      paidSchoolYearByStudent[tx.student_id].push(...months);
    }
  }

  const paidSupplyFeeByStudent: Record<string, boolean> = {};
  for (const tx of transactions) {
    if (tx.payment_type === "supply_fee" && tx.status === "completed" && tx.student_id) {
      paidSupplyFeeByStudent[tx.student_id] = true;
    }
  }

  const summerNotesByStudent: SummerNotesByStudent = {};
  for (const row of notesData ?? []) {
    if (row.student_id && row.note) {
      summerNotesByStudent[row.student_id] = row.note;
    }
  }

  const homeschoolNotesByStudent: HomeschoolNotesByStudent = {};
  for (const row of homeschoolNotesData ?? []) {
    if (row.student_id && row.note) {
      homeschoolNotesByStudent[row.student_id] = row.note;
    }
  }

  const schoolYearOnlyApps: SchoolYearOnlyApp[] = allSummerApps
    .filter((e) => e.program === "school_year_26_27" && e.status === "enrolled")
    .map((e) => ({ id: e.id, student_id: e.student_id!, child_grade: e.child_grade, name: e.child_legal_name }));

  const unpaidSummerEnrollments = summerEnrollments.filter(
    (e) =>
      e.program !== "homeschool_drop_in" &&
      (paidWeeksByStudent[e.student_id]?.length ?? 0) < 12
  );

  const studentIds = [
    ...new Set(
      [
        ...transactions.map((t) => t.student_id),
        ...pendingRequests.map((p) => p.student_id),
        ...summerEnrollments.map((e) => e.student_id),
        ...homeschoolDropInApps.map((e) => e.student_id),
        ...schoolYearOnlyApps.map((e) => e.student_id),
      ].filter(Boolean)
    ),
  ] as string[];

  let studentMap: Record<string, StudentInfo> = {};
  if (studentIds.length > 0) {
    const { data: students } = await adminClient
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, profile_image_url")
      .in("id", studentIds);
    for (const s of students ?? []) {
      if (s.id && s.child_legal_name) {
        studentMap[s.id] = {
          name: s.child_legal_name,
          profileImageUrl: s.profile_image_url ?? null,
        };
      }
    }
  }

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <AdminPreviewBanner parentName={fullName} parentEmail={email} />
      <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={ownerName} />
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[1fr_auto] items-center">
        <div className="flex items-center justify-center">
          <DashboardNav parentId={parentId} />
        </div>
        <ImpersonateNotificationBell parentId={parentId} />
      </header>
      <main className="flex-1 flex overflow-hidden">
        <BillingPage
          transactions={transactions}
          studentMap={studentMap}
          pendingRequests={pendingRequests}
          summerEnrollments={summerEnrollments}
          unpaidSummerEnrollments={unpaidSummerEnrollments}
          paidWeeksByStudent={paidWeeksByStudent}
          parentId={parentId}
          parentEmail={email}
          nonEnrolledApps={nonEnrolledApps}
          homeschoolDropInApps={homeschoolDropInApps}
          paidHomeschoolByStudent={paidHomeschoolByStudent}
          paidAftercareByStudent={paidAftercareByStudent}
          paidFunFridayByStudent={paidFunFridayByStudent}
          summerNotesByStudent={summerNotesByStudent}
          homeschoolNotesByStudent={homeschoolNotesByStudent}
          schoolYearOnlyApps={schoolYearOnlyApps}
          hasSubmittedTuitionFeedback={false}
          paidSchoolYearByStudent={paidSchoolYearByStudent}
          paidSupplyFeeByStudent={paidSupplyFeeByStudent}
        />
      </main>
    </div>
  );
}
