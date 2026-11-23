import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import DashboardHeader from "@/app/parent/dashboard/DashboardHeader";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import ParentCalendarClient from "./ParentCalendarClient";
import ParentHeaderRight from "@/app/parent/components/ParentHeaderRight";

export default async function ParentCalendarPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  // Shared-access grantees see the primary parent's dashboard, so the enrolled check uses the owner.
  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const effectiveParentId = grant?.owner_id ?? user.id;
  const isSharedAccess = !!grant;

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
        "id, title, event_date, is_all_day, start_time, end_time, color, category, shared_with, programs, description, location, recurrence, recurrence_end_date, attachment_links, rsvp_enabled, reminder_email, reminder_in_app, reminder_timing, created_by",
      )
      .contains("shared_with", ["Parents"])
      .order("event_date", { ascending: true }),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("id")
      .eq("user_id", effectiveParentId)
      .eq("status", "enrolled")
      .limit(1),
  ]);

  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;
  const events = eventsData ?? [];

  if ((enrolledCheck ?? []).length === 0) redirect("/parent/dashboard");

  let primaryOwnerName: string | null = null;
  if (isSharedAccess) {
    const { data: ownerUser } = await adminClient.schema("admin").from("users").select("full_name").eq("id", effectiveParentId).single();
    primaryOwnerName = ownerUser?.full_name ?? null;
  }

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
        <ParentHeaderRight userId={user.id} email={user.email ?? ""} fullName={fullName} profileImageUrl={profileImageUrl} />
      </DashboardHeader>

      <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={primaryOwnerName} />

      <main className="flex-1">
        <ParentCalendarClient initialEvents={events} userId={user.id} />
      </main>

      {/* <Footer /> */}
    </div>
  );
}
