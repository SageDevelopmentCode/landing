import { fetchDontIncludeStudentIds } from "@/lib/application-tags";
import type { ParticipationLevel } from "@/lib/participation-level-labels";
import { supabase } from "@/lib/supabase";
import type {
  EmergencySnackPreference,
  SharedFoodPreference,
} from "@/components/SchoolDayFoodPreferencesSheet";

export type StaffSchoolDayFoodPref = {
  studentId: string;
  name: string;
  photo: string | null;
  emergencySnack: EmergencySnackPreference;
  sharedFood: SharedFoodPreference;
  updatedAt: string;
};

export type StaffActivityPrefStudent = {
  studentId: string;
  name: string;
  photo: string | null;
  level: ParticipationLevel;
  notes: string;
  isDefault: boolean;
};

export type StaffActivityPrefGroup = {
  activityId: string;
  students: StaffActivityPrefStudent[];
};

export async function fetchStaffSchoolDayFoodPrefs(): Promise<
  StaffSchoolDayFoodPref[]
> {
  const excludedIds = await fetchDontIncludeStudentIds();

  const { data: prefData, error: prefErr } = await supabase
    .schema("parent_app")
    .from("student_school_day_food_preferences")
    .select(
      "student_id, emergency_snack_preference, shared_food_preference, updated_at",
    );

  if (prefErr) throw prefErr;
  if (!prefData?.length) return [];

  const studentIds = [
    ...new Set(
      prefData
        .map((row) => row.student_id as string)
        .filter((id) => !excludedIds.has(id)),
    ),
  ];
  if (studentIds.length === 0) return [];

  const { data: studentData, error: studentErr } = await supabase
    .schema("admin")
    .from("students")
    .select("id, child_legal_name, profile_image_url")
    .in("id", studentIds)
    .eq("is_deleted", false);

  if (studentErr) throw studentErr;

  const studentMap = new Map(
    (studentData ?? []).map((s) => [
      s.id as string,
      {
        name: s.child_legal_name as string,
        photo: (s.profile_image_url as string | null) ?? null,
      },
    ]),
  );

  const rows: StaffSchoolDayFoodPref[] = [];
  for (const row of prefData) {
    const studentId = row.student_id as string;
    if (excludedIds.has(studentId)) continue;
    const student = studentMap.get(studentId);
    if (!student) continue;
    rows.push({
      studentId,
      name: student.name,
      photo: student.photo,
      emergencySnack: row.emergency_snack_preference as EmergencySnackPreference,
      sharedFood: row.shared_food_preference as SharedFoodPreference,
      updatedAt: row.updated_at as string,
    });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

export async function fetchStaffWeekActivityPrefs(
  activityIds: string[],
): Promise<StaffActivityPrefGroup[]> {
  if (activityIds.length === 0) return [];

  const excludedIds = await fetchDontIncludeStudentIds();

  const { data: prefData, error: prefErr } = await supabase
    .schema("parent_app")
    .from("activity_preferences")
    .select("student_id, activity_id, participation_level, notes")
    .in("activity_id", activityIds);

  if (prefErr) throw prefErr;

  const filteredPrefs = (prefData ?? []).filter(
    (row) => !excludedIds.has(row.student_id as string),
  );

  const explicitByActivity = new Map<
    string,
    {
      student_id: string;
      participation_level: string;
      notes: string;
    }[]
  >();
  for (const row of filteredPrefs) {
    const activityId = row.activity_id as string;
    if (!explicitByActivity.has(activityId)) {
      explicitByActivity.set(activityId, []);
    }
    explicitByActivity.get(activityId)!.push({
      student_id: row.student_id as string,
      participation_level: row.participation_level as string,
      notes: (row.notes as string) ?? "",
    });
  }

  const { data: defaultData, error: defaultErr } = await supabase
    .schema("parent_app")
    .from("student_default_preferences")
    .select("student_id, participation_level");

  if (defaultErr) throw defaultErr;

  const defaultMap = new Map<string, ParticipationLevel>();
  for (const row of defaultData ?? []) {
    const studentId = row.student_id as string;
    if (excludedIds.has(studentId)) continue;
    defaultMap.set(studentId, row.participation_level as ParticipationLevel);
  }

  const allStudentIds = new Set<string>();
  for (const rows of explicitByActivity.values()) {
    for (const row of rows) allStudentIds.add(row.student_id);
  }
  for (const studentId of defaultMap.keys()) {
    allStudentIds.add(studentId);
  }

  if (allStudentIds.size === 0) {
    return activityIds.map((activityId) => ({ activityId, students: [] }));
  }

  const { data: studentData, error: studentErr } = await supabase
    .schema("admin")
    .from("students")
    .select("id, child_legal_name, profile_image_url")
    .in("id", [...allStudentIds])
    .eq("is_deleted", false);

  if (studentErr) throw studentErr;

  const studentMap = new Map(
    (studentData ?? []).map((s) => [
      s.id as string,
      {
        name: s.child_legal_name as string,
        photo: (s.profile_image_url as string | null) ?? null,
      },
    ]),
  );

  return activityIds.map((activityId) => {
    const explicitRows = explicitByActivity.get(activityId) ?? [];
    const explicitStudentIds = new Set(explicitRows.map((r) => r.student_id));

    const students: StaffActivityPrefStudent[] = [];

    for (const row of explicitRows) {
      const student = studentMap.get(row.student_id);
      if (!student) continue;
      students.push({
        studentId: row.student_id,
        name: student.name,
        photo: student.photo,
        level: row.participation_level as ParticipationLevel,
        notes: row.notes,
        isDefault: false,
      });
    }

    for (const [studentId, level] of defaultMap) {
      if (explicitStudentIds.has(studentId)) continue;
      const student = studentMap.get(studentId);
      if (!student) continue;
      students.push({
        studentId,
        name: student.name,
        photo: student.photo,
        level,
        notes: "",
        isDefault: true,
      });
    }

    students.sort((a, b) => a.name.localeCompare(b.name));
    return { activityId, students };
  });
}
