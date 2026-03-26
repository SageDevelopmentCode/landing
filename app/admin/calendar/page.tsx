import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUser: { full_name: string; role: string; id: string } | null = null;

  if (user) {
    const { data } = await createAdminClient()
      .schema("admin")
      .from("users")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    if (data) {
      currentUser = { full_name: data.full_name, role: data.role, id: user.id };
    }
  }

  const { data: events } = await createAdminClient()
    .schema("calendar")
    .from("events")
    .select("id, title, event_date, is_all_day, start_time, end_time, color, category")
    .order("event_date", { ascending: true });

  return <CalendarClient currentUser={currentUser} initialEvents={events ?? []} />;
}
