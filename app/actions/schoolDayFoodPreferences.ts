"use server";

import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createSchoolDayFoodPreferencesSavedEmbed,
} from "@/app/lib/discord";

export type EmergencySnackPreference =
  | "always_allow"
  | "ask_permission"
  | "approved_only";

export type SharedFoodPreference =
  | "always_allow"
  | "ask_each_time"
  | "do_not_offer";

const EMERGENCY_SNACK_VALUES: EmergencySnackPreference[] = [
  "always_allow",
  "ask_permission",
  "approved_only",
];

const SHARED_FOOD_VALUES: SharedFoodPreference[] = [
  "always_allow",
  "ask_each_time",
  "do_not_offer",
];

export async function saveSchoolDayFoodPreferences(
  studentId: string,
  prefs: {
    emergencySnack: EmergencySnackPreference;
    sharedFood: SharedFoodPreference;
  },
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (
    !EMERGENCY_SNACK_VALUES.includes(prefs.emergencySnack) ||
    !SHARED_FOOD_VALUES.includes(prefs.sharedFood)
  ) {
    return { error: "Invalid preference values" };
  }

  const adminClient = createAdminClient();

  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const effectiveParentId = grant?.owner_id ?? user.id;

  const { data: student } = await adminClient
    .schema("admin")
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("parent_id", effectiveParentId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (!student) {
    return { error: "Student not found" };
  }

  const { error } = await adminClient
    .schema("parent_app")
    .from("student_school_day_food_preferences")
    .upsert(
      {
        parent_id: effectiveParentId,
        student_id: studentId,
        emergency_snack_preference: prefs.emergencySnack,
        shared_food_preference: prefs.sharedFood,
      },
      { onConflict: "parent_id,student_id" },
    );

  if (error) {
    console.error("saveSchoolDayFoodPreferences upsert:", error);
    return { error: error.message };
  }

  // Fire-and-forget Discord notification
  ;(async () => {
    const [{ data: parentData }, { data: childData }] = await Promise.all([
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
    ]);

    await sendDiscordNotification(
      createSchoolDayFoodPreferencesSavedEmbed({
        parentName: parentData?.full_name ?? "Unknown",
        parentEmail: (parentData?.email as string | null) ?? "Unknown",
        childName: childData?.child_legal_name ?? "Unknown",
        emergencySnack: prefs.emergencySnack,
        sharedFood: prefs.sharedFood,
      }),
    );
  })().catch(() => {
    /* ignore notification errors */
  });

  return {};
}
