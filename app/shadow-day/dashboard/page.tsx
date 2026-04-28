import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import ShadowDashboardClient from "./ShadowDashboardClient";

export default async function ShadowDayDashboard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/shadow-day/start");
  }

  const adminClient = createAdminClient();

  const [{ data: booking }, { data: adminUser }] = await Promise.all([
    adminClient
      .schema("marketing")
      .from("shadow_day_bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, profile_image_url")
      .eq("id", user.id)
      .single(),
  ]);

  return (
    <ShadowDashboardClient
      booking={booking}
      userEmail={user.email ?? ""}
      userId={user.id}
      fullName={adminUser?.full_name ?? ""}
      profileImageUrl={adminUser?.profile_image_url ?? null}
    />
  );
}
