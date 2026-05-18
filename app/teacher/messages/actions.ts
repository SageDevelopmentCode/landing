"use server";

import { createAdminClient } from "@/app/lib/supabase-server";

export async function searchParents(query: string): Promise<{ id: string; full_name: string; profile_image_url: string | null }[]> {
  if (!query.trim()) return [];
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .ilike("full_name", `%${query}%`)
    .eq("role", "parent")
    .limit(10);

  if (error) return [];
  return (data ?? []).map((u) => ({ ...u, profile_image_url: u.profile_image_url ?? null }));
}

export type ParentWithChildren = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
  children: {
    id: string;
    child_legal_name: string | null;
    child_grade: string | null;
    program: string | null;
    profile_image_url: string | null;
  }[];
};

export type ParentsForTeacher = {
  myStudentsParents: ParentWithChildren[];
  allParents: ParentWithChildren[];
};

export async function getParentsForTeacher(teacherId: string): Promise<ParentsForTeacher> {
  const client = createAdminClient();

  // 1. Get teacher's assigned student IDs
  const { data: assignments } = await client
    .schema("teachers")
    .from("teacher_students")
    .select("student_id")
    .eq("teacher_id", teacherId)
    .eq("is_deleted", false);

  const myStudentIds = new Set((assignments ?? []).map((a) => a.student_id as string));

  // 2. Get all active students with parent_id
  const { data: students } = await client
    .schema("admin")
    .from("students")
    .select("id, parent_id, child_legal_name, child_grade, profile_image_url")
    .eq("is_deleted", false);

  if (!students || students.length === 0) {
    return { myStudentsParents: [], allParents: [] };
  }

  // 3. Get program info from applications
  const studentIds = students.map((s) => s.id);
  const { data: apps } = await client
    .schema("parent_app")
    .from("applications")
    .select("student_id, program")
    .in("student_id", studentIds);

  const programMap = Object.fromEntries(
    (apps ?? []).map((a) => [a.student_id as string, a.program as string | null])
  );

  // 4. Get all parent users
  const { data: parents } = await client
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .eq("role", "parent")
    .eq("is_deleted", false)
    .order("full_name", { ascending: true });

  if (!parents || parents.length === 0) {
    return { myStudentsParents: [], allParents: [] };
  }

  // Build parent map
  const parentMap = new Map<string, ParentWithChildren>();
  for (const p of parents) {
    parentMap.set(p.id, {
      id: p.id,
      full_name: p.full_name ?? "",
      profile_image_url: p.profile_image_url ?? null,
      children: [],
    });
  }

  // Attach children to parents; track which parents have teacher's students
  const myParentIds = new Set<string>();
  for (const s of students) {
    if (!s.parent_id) continue;
    const parent = parentMap.get(s.parent_id);
    if (!parent) continue;
    parent.children.push({
      id: s.id,
      child_legal_name: s.child_legal_name ?? null,
      child_grade: s.child_grade ?? null,
      program: programMap[s.id] ?? null,
      profile_image_url: (s as { profile_image_url?: string | null }).profile_image_url ?? null,
    });
    if (myStudentIds.has(s.id)) {
      myParentIds.add(s.parent_id);
    }
  }

  const myStudentsParents: ParentWithChildren[] = [];
  const allParents: ParentWithChildren[] = [];

  for (const parent of parentMap.values()) {
    if (myParentIds.has(parent.id)) {
      myStudentsParents.push(parent);
    } else {
      allParents.push(parent);
    }
  }

  // Already sorted by full_name from the DB query
  return { myStudentsParents, allParents };
}
