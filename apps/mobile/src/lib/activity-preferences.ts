// Keep in sync with shared/parent/activity-preferences.ts (web uses repo-root shared/).

import { supabase } from "@/lib/supabase";
import { notifyDiscord } from "@/lib/discord";

export type ParticipationLevel = "watch" | "cook_no_eat" | "full";

export type ActivityPref = {
  level: ParticipationLevel | null;
  notes: string;
};

export type SavedActivityPref = {
  student_id: string;
  activity_id: string;
  participation_level: ParticipationLevel;
  notes: string;
};

export const LEVEL_OPTIONS: {
  level: ParticipationLevel;
  emoji: string;
  label: string;
}[] = [
  { level: "watch", emoji: "👀", label: "Do not participate, just watch" },
  {
    level: "cook_no_eat",
    emoji: "🧑‍🍳",
    label: "Cook and interact with ingredients but do not consume",
  },
  { level: "full", emoji: "✅", label: "Okay for everything (cooking and eating)" },
];

export const LEVEL_SHORT_LABEL: Record<ParticipationLevel, string> = {
  watch: "Watch",
  cook_no_eat: "Cook",
  full: "Full",
};

export const ALLERGEN_DISCLAIMER =
  "I have reviewed the ingredients and allergens listed above. I understand and acknowledge that Sage Field is not responsible for any allergic reactions, dietary sensitivities, or adverse responses related to food items consumed during activities.";

export function buildInitialPrefsForActivity(
  studentIds: string[],
  savedByStudent: Record<string, ActivityPref>,
  defaultsByStudent: Record<string, ParticipationLevel>,
  savedStudentIds: Set<string>,
): {
  prefs: Record<string, ActivityPref>;
  savedIds: Set<string>;
  snapshots: Record<string, ActivityPref>;
} {
  const prefs: Record<string, ActivityPref> = {};
  for (const studentId of studentIds) {
    if (savedByStudent[studentId]) {
      prefs[studentId] = { ...savedByStudent[studentId] };
    } else if (defaultsByStudent[studentId]) {
      prefs[studentId] = { level: defaultsByStudent[studentId], notes: "" };
    } else {
      prefs[studentId] = { level: null, notes: "" };
    }
  }

  const snapshots: Record<string, ActivityPref> = {};
  for (const studentId of studentIds) {
    snapshots[studentId] = { ...(prefs[studentId] ?? { level: null, notes: "" }) };
  }

  return { prefs, savedIds: new Set(savedStudentIds), snapshots };
}

export type SaveActivityPrefEntry = {
  studentId: string;
  childName: string;
  level: ParticipationLevel | null;
  notes: string;
};

type ActivityRow = { id: string; activity_date: string | null };

export function computeHasUnsetActivityPreference(
  activities: ActivityRow[],
  activityPrefs: { student_id: string; activity_id: string }[],
  defaultPrefStudentIds: Set<string>,
  students: { id: string }[],
  paidSets: Record<string, Set<string>>,
): boolean {
  const prefSet = new Set(
    activityPrefs.map((p) => `${p.student_id}:${p.activity_id}`),
  );

  return activities.some(
    (act) =>
      act.activity_date != null &&
      students.some(
        (s) =>
          paidSets[s.id]?.has(act.activity_date!) &&
          !defaultPrefStudentIds.has(s.id) &&
          !prefSet.has(`${s.id}:${act.id}`),
      ),
  );
}

export function findFirstUnsetActivity(
  activities: ActivityRow[],
  activityPrefs: { student_id: string; activity_id: string }[],
  defaultPrefStudentIds: Set<string>,
  students: { id: string }[],
  paidSets: Record<string, Set<string>>,
): string | null {
  const prefSet = new Set(
    activityPrefs.map((p) => `${p.student_id}:${p.activity_id}`),
  );

  for (const act of activities) {
    if (act.activity_date == null) continue;
    const needsPref = students.some(
      (s) =>
        paidSets[s.id]?.has(act.activity_date!) &&
        !defaultPrefStudentIds.has(s.id) &&
        !prefSet.has(`${s.id}:${act.id}`),
    );
    if (needsPref) return act.id;
  }

  return null;
}

type UserProfile = { full_name: string; email: string };

export async function fetchPreferencesForActivity(
  parentId: string,
  activityId: string,
  studentIds: string[],
): Promise<{
  savedByStudent: Record<string, ActivityPref>;
  defaultsByStudent: Record<string, ParticipationLevel>;
  savedStudentIds: Set<string>;
}> {
  if (studentIds.length === 0) {
    return {
      savedByStudent: {},
      defaultsByStudent: {},
      savedStudentIds: new Set(),
    };
  }

  const [prefsRes, defaultsRes] = await Promise.all([
    supabase
      .schema("parent_app")
      .from("activity_preferences")
      .select("student_id, participation_level, notes")
      .eq("parent_id", parentId)
      .eq("activity_id", activityId)
      .in("student_id", studentIds),
    supabase
      .schema("parent_app")
      .from("student_default_preferences")
      .select("student_id, participation_level")
      .eq("parent_id", parentId)
      .in("student_id", studentIds),
  ]);

  if (prefsRes.error) throw prefsRes.error;
  if (defaultsRes.error) throw defaultsRes.error;

  const savedByStudent: Record<string, ActivityPref> = {};
  const savedStudentIds = new Set<string>();

  for (const row of prefsRes.data ?? []) {
    savedByStudent[row.student_id] = {
      level: row.participation_level as ParticipationLevel,
      notes: row.notes ?? "",
    };
    savedStudentIds.add(row.student_id);
  }

  const defaultsByStudent: Record<string, ParticipationLevel> = {};
  for (const row of defaultsRes.data ?? []) {
    defaultsByStudent[row.student_id] = row.participation_level as ParticipationLevel;
  }

  return { savedByStudent, defaultsByStudent, savedStudentIds };
}

export async function saveActivityPreferencesBatch(
  parentId: string,
  activityId: string,
  activityTitle: string,
  entries: SaveActivityPrefEntry[],
  userProfile: UserProfile | null,
): Promise<void> {
  const toUpsert = entries
    .filter((e) => e.level !== null)
    .map((e) => ({
      parent_id: parentId,
      student_id: e.studentId,
      activity_id: activityId,
      participation_level: e.level!,
      notes: e.notes,
    }));

  const toDeleteStudentIds = entries
    .filter((e) => e.level === null)
    .map((e) => e.studentId);

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .schema("parent_app")
      .from("activity_preferences")
      .upsert(toUpsert, { onConflict: "student_id,activity_id" });
    if (error) throw error;
  }

  if (toDeleteStudentIds.length > 0) {
    const { error } = await supabase
      .schema("parent_app")
      .from("activity_preferences")
      .delete()
      .eq("parent_id", parentId)
      .eq("activity_id", activityId)
      .in("student_id", toDeleteStudentIds);
    if (error) throw error;
  }

  if (toUpsert.length > 0 && userProfile) {
    const byChild = new Map<string, SaveActivityPrefEntry[]>();
    for (const entry of entries.filter((e) => e.level !== null)) {
      const list = byChild.get(entry.studentId) ?? [];
      list.push(entry);
      byChild.set(entry.studentId, list);
    }

    for (const [, childEntries] of byChild) {
      const first = childEntries[0];
      notifyDiscord({
        type: "activity_preferences_saved",
        data: {
          parentName: userProfile.full_name,
          parentEmail: userProfile.email,
          childName: first.childName,
          preferences: childEntries.map((e) => ({
            title: activityTitle,
            level: e.level!,
            notes: e.notes ?? "",
          })),
        },
      });
    }
  }
}
