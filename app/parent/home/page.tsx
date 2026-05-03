import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import Footer from "@/app/components/Footer";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import DashboardHeader from "@/app/parent/dashboard/DashboardHeader";
import HomePageClient from "./HomePageClient";
import OnboardingChecklistButton from "@/app/parent/components/OnboardingChecklistButton";

export type HomeStudent = {
  id: string;
  child_legal_name: string;
  child_grade: string | null;
  profile_image_url: string | null;
};

export type HomeCheckIn = {
  id: string;
  student_id: string;
  checked_in_at: string;
};

export type HomeEvent = {
  id: string;
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string;
  category: string | null;
};

export type HomePendingPayment = {
  id: string;
  student_id: string | null;
  program: string;
  label: string;
  amount_cents: number | null;
  created_at: string;
};

export type HomeReferral = {
  id: string;
  referred_email: string | null;
  status: string;
  created_at: string;
};

export type StudentMap = Record<string, { name: string; profileImageUrl: string | null }>;

export default async function ParentHomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const todayISO = new Date().toISOString().slice(0, 10);

  const [{ data: adminUser }, { data: studentsData }, { data: enrolledCheck }] = await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, profile_image_url")
      .eq("id", user.id)
      .single(),
    adminClient
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, child_grade, profile_image_url")
      .eq("parent_id", user.id)
      .eq("is_deleted", false),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "enrolled")
      .limit(1),
  ]);

  const students: HomeStudent[] = (studentsData ?? []) as HomeStudent[];

  if ((enrolledCheck ?? []).length === 0) redirect("/parent/dashboard");
  const studentIds = students.map((s) => s.id);

  const [{ data: checkInsData }, { data: eventsData }, { data: paymentsData }, { data: referralsData }, { data: dropOffData }] =
    await Promise.all([
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
        .select("id, title, event_date, is_all_day, start_time, end_time, color, category")
        .contains("shared_with", ["Parents"])
        .gte("event_date", todayISO)
        .order("event_date", { ascending: true })
        .limit(3),
      adminClient
        .schema("billing")
        .from("pending_payment_requests")
        .select("id, student_id, program, label, amount_cents, created_at")
        .eq("parent_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(3),
      adminClient
        .schema("parent_app")
        .from("referrals")
        .select("id, referred_email, status, created_at")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false }),
      adminClient
        .schema("parent_app")
        .from("dropoff_times")
        .select("slot")
        .eq("parent_id", user.id)
        .maybeSingle(),
    ]);

  const studentMap: StudentMap = {};
  for (const s of students) {
    studentMap[s.id] = {
      name: s.child_legal_name,
      profileImageUrl: s.profile_image_url,
    };
  }

  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;
  const activeCheckIns: HomeCheckIn[] = (checkInsData ?? []) as HomeCheckIn[];
  const upcomingEvents: HomeEvent[] = (eventsData ?? []) as HomeEvent[];
  const pendingPayments: HomePendingPayment[] = (paymentsData ?? []) as HomePendingPayment[];
  const referrals: HomeReferral[] = (referralsData ?? []) as HomeReferral[];
  const savedDropOffSlot: string | null = (dropOffData as { slot: string } | null)?.slot ?? null;

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <DashboardHeader sticky>
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/assets/Logo.png"
              alt="Sage Field"
              width={50}
              height={24}
              className="object-contain"
            />
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <DashboardNav hasEnrolledStudent={(enrolledCheck ?? []).length > 0} />
        </div>
        <div className="flex items-center justify-end gap-1">
          <OnboardingChecklistButton />
          {user?.email && (
            <ProfileDropdown
              email={user.email}
              fullName={fullName}
              userId={user.id}
              profileImageUrl={profileImageUrl}
            />
          )}
        </div>
      </DashboardHeader>

      <main className="flex-1 overflow-y-auto">
        <HomePageClient
          fullName={fullName}
          email={user.email ?? ""}
          userId={user.id}
          students={students}
          activeCheckIns={[]}
          upcomingEvents={upcomingEvents}
          pendingPayments={pendingPayments}
          studentMap={studentMap}
          referrals={referrals}
          savedDropOffSlot={savedDropOffSlot}
        />
      </main>

      <Footer />
    </div>
  );
}
