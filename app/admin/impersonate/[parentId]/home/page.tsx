import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import HomePageClient from "@/app/parent/home/HomePageClient";
import type {
  HomeStudent,
  HomeCheckIn,
  HomeEvent,
  HomePendingPayment,
  HomeReferral,
  StudentMap,
} from "@/app/parent/home/page";

export default async function ImpersonateHomePage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();
  const todayISO = new Date().toISOString().slice(0, 10);

  const [{ data: adminUser }, { data: studentsData }] = await Promise.all([
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
      .order("created_at", { ascending: false })
      .limit(3),
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
        />
      </main>
    </div>
  );
}
