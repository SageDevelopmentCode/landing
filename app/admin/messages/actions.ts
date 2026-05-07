"use server";

import { createAdminClient } from "@/app/lib/supabase-server";

export type ChildInfo = {
  id: string;
  child_legal_name: string | null;
  child_grade: string | null;
  program: string | null;
  drop_in_program: string | null;
  profile_image_url: string | null;
};

export async function getStudentsByParentId(parentId: string): Promise<ChildInfo[]> {
  const client = createAdminClient();

  const { data: students } = await client
    .schema("admin")
    .from("students")
    .select("id, child_legal_name, child_grade, profile_image_url")
    .eq("parent_id", parentId)
    .eq("is_deleted", false);

  if (!students || students.length === 0) return [];

  const studentIds = students.map((s) => s.id);

  const { data: apps } = await client
    .schema("parent_app")
    .from("applications")
    .select("student_id, program, drop_in_program")
    .in("student_id", studentIds);

  const appMap = Object.fromEntries(
    (apps ?? []).map((a) => [a.student_id, { program: a.program, drop_in_program: a.drop_in_program }])
  );

  return students.map((s) => ({
    id: s.id,
    child_legal_name: s.child_legal_name ?? null,
    child_grade: s.child_grade ?? null,
    profile_image_url: s.profile_image_url ?? null,
    program: appMap[s.id]?.program ?? null,
    drop_in_program: appMap[s.id]?.drop_in_program ?? null,
  }));
}
