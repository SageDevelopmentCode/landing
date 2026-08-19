import { supabase } from "@/lib/supabase";

export const DONT_INCLUDE_TAG = "Don't Include";

export function studentHasDontIncludeTag(adminTags: string[] | null): boolean {
  return (adminTags ?? []).includes(DONT_INCLUDE_TAG);
}

export async function fetchDontIncludeStudentIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .schema("parent_app")
    .from("applications")
    .select("student_id, admin_tags")
    .eq("status", "enrolled");

  if (error) throw error;

  return new Set(
    (data ?? [])
      .filter((a) => studentHasDontIncludeTag(a.admin_tags))
      .map((a) => a.student_id),
  );
}
