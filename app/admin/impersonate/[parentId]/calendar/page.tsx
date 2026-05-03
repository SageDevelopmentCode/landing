import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ParentCalendarClient from "@/app/parent/calendar/ParentCalendarClient";

export default async function ImpersonateCalendarPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();

  const [{ data: adminUser }, { data: eventsData }] = await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, email")
      .eq("id", parentId)
      .single(),
    adminClient
      .schema("calendar")
      .from("events")
      .select(
        "id, title, event_date, is_all_day, start_time, end_time, color, category, shared_with, programs, description, location, recurrence, recurrence_end_date, attachment_links, rsvp_enabled, reminder_email, reminder_in_app, reminder_timing"
      )
      .contains("shared_with", ["Parents"])
      .order("event_date", { ascending: true }),
  ]);

  if (!adminUser) notFound();

  const fullName = adminUser.full_name ?? null;
  const email = (adminUser.email as string | null) ?? "";
  const events = eventsData ?? [];

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <AdminPreviewBanner parentName={fullName} parentEmail={email} />
      <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-center">
        <DashboardNav parentId={parentId} />
      </header>
      <main className="flex-1 flex flex-col pointer-events-none select-none">
        <ParentCalendarClient initialEvents={events} />
      </main>
    </div>
  );
}
