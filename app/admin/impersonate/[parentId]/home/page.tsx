import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import HomePageClient from "@/app/parent/home/HomePageClient";
import { getOnboardingProgressForParent } from "@/app/actions/getOnboardingProgress";
import type {
  HomeStudent,
  HomeCheckIn,
  HomeEvent,
  HomePendingPayment,
  HomeReferral,
  StudentMap,
  PaidWeeksByStudent,
  PaidHomeschoolByStudent,
  PaidAftercareByStudent,
  PaidFunFridayByStudent,
  SummerEnrollment,
  HomeschoolDropInApp,
} from "@/app/parent/home/page";
import type { StripeTransaction } from "@/app/parent/billing/page";

export default async function ImpersonateHomePage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();
  const todayISO = new Date().toISOString().slice(0, 10);

  const [{ data: adminUser }, { data: studentsData }, onboardingCompletedIds] =
    await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, email, profile_image_url")
      .eq("id", parentId)
      .single(),
    adminClient
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, child_grade, profile_image_url")
      .eq("parent_id", parentId)
      .eq("is_deleted", false),
    getOnboardingProgressForParent(parentId),
  ]);

  if (!adminUser) notFound();

  const fullName = adminUser.full_name ?? null;
  const email = (adminUser.email as string | null) ?? "";
  const students: HomeStudent[] = (studentsData ?? []) as HomeStudent[];
  const studentIds = students.map((s) => s.id);

  const [
    { data: checkInsData },
    { data: eventsData },
    { data: paymentsData },
    { data: referralsData },
    { data: dropOffData },
    { data: txData },
    { data: summerData },
  ] = await Promise.all([
    studentIds.length > 0
      ? adminClient
          .schema("attendance")
          .from("check_ins")
          .select("id, student_id, checked_in_at")
          .in("student_id", studentIds)
          .is("checked_out_at", null)
          .eq("is_deleted", false)
          .gte("checked_in_at", `${todayISO}T00:00:00`)
          .lte("checked_in_at", `${todayISO}T23:59:59`)
      : Promise.resolve({ data: [], error: null }),
    adminClient
      .schema("calendar")
      .from("events")
      .select(
        "id, title, event_date, is_all_day, start_time, end_time, color, category"
      )
      .contains("shared_with", ["Parents"])
      .gte("event_date", todayISO)
      .order("event_date", { ascending: true })
      .limit(3),
    adminClient
      .schema("billing")
      .from("pending_payment_requests")
      .select("id, student_id, program, label, amount_cents, created_at")
      .eq("parent_id", parentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    adminClient
      .schema("parent_app")
      .from("referrals")
      .select("id, referred_email, status, created_at")
      .eq("referrer_id", parentId)
      .order("created_at", { ascending: false }),
    adminClient
      .schema("parent_app")
      .from("dropoff_times")
      .select("slot")
      .eq("parent_id", parentId)
      .maybeSingle(),
    adminClient
      .schema("billing")
      .from("stripe_transactions")
      .select("payment_type, status, student_id, metadata, amount_cents, created_at")
      .eq("parent_id", parentId)
      .eq("is_deleted", false),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("id, student_id, child_grade, status, child_legal_name, program, drop_in_program")
      .eq("user_id", parentId)
      .eq("approved", true)
      .in("program", ["summer_26", "both", "homeschool_drop_in"]),
  ]);

  const studentMap: StudentMap = {};
  for (const s of students) {
    studentMap[s.id] = {
      name: s.child_legal_name,
      profileImageUrl: s.profile_image_url,
    };
  }

  const activeCheckIns: HomeCheckIn[] = (checkInsData ?? []) as HomeCheckIn[];
  const upcomingEvents: HomeEvent[] = (eventsData ?? []) as HomeEvent[];
  const pendingPayments: HomePendingPayment[] =
    (paymentsData ?? []) as HomePendingPayment[];
  const referrals: HomeReferral[] = (referralsData ?? []) as HomeReferral[];
  const savedDropOffSlot: string | null =
    (dropOffData as { slot: string } | null)?.slot ?? null;

  const transactions = (txData ?? []) as StripeTransaction[];

  const allSummerApps = ((summerData ?? []) as {
    id: string;
    student_id: string | null;
    child_grade: string | null;
    status: string | null;
    child_legal_name: string | null;
    program: string | null;
    drop_in_program: string | null;
  }[]).filter((e) => !!e.student_id && !!e.id);

  const summerEnrollments: SummerEnrollment[] = allSummerApps
    .filter((e) => e.status === "enrolled")
    .map((e) => ({ id: e.id, student_id: e.student_id!, child_grade: e.child_grade, program: e.program ?? null }));

  const homeschoolDropInApps: HomeschoolDropInApp[] = allSummerApps
    .filter((e) => e.program === "homeschool_drop_in" && e.status === "enrolled")
    .map((e) => ({
      id: e.id,
      student_id: e.student_id!,
      drop_in_program: e.drop_in_program,
      child_grade: e.child_grade,
      name: e.child_legal_name,
    }));

  const paidWeeksByStudent: PaidWeeksByStudent = {};
  for (const tx of transactions) {
    if (tx.payment_type === "summer_tuition" && tx.status === "completed" && tx.student_id) {
      const planType = (tx.metadata as Record<string, string>)?.plan_type;
      const weeksStr = (tx.metadata as Record<string, string>)?.weeks ?? "";
      if (planType === "full") {
        paidWeeksByStudent[tx.student_id] = Array.from({ length: 12 }, (_, i) => i + 1);
      } else {
        const weeks = weeksStr.split(",").map(Number).filter(Boolean);
        paidWeeksByStudent[tx.student_id] = [
          ...(paidWeeksByStudent[tx.student_id] ?? []),
          ...weeks,
        ];
      }
    }
  }

  const paidHomeschoolByStudent: PaidHomeschoolByStudent = {};
  for (const tx of transactions) {
    if (tx.payment_type === "homeschool_dropin" && tx.status === "completed" && tx.student_id) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const program = meta.program ?? "summer_26";
      const tier = meta.tier ?? "dropin";
      const days = meta.selected_days?.split(",").filter(Boolean) ?? [];
      const weeks = meta.selected_weeks?.split(",").map(Number).filter(Boolean) ?? [];
      let weekDays: Record<number, string[]> = {};
      if (meta.week_selections) {
        try {
          const parsed: { week: number; days: string[] }[] = JSON.parse(meta.week_selections);
          parsed.forEach(({ week, days: d }) => { weekDays[week] = d; });
        } catch { /* fall through */ }
      }
      if (Object.keys(weekDays).length === 0) {
        weeks.forEach((w) => { weekDays[w] = days; });
      }
      if (!paidHomeschoolByStudent[tx.student_id]) {
        paidHomeschoolByStudent[tx.student_id] = { summer: [], schoolYear: [] };
      }
      const entry = { weeks, tier, days, weekDays, amountCents: tx.amount_cents, createdAt: tx.created_at };
      if (program === "summer_26") {
        paidHomeschoolByStudent[tx.student_id].summer.push(entry);
      } else {
        paidHomeschoolByStudent[tx.student_id].schoolYear.push(entry);
      }
    }
  }

  const paidAftercareByStudent: PaidAftercareByStudent = {};
  for (const tx of transactions) {
    if (tx.payment_type === "aftercare_tuition" && tx.status === "completed" && tx.student_id) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const months = meta.selected_months?.split(",").filter(Boolean) ?? [];
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
    if (tx.payment_type === "fun_friday_tuition" && tx.status === "completed" && tx.student_id) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const months = meta.selected_months?.split(",").filter(Boolean) ?? [];
      const fridays = meta.selected_fridays?.split(",").filter(Boolean) ?? [];
      if (!paidFunFridayByStudent[tx.student_id]) {
        paidFunFridayByStudent[tx.student_id] = { months: [], fridays: [] };
      }
      paidFunFridayByStudent[tx.student_id].months.push(...months);
      paidFunFridayByStudent[tx.student_id].fridays.push(...fridays);
    }
  }

  const checklistComplete = onboardingCompletedIds.length >= 8;

  const unpaidSummerEnrollments = summerEnrollments.filter(
    (e) => e.program !== "homeschool_drop_in" && (paidWeeksByStudent[e.student_id]?.length ?? 0) < 12
  );

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <AdminPreviewBanner parentName={fullName} parentEmail={email} />
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-center">
        <DashboardNav parentId={parentId} />
      </header>
      <main className="flex-1 overflow-y-auto pointer-events-none select-none">
        <HomePageClient
          fullName={fullName}
          email={email}
          userId={parentId}
          students={students}
          activeCheckIns={activeCheckIns}
          upcomingEvents={upcomingEvents}
          pendingPayments={pendingPayments}
          studentMap={studentMap}
          referrals={referrals}
          savedDropOffSlot={savedDropOffSlot}
          summerEnrollments={summerEnrollments}
          unpaidSummerEnrollments={unpaidSummerEnrollments}
          paidWeeksByStudent={paidWeeksByStudent}
          homeschoolDropInApps={homeschoolDropInApps}
          paidHomeschoolByStudent={paidHomeschoolByStudent}
          paidAftercareByStudent={paidAftercareByStudent}
          paidFunFridayByStudent={paidFunFridayByStudent}
          checklistComplete={checklistComplete}
          initialCompletedIds={onboardingCompletedIds}
          checklistInteractive
          generalChannelMessages={[]}
        />
      </main>
    </div>
  );
}
