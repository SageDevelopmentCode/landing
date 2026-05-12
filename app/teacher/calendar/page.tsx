import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import Footer from "@/app/components/Footer";
import TeacherNav from "../dashboard/TeacherNav";
import TeacherNotificationBell from "../components/TeacherNotificationBell";
import TeacherCalendarClient from "./TeacherCalendarClient";

export default async function TeacherCalendarPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  let currentUser: { full_name: string; role: string; id: string } | null =
    null;

  const { data: adminUser } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name, role, profile_image_url")
    .eq("id", user.id)
    .single();

  if (adminUser) {
    currentUser = {
      full_name: adminUser.full_name,
      role: adminUser.role,
      id: user.id,
    };
  }

  const { data: events } = await adminClient
    .schema("calendar")
    .from("events")
    .select(
      "id, title, event_date, is_all_day, start_time, end_time, color, category, shared_with, programs, description, location, recurrence, recurrence_end_date, attachment_links, rsvp_enabled, reminder_email, reminder_in_app, reminder_timing, internal_notes, created_by",
    )
    .or(`shared_with.cs.{"Teachers"},created_by.eq.${user.id}`)
    .order("event_date", { ascending: true });

  const { data: adminUsers } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name");

  const usersMap: Record<string, string> = {};
  for (const u of adminUsers ?? []) {
    usersMap[u.id] = u.full_name;
  }

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[auto_1fr_auto] items-center">
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
          <TeacherNav />
        </div>
        <div className="flex items-center justify-end gap-2">
          <TeacherNotificationBell userId={user.id} />
          {user?.email && (
            <ProfileDropdown
              email={user.email}
              fullName={currentUser?.full_name ?? null}
              userId={user.id}
              profileImageUrl={adminUser?.profile_image_url ?? null}
            />
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <TeacherCalendarClient
          currentUser={currentUser}
          initialEvents={events ?? []}
          usersMap={usersMap}
        />
      </main>

      {/* <Footer /> */}
    </div>
  );
}
