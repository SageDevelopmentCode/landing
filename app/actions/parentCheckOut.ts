"use server";

import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";

export async function parentCheckOut(checkInId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .schema("attendance")
    .from("check_ins")
    .update({ checked_out_at: new Date().toISOString() })
    .eq("id", checkInId)
    .eq("is_deleted", false);

  return !error;
}
