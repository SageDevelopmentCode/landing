"use server";

import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server";
import { sendDiscordNotification, createDefaultPreferenceSetEmbed } from "@/app/lib/discord";

type ParticipationLevel = "watch" | "cook_no_eat" | "full";

export type StudentDefaultPreference = {
  student_id: string;
  participation_level: ParticipationLevel;
};

export async function saveStudentDefaultPreference(
  studentId: string,
  level: ParticipationLevel | null
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();

  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const effectiveParentId = grant?.owner_id ?? user.id;

  if (level !== null) {
    const { error } = await adminClient
      .schema("parent_app")
      .from("student_default_preferences")
      .upsert(
        { parent_id: effectiveParentId, student_id: studentId, participation_level: level },
        { onConflict: "parent_id,student_id" }
      );
    if (error) {
      console.error("saveStudentDefaultPreference upsert:", error);
      return { error: error.message };
    }
  } else {
    const { error } = await adminClient
      .schema("parent_app")
      .from("student_default_preferences")
      .delete()
      .eq("parent_id", effectiveParentId)
      .eq("student_id", studentId);
    if (error) {
      console.error("saveStudentDefaultPreference delete:", error);
      return { error: error.message };
    }
  }

  // Fire-and-forget Discord notification
  ;(async () => {
    const [{ data: parentData }, { data: childData }] = await Promise.all([
      adminClient.schema("admin").from("users").select("full_name, email").eq("id", user.id).single(),
      adminClient.schema("admin").from("students").select("child_legal_name").eq("id", studentId).single(),
    ]);

    await sendDiscordNotification(
      createDefaultPreferenceSetEmbed({
        parentName: parentData?.full_name ?? "Unknown",
        parentEmail: (parentData?.email as string | null) ?? "Unknown",
        childName: childData?.child_legal_name ?? "Unknown",
        level,
      })
    );
  })().catch(() => { /* ignore notification errors */ });

  return {};
}
