"use server";

import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createActivityPreferencesSavedEmbed,
} from "@/app/lib/discord";
import type {
  ActivityPref,
  ParticipationLevel,
  SaveActivityPrefEntry,
} from "@/shared/parent/activity-preferences";

export type PreferenceEntry = {
  activityId: string;
  level: ParticipationLevel | null;
  notes: string;
};

async function getEffectiveParentId(userId: string) {
  const adminClient = createAdminClient();
  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return grant?.owner_id ?? userId;
}

export async function getActivityPreferencesForActivity(
  activityId: string,
  studentIds: string[],
): Promise<
  | {
      savedByStudent: Record<string, ActivityPref>;
      defaultsByStudent: Record<string, ParticipationLevel>;
      savedStudentIds: string[];
    }
  | { error: string }
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (studentIds.length === 0) {
    return {
      savedByStudent: {},
      defaultsByStudent: {},
      savedStudentIds: [],
    };
  }

  const adminClient = createAdminClient();
  const effectiveParentId = await getEffectiveParentId(user.id);

  const [prefsRes, defaultsRes] = await Promise.all([
    adminClient
      .schema("parent_app")
      .from("activity_preferences")
      .select("student_id, participation_level, notes")
      .eq("parent_id", effectiveParentId)
      .eq("activity_id", activityId)
      .in("student_id", studentIds),
    adminClient
      .schema("parent_app")
      .from("student_default_preferences")
      .select("student_id, participation_level")
      .eq("parent_id", effectiveParentId)
      .in("student_id", studentIds),
  ]);

  if (prefsRes.error) return { error: prefsRes.error.message };
  if (defaultsRes.error) return { error: defaultsRes.error.message };

  const savedByStudent: Record<string, ActivityPref> = {};
  const savedStudentIds: string[] = [];

  for (const row of prefsRes.data ?? []) {
    savedByStudent[row.student_id] = {
      level: row.participation_level as ParticipationLevel,
      notes: row.notes ?? "",
    };
    savedStudentIds.push(row.student_id);
  }

  const defaultsByStudent: Record<string, ParticipationLevel> = {};
  for (const row of defaultsRes.data ?? []) {
    defaultsByStudent[row.student_id] =
      row.participation_level as ParticipationLevel;
  }

  return { savedByStudent, defaultsByStudent, savedStudentIds };
}

export async function saveActivityPreferencesForActivity(
  activityId: string,
  activityTitle: string,
  entries: SaveActivityPrefEntry[],
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const adminClient = createAdminClient();
  const effectiveParentId = await getEffectiveParentId(user.id);

  const toUpsert = entries
    .filter((e) => e.level !== null)
    .map((e) => ({
      parent_id: effectiveParentId,
      student_id: e.studentId,
      activity_id: activityId,
      participation_level: e.level!,
      notes: e.notes,
    }));

  const toDeleteStudentIds = entries
    .filter((e) => e.level === null)
    .map((e) => e.studentId);

  if (toUpsert.length > 0) {
    const { error } = await adminClient
      .schema("parent_app")
      .from("activity_preferences")
      .upsert(toUpsert, { onConflict: "student_id,activity_id" });
    if (error) {
      console.error("saveActivityPreferencesForActivity upsert:", error);
      return { error: error.message };
    }
  }

  if (toDeleteStudentIds.length > 0) {
    const { error } = await adminClient
      .schema("parent_app")
      .from("activity_preferences")
      .delete()
      .eq("parent_id", effectiveParentId)
      .eq("activity_id", activityId)
      .in("student_id", toDeleteStudentIds);
    if (error) {
      console.error("saveActivityPreferencesForActivity delete:", error);
      return { error: error.message };
    }
  }

  if (toUpsert.length > 0) {
    ;(async () => {
      const { data: parentData } = await adminClient
        .schema("admin")
        .from("users")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      const byChild = new Map<string, SaveActivityPrefEntry[]>();
      for (const entry of entries.filter((e) => e.level !== null)) {
        const list = byChild.get(entry.studentId) ?? [];
        list.push(entry);
        byChild.set(entry.studentId, list);
      }

      for (const [, childEntries] of byChild) {
        const first = childEntries[0];
        await sendDiscordNotification(
          createActivityPreferencesSavedEmbed({
            parentName: parentData?.full_name ?? "Unknown",
            parentEmail: (parentData?.email as string | null) ?? "Unknown",
            childName: first.childName,
            preferences: childEntries.map((e) => ({
              title: activityTitle,
              level: e.level!,
              notes: e.notes ?? "",
            })),
          }),
        );
      }
    })().catch(() => {
      /* ignore notification errors */
    });
  }

  return {};
}

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
  const effectiveParentId = await getEffectiveParentId(user.id);

  const toUpsert = entries
    .filter((e) => e.level !== null)
    .map((e) => ({
      parent_id: effectiveParentId,
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
      .eq("parent_id", effectiveParentId)
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
