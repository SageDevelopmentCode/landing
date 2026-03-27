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
import ParentCalendarClient from "./ParentCalendarClient";

export default async function ParentCalendarPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  const [{ data: adminUser }, { data: eventsData }] = await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name")
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
  ]);

  const fullName = adminUser?.full_name ?? null;
  const events = eventsData ?? [];

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-3 items-center">
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
          <DashboardNav />
        </div>
        <div className="flex items-center justify-end">
          {user?.email && (
            <ProfileDropdown email={user.email} fullName={fullName} />
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <ParentCalendarClient initialEvents={events} />
      </main>

      {/* <Footer /> */}
    </div>
  );
}
