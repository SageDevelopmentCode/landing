"use server";

import { createAdminClient } from "@/app/lib/supabase-server";

export async function updateFreeFridayStatus(id: string, status: string) {
  const supabase = createAdminClient();
  await supabase
    .schema("marketing")
    .from("free_friday_registrations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function updateFreeFridayNotes(id: string, admin_notes: string) {
  const supabase = createAdminClient();
  await supabase
    .schema("marketing")
    .from("free_friday_registrations")
    .update({ admin_notes, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function deleteFreeFridayRegistration(id: string) {
  const supabase = createAdminClient();
  await supabase
    .schema("marketing")
    .from("free_friday_registrations")
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("id", id);
}
