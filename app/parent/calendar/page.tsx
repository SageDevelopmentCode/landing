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
import ParentCalendarClient from "./ParentCalendarClient";
import OnboardingChecklistButton from "@/app/parent/components/OnboardingChecklistButton";

export default async function ParentCalendarPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  const [{ data: adminUser }, { data: eventsData }, { data: enrolledCheck }] = await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, profile_image_url")
      .eq("id", user.id)
      .single(),
    adminClient
      .schema("calendar")
      .from("events")
      .select(
        "id, title, event_date, is_all_day, start_time, end_time, color, category, shared_with, programs, description, location, recurrence, recurrence_end_date, attachment_links, rsvp_enabled, reminder_email, reminder_in_app, reminder_timing",
      )
      .contains("shared_with", ["Parents"])
      .order("event_date", { ascending: true }),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "enrolled")
      .limit(1),
  ]);

  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;
  const events = eventsData ?? [];

  if ((enrolledCheck ?? []).length === 0) redirect("/parent/dashboard");

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
            <ProfileDropdown email={user.email} fullName={fullName} userId={user.id} profileImageUrl={profileImageUrl} />
          )}
        </div>
      </DashboardHeader>

      <main className="flex-1 flex flex-col">
        <ParentCalendarClient initialEvents={events} />
      </main>

      {/* <Footer /> */}
    </div>
  );
}
