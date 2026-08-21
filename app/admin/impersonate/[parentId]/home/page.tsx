import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import { resolveEffectiveParentId } from "../../resolveEffectiveParentId";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import { getPublishedActivities } from "@/app/actions/activities";
import { computePaidDates } from "@/app/lib/compute-paid-dates";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ImpersonateNotificationBell from "../../ImpersonateNotificationBell";
import { getConferenceTeacherAssignments } from "@/app/lib/get-conference-teacher-assignments";
import { getConferenceBookings } from "@/app/lib/get-conference-bookings";
import HomePageClient from "@/app/parent/home/HomePageClient";
import { computeHasUnsetActivityPreference } from "@/shared/parent/activity-preferences";
import { getOnboardingProgressForParent } from "@/app/actions/getOnboardingProgress";
import type {
  HomeStudent,
  HomeCheckIn,
  HomeEvent,
  HomePendingPayment,
  HomeReferral,
  StudentMap,
  PaidHomeschoolByStudent,
  PaidAftercareByStudent,
  PaidFunFridayByStudent,
  SummerEnrollment,
  HomeschoolDropInApp,
  SchoolYearOnlyApp,
  PaidSchoolYearByStudent,
} from "@/app/parent/home/page";
import type { StripeTransaction } from "@/app/parent/billing/page";

export default async function ImpersonateHomePage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();
  const { effectiveParentId, isSharedAccess, ownerName } = await resolveEffectiveParentId(parentId);
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
      .eq("parent_id", effectiveParentId)
      .eq("is_deleted", false),
    getOnboardingProgressForParent(effectiveParentId),
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
    { data: prefsData },
    { data: defaultPrefsData },
    publishedActivities,
    { data: testimonialData },
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
      .eq("parent_id", effectiveParentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    adminClient
      .schema("parent_app")
      .from("referrals")
      .select("id, referred_email, status, created_at")
      .eq("referrer_id", effectiveParentId)
      .order("created_at", { ascending: false }),
    adminClient
      .schema("parent_app")
      .from("dropoff_times")
      .select("slot")
      .eq("parent_id", effectiveParentId)
      .maybeSingle(),
    adminClient
      .schema("billing")
      .from("stripe_transactions")
      .select("payment_type, status, student_id, metadata, amount_cents, created_at")
      .eq("parent_id", effectiveParentId)
      .eq("is_deleted", false),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("id, student_id, child_grade, status, child_legal_name, program, drop_in_program")
      .eq("user_id", effectiveParentId)
      .eq("approved", true)
      .in("program", ["summer_26", "both", "homeschool_drop_in", "school_year_26_27"]),
    adminClient
      .schema("parent_app")
      .from("activity_preferences")
      .select("student_id, activity_id")
      .eq("parent_id", effectiveParentId),
    adminClient
      .schema("parent_app")
      .from("student_default_preferences")
      .select("student_id")
      .eq("parent_id", effectiveParentId),
    getPublishedActivities(),
    adminClient
      .schema("marketing")
      .from("testimonials")
      .select("id")
      .eq("parent_id", effectiveParentId)
      .eq("is_deleted", false)
      .limit(1)
      .maybeSingle(),
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

  const paidSets = computePaidDates(transactions);
  const activityPrefs = (prefsData ?? []) as { student_id: string; activity_id: string }[];
  const defaultPrefStudentIds = new Set(
    (defaultPrefsData ?? []).map((d: { student_id: string }) => d.student_id),
  );
  const paidDateSets: Record<string, string[]> = {};
  for (const [studentId, dates] of Object.entries(paidSets)) {
    paidDateSets[studentId] = Array.from(dates);
  }

  const hasActivityForPaidDay = computeHasUnsetActivityPreference(
    publishedActivities.map((a) => ({ id: a.id, activity_date: a.activity_date })),
    activityPrefs,
    defaultPrefStudentIds,
    students,
    paidSets,
  );

  const upcomingActivities = publishedActivities
    .filter((a) => a.activity_date != null && a.activity_date >= todayISO)
    .sort((a, b) => (a.activity_date ?? "").localeCompare(b.activity_date ?? ""));

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

  const schoolYearOnlyApps: SchoolYearOnlyApp[] = allSummerApps
    .filter((e) => e.program === "school_year_26_27" && e.status === "enrolled")
    .map((e) => ({
      id: e.id,
      student_id: e.student_id!,
      child_grade: e.child_grade,
      name: e.child_legal_name,
    }));

  const paidHomeschoolByStudent: PaidHomeschoolByStudent = {};
  for (const tx of transactions) {
    if (tx.payment_type === "homeschool_dropin" && tx.status === "completed" && tx.student_id) {
      const meta = (tx.metadata ?? {}) as Record<string, string>;
      const program = meta.program ?? "summer_26";
      const tier = meta.tier ?? "dropin";
      const days = meta.selected_days?.split(",").filter(Boolean) ?? [];
      const weeks = meta.selected_weeks?.split(",").map(Number).filter(Boolean) ?? [];
      const weekDays: Record<number, string[]> = {};
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

  const checklistComplete = onboardingCompletedIds.length >= 8;
  const hasSubmittedTestimonial = !!testimonialData;

  const { conferenceTeachers, conferenceStudents } =
    await getConferenceTeacherAssignments(students);

  const { bookingsByStudentId, takenSlotKeys } = await getConferenceBookings(
    parentId,
  );

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
      <main className="flex-1 overflow-y-auto pointer-events-none select-none">
        <HomePageClient
          fullName={fullName}
          email={email}
          userId={parentId}
          parentId={parentId}
          students={students}
          activeCheckIns={activeCheckIns}
          upcomingEvents={upcomingEvents}
          pendingPayments={pendingPayments}
          studentMap={studentMap}
          referrals={referrals}
          savedDropOffSlot={savedDropOffSlot}
          summerEnrollments={summerEnrollments}
          schoolYearOnlyApps={schoolYearOnlyApps}
          homeschoolDropInApps={homeschoolDropInApps}
          paidHomeschoolByStudent={paidHomeschoolByStudent}
          paidAftercareByStudent={paidAftercareByStudent}
          paidFunFridayByStudent={paidFunFridayByStudent}
          paidSchoolYearByStudent={paidSchoolYearByStudent}
          paidSupplyFeeByStudent={paidSupplyFeeByStudent}
          checklistComplete={checklistComplete}
          initialCompletedIds={onboardingCompletedIds}
          checklistInteractive
          actionNeededInteractive
          readOnlyPreview
          suppressReferralPopup
          hasActivityForPaidDay={hasActivityForPaidDay}
          upcomingActivities={upcomingActivities}
          activityPrefs={activityPrefs}
          defaultPrefStudentIds={Array.from(defaultPrefStudentIds)}
          paidDateSets={paidDateSets}
          publishedActivitiesForBanner={publishedActivities.map((a) => ({
            id: a.id,
            activity_date: a.activity_date,
          }))}
          hasSubmittedTestimonial={hasSubmittedTestimonial}
          conferenceTeachers={conferenceTeachers}
          conferenceStudents={conferenceStudents}
          conferenceBookingsByStudent={bookingsByStudentId}
          conferenceTakenSlotKeys={takenSlotKeys}
        />
      </main>
    </div>
  );
}
