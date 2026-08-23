import { supabase } from "@/lib/supabase";

export const PARENT_VISIBLE_TEACHERS = new Set([
  "Sabrina Obnamia",
  "Zelinda Melo",
  "Joy Paige",
]);

export type ParentVisibleTeacher = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
};

export function isParentVisibleTeacher(fullName: string): boolean {
  return PARENT_VISIBLE_TEACHERS.has(fullName);
}

export async function fetchParentVisibleTeachers(): Promise<
  ParentVisibleTeacher[]
> {
  const { data } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .in("role", ["teacher", "super_admin"])
    .order("full_name", { ascending: true });

  return ((data ?? []) as ParentVisibleTeacher[]).filter((t) =>
    isParentVisibleTeacher(t.full_name),
  );
}
