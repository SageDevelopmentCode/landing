import { createAdminClient } from "@/app/lib/supabase-server";
import { ShadowDayBookingsView } from "../marketing/ShadowDayBookingsView";
import type { ShadowDayBooking } from "../marketing/page";

export default async function ShadowDaysPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .schema("marketing")
    .from("shadow_day_bookings")
    .select("*")
    .order("shadow_date", { ascending: true });

  return <ShadowDayBookingsView bookings={(data as ShadowDayBooking[]) ?? []} />;
}
