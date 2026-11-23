import { createAdminClient } from "@/app/lib/supabase-server";

export type ParentEmergencyContactsRecord = {
  studentId: string;
  studentName: string | null;
  profileImageUrl: string | null;
  /** The writes need an approved application for this parent + student (assertStudentBelongsToParent). */
  canEdit: boolean;
  g1_full_name: string | null;
  g1_email: string | null;
  g1_cell_phone: string | null;
  g1_work_phone: string | null;
  g1_relationship: string | null;
  g2_full_name: string | null;
  g2_email: string | null;
  g2_cell_phone: string | null;
  g2_work_phone: string | null;
  g2_relationship: string | null;
  in_state_contact_name: string | null;
  in_state_contact_relation: string | null;
  in_state_contact_phone: string | null;
  out_of_state_contact_name: string | null;
  out_of_state_contact_relation: string | null;
  out_of_state_contact_phone: string | null;
};

/**
 * Server-only loader for the Emergency Contacts page (parent + admin preview).
 * Reads the same rows the two write actions update:
 *  - guardians: the latest application with `user_id = parentId` (updateEmergencyContactsGuardian)
 *  - in-state / out-of-state: `student_health_info` keyed by (parent_id, student_id) (updateEmergencyContacts)
 * Callers must have already resolved `parentId` for the signed-in user (or be an admin).
 */
export async function loadEmergencyContacts(parentId: string): Promise<ParentEmergencyContactsRecord[]> {
  const adminClient = createAdminClient();

  const { data: students } = await adminClient
    .schema("admin")
    .from("students")
    .select("id, child_legal_name, profile_image_url")
    .eq("parent_id", parentId)
    .eq("is_deleted", false);

  if (!students || students.length === 0) return [];

  return Promise.all(
    students.map(async (student) => {
      const [{ data: healthInfo }, { data: appInfo }, { data: approvedApp }] = await Promise.all([
        adminClient
          .schema("parent_app")
          .from("student_health_info")
          .select(
            "in_state_contact_name, in_state_contact_relation, in_state_contact_phone, out_of_state_contact_name, out_of_state_contact_relation, out_of_state_contact_phone",
          )
          .eq("student_id", student.id)
          .eq("parent_id", parentId)
          .maybeSingle(),
        adminClient
          .schema("parent_app")
          .from("applications")
          .select(
            "g1_full_name, g1_email, g1_cell_phone, g1_work_phone, g1_relationship, g2_full_name, g2_email, g2_cell_phone, g2_work_phone, g2_relationship",
          )
          .eq("student_id", student.id)
          .eq("user_id", parentId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        adminClient
          .schema("parent_app")
          .from("applications")
          .select("id")
          .eq("student_id", student.id)
          .eq("user_id", parentId)
          .eq("approved", true)
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        studentId: student.id,
        studentName: student.child_legal_name ?? null,
        profileImageUrl: (student.profile_image_url as string | null | undefined) ?? null,
        canEdit: !!approvedApp,
        g1_full_name: appInfo?.g1_full_name ?? null,
        g1_email: appInfo?.g1_email ?? null,
        g1_cell_phone: appInfo?.g1_cell_phone ?? null,
        g1_work_phone: appInfo?.g1_work_phone ?? null,
        g1_relationship: appInfo?.g1_relationship ?? null,
        g2_full_name: appInfo?.g2_full_name ?? null,
        g2_email: appInfo?.g2_email ?? null,
        g2_cell_phone: appInfo?.g2_cell_phone ?? null,
        g2_work_phone: appInfo?.g2_work_phone ?? null,
        g2_relationship: appInfo?.g2_relationship ?? null,
        in_state_contact_name: healthInfo?.in_state_contact_name ?? null,
        in_state_contact_relation: healthInfo?.in_state_contact_relation ?? null,
        in_state_contact_phone: healthInfo?.in_state_contact_phone ?? null,
        out_of_state_contact_name: healthInfo?.out_of_state_contact_name ?? null,
        out_of_state_contact_relation: healthInfo?.out_of_state_contact_relation ?? null,
        out_of_state_contact_phone: healthInfo?.out_of_state_contact_phone ?? null,
      } satisfies ParentEmergencyContactsRecord;
    }),
  );
}
