import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import { resolveEffectiveParentId } from "../../resolveEffectiveParentId";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ImpersonateNotificationBell from "../../ImpersonateNotificationBell";
import EmergencyContactsPage from "@/app/parent/emergency-contacts/EmergencyContactsPage";
import type { ParentEmergencyContactsRecord } from "@/app/actions/getParentEmergencyContacts";

export default async function ImpersonateEmergencyContactsPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();
  const { effectiveParentId, isSharedAccess, ownerName } = await resolveEffectiveParentId(parentId);

  const [{ data: adminUser }, { data: students }] = await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, email")
      .eq("id", parentId)
      .single(),
    adminClient
      .schema("admin")
      .from("students")
      .select("id, child_legal_name")
      .eq("parent_id", effectiveParentId)
      .eq("is_deleted", false),
  ]);

  if (!adminUser) notFound();

  const fullName = adminUser.full_name ?? null;
  const email = (adminUser.email as string | null) ?? "";

  const contacts: ParentEmergencyContactsRecord[] = await Promise.all(
    (students ?? []).map(async (student) => {
      const [{ data: healthInfo }, { data: appInfo }] = await Promise.all([
        adminClient
          .schema("parent_app")
          .from("student_health_info")
          .select(
            "in_state_contact_name, in_state_contact_relation, in_state_contact_phone, out_of_state_contact_name, out_of_state_contact_relation, out_of_state_contact_phone"
          )
          .eq("student_id", student.id)
          .maybeSingle(),
        adminClient
          .schema("parent_app")
          .from("applications")
          .select(
            "g1_full_name, g1_email, g1_cell_phone, g1_work_phone, g1_relationship, g2_full_name, g2_email, g2_cell_phone, g2_work_phone, g2_relationship"
          )
          .eq("student_id", student.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        studentId: student.id,
        studentName: student.child_legal_name ?? null,
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
        out_of_state_contact_relation:
          healthInfo?.out_of_state_contact_relation ?? null,
        out_of_state_contact_phone: healthInfo?.out_of_state_contact_phone ?? null,
      };
    })
  );

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <AdminPreviewBanner parentName={fullName} parentEmail={email} />
      <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={ownerName} />
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[1fr_auto] items-center">
        <div className="flex items-center justify-center">
          <DashboardNav parentId={parentId} />
        </div>
        <ImpersonateNotificationBell parentId={parentId} />
      </header>
      <main className="flex-1 max-w-2xl mx-auto px-6 py-12 w-full pointer-events-none select-none">
        <div className="mb-10">
          <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
            Emergency Contacts
          </h1>
        </div>
        <EmergencyContactsPage contacts={contacts} />
      </main>
    </div>
  );
}
