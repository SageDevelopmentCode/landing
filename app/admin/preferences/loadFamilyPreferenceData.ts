import { createAdminClient } from "@/app/lib/supabase-server";
import { getPublishedActivities } from "@/app/actions/activities";
import { computePaidDates } from "@/app/lib/compute-paid-dates";
import type { Activity } from "@/app/actions/activities";

export type PreferenceChild = {
  id: string;
  child_legal_name: string;
  profile_image_url: string | null;
};

export type SavedPreference = {
  student_id: string;
  activity_id: string;
  participation_level: "watch" | "cook_no_eat" | "full";
  notes: string;
};

export type StudentDefaultPreference = {
  student_id: string;
  participation_level: "watch" | "cook_no_eat" | "full";
};

export type SchoolDayFoodPreference = {
  student_id: string;
  emergency_snack_preference: "always_allow" | "ask_permission" | "approved_only";
  shared_food_preference: "always_allow" | "ask_each_time" | "do_not_offer";
};

export type FamilyPreferenceData = {
  children: PreferenceChild[];
  activities: Activity[];
  paidDatesByStudent: Record<string, string[]>;
  savedPreferences: SavedPreference[];
  studentDefaults: StudentDefaultPreference[];
  schoolDayFoodPreferences: SchoolDayFoodPreference[];
};

export type EnrolledFamilyRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  children: { id: string; name: string }[];
};

export async function loadEnrolledFamilies(): Promise<EnrolledFamilyRow[]> {
  const adminClient = createAdminClient();

  const [{ data: enrolledApps }, { data: allStudents }, { data: allParents }] =
    await Promise.all([
      adminClient
        .schema("parent_app")
        .from("applications")
        .select("student_id")
        .eq("status", "enrolled"),
      adminClient
        .schema("admin")
        .from("students")
        .select("id, child_legal_name, parent_id")
        .eq("is_deleted", false),
      adminClient
        .schema("admin")
        .from("users")
        .select("id, full_name, email")
        .eq("role", "parent")
        .eq("is_deleted", false),
    ]);

  const enrolledIds = new Set(
    (enrolledApps ?? []).map((a) => a.student_id).filter(Boolean),
  );

  const parentMap = new Map(
    (allParents ?? []).map((p) => [
      p.id,
      { full_name: p.full_name, email: p.email as string | null },
    ]),
  );

  const familiesByParent = new Map<
    string,
    { id: string; name: string }[]
  >();

  for (const student of allStudents ?? []) {
    if (!enrolledIds.has(student.id)) continue;
    const list = familiesByParent.get(student.parent_id) ?? [];
    list.push({
      id: student.id,
      name: student.child_legal_name ?? "Unknown",
    });
    familiesByParent.set(student.parent_id, list);
  }

  const rows: EnrolledFamilyRow[] = [];
  for (const [parentId, children] of familiesByParent) {
    const parent = parentMap.get(parentId);
    rows.push({
      id: parentId,
      full_name: parent?.full_name ?? null,
      email: parent?.email ?? null,
      children: children.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return rows.sort((a, b) =>
    (a.full_name ?? a.email ?? "").localeCompare(b.full_name ?? b.email ?? ""),
  );
}

export async function loadFamilyPreferenceData(
  effectiveParentId: string,
): Promise<FamilyPreferenceData> {
  const adminClient = createAdminClient();

  const [
    { data: studentsData },
    { data: txData },
    { data: savedPrefsData },
    activities,
    { data: studentDefaultsData },
    { data: schoolDayFoodPrefsData },
  ] = await Promise.all([
    adminClient
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, profile_image_url")
      .eq("parent_id", effectiveParentId)
      .eq("is_deleted", false),
    adminClient
      .schema("billing")
      .from("stripe_transactions")
      .select("payment_type, status, student_id, metadata")
      .eq("parent_id", effectiveParentId)
      .eq("is_deleted", false),
    adminClient
      .schema("parent_app")
      .from("activity_preferences")
      .select("student_id, activity_id, participation_level, notes")
      .eq("parent_id", effectiveParentId),
    getPublishedActivities(),
    adminClient
      .schema("parent_app")
      .from("student_default_preferences")
      .select("student_id, participation_level")
      .eq("parent_id", effectiveParentId),
    adminClient
      .schema("parent_app")
      .from("student_school_day_food_preferences")
      .select("student_id, emergency_snack_preference, shared_food_preference")
      .eq("parent_id", effectiveParentId),
  ]);

  const children: PreferenceChild[] = (studentsData ?? []) as PreferenceChild[];

  const paidSets = computePaidDates(txData ?? []);
  const paidDatesByStudent: Record<string, string[]> = {};
  for (const [id, set] of Object.entries(paidSets)) {
    paidDatesByStudent[id] = Array.from(set);
  }

  return {
    children,
    activities,
    paidDatesByStudent,
    savedPreferences: (savedPrefsData ?? []) as SavedPreference[],
    studentDefaults: (studentDefaultsData ?? []) as StudentDefaultPreference[],
    schoolDayFoodPreferences: (schoolDayFoodPrefsData ??
      []) as SchoolDayFoodPreference[],
  };
}
