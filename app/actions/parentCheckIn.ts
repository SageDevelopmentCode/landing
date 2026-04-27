"use server";

import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";

export async function parentCheckIn(studentId: string): Promise<{
  id: string;
  student_id: string;
  checked_in_at: string;
} | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminClient = createAdminClient();

  // Verify student belongs to this parent
  const { data: student } = await adminClient
    .schema("admin")
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("parent_id", user.id)
    .eq("is_deleted", false)
    .single();

  if (!student) return null;

  const { data } = await adminClient
    .schema("attendance")
    .from("check_ins")
    .insert({ student_id: studentId, checked_in_by: user.id })
    .select("id, student_id, checked_in_at")
    .single();

  return data ?? null;
}
