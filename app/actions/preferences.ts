"use server";

import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createActivityPreferencesSavedEmbed,
} from "@/app/lib/discord";

type ParticipationLevel = "watch" | "cook_no_eat" | "full";

export type PreferenceEntry = {
  activityId: string;
  level: ParticipationLevel | null;
  notes: string;
};

export async function saveActivityPreferences(
  studentId: string,
  entries: PreferenceEntry[]
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();

  const toUpsert = entries
    .filter((e) => e.level !== null)
    .map((e) => ({
      parent_id: user.id,
      student_id: studentId,
      activity_id: e.activityId,
      participation_level: e.level!,
      notes: e.notes,
    }));

  const toDeleteIds = entries
    .filter((e) => e.level === null)
    .map((e) => e.activityId);

  if (toUpsert.length > 0) {
    const { error } = await adminClient
      .schema("parent_app")
      .from("activity_preferences")
      .upsert(toUpsert, { onConflict: "student_id,activity_id" });
    if (error) {
      console.error("saveActivityPreferences upsert:", error);
      return { error: error.message };
    }
  }

  if (toDeleteIds.length > 0) {
    const { error } = await adminClient
      .schema("parent_app")
      .from("activity_preferences")
      .delete()
      .eq("parent_id", user.id)
      .eq("student_id", studentId)
      .in("activity_id", toDeleteIds);
    if (error) {
      console.error("saveActivityPreferences delete:", error);
      return { error: error.message };
    }
  }

  // Fire-and-forget Discord notification
  ;(async () => {
    const setEntries = entries.filter((e) => e.level !== null);
    const [{ data: parentData }, { data: childData }, { data: activityRows }] =
      await Promise.all([
        adminClient
          .schema("admin")
          .from("users")
          .select("full_name, email")
          .eq("id", user.id)
          .single(),
        adminClient
          .schema("admin")
          .from("students")
          .select("child_legal_name")
          .eq("id", studentId)
          .single(),
        adminClient
          .schema("teachers")
          .from("activities")
          .select("id, title")
          .in("id", setEntries.map((e) => e.activityId)),
      ]);

    const titleMap = Object.fromEntries(
      (activityRows ?? []).map((a) => [a.id, a.title])
    );
    const preferences = setEntries.map((e) => ({
      title: titleMap[e.activityId] ?? "Unknown Activity",
      level: e.level!,
      notes: e.notes,
    }));

    await sendDiscordNotification(
      createActivityPreferencesSavedEmbed({
        parentName: parentData?.full_name ?? "Unknown",
        parentEmail: (parentData?.email as string | null) ?? "Unknown",
        childName: childData?.child_legal_name ?? "Unknown",
        preferences,
      })
    );
  })().catch(() => { /* ignore notification errors */ });

  return {};
}
