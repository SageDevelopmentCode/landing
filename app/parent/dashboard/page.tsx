import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import Footer from "@/app/components/Footer";
import ChildTabs from "./ChildTabs";
import type { StudentSignatureMap } from "@/app/types/enrollment-signatures";
import type { Database } from "@/app/types/database.types";

type StudentHealthInfo = Database["parent_app"]["Tables"]["student_health_info"]["Row"];
type StudentMedicationPlan = Database["parent_app"]["Tables"]["student_medication_plan"]["Row"];
type StudentMedication = Database["parent_app"]["Tables"]["student_medications"]["Row"];
type AuthorizedPickupPlan = Database["parent_app"]["Tables"]["student_authorized_pickup_plan"]["Row"];
type AuthorizedPickupPerson = Database["parent_app"]["Tables"]["student_authorized_pickup_persons"]["Row"];

export default async function ParentDashboard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const [{ data: apps }, { data: adminUser }] = await Promise.all([
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .eq("approved", true),
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single(),
  ]);

  const fullName = adminUser?.full_name ?? null;
  const approvedApps = apps ?? [];

  const registrationFeePaidByStudent: Record<string, boolean> = {};
  for (const app of approvedApps) {
    if (app.student_id) {
      registrationFeePaidByStudent[app.student_id] = app.registration_fee_paid ?? false;
    }
  }

  const studentIds = approvedApps
    .map((a) => a.student_id)
    .filter((id): id is string => id !== null);

  let signaturesByStudent: StudentSignatureMap = {};
  let healthInfoByStudent: Record<string, StudentHealthInfo> = {};
  let medicationPlanByStudent: Record<string, { plan: StudentMedicationPlan | null; medications: StudentMedication[] }> = {};
  let immunizationFileCountByStudent: Record<string, number> = {};
  let consentByStudent: Record<string, "FULL" | "LIMITED" | "NO"> = {};
  let authorizedPickupByStudent: Record<string, { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] }> = {};
  let healthStatementByStudent: Record<string, { option_type: string } | null> = {};
  let religiousExemptionCountByStudent: Record<string, number> = {};

  if (studentIds.length > 0) {
    const [
      { data: sigs },
      { data: healthInfoRows },
      { data: medicationPlanRows },
      { data: medicationRows },
      { data: consentRows },
      { data: authorizedPickupPlanRows },
      { data: authorizedPickupPersonRows },
      { data: healthStatementRows },
    ] = await Promise.all([
      adminClient
        .schema("parent_app")
        .from("enrollment_signatures")
        .select("*")
        .eq("parent_id", user.id)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_health_info")
        .select("*")
        .eq("parent_id", user.id)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_medication_plan")
        .select("*")
        .eq("parent_id", user.id)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_medications")
        .select("*")
        .eq("parent_id", user.id)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_photo_release_consent")
        .select("*")
        .eq("parent_id", user.id)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_authorized_pickup_plan")
        .select("*")
        .eq("parent_id", user.id)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_authorized_pickup_persons")
        .select("*")
        .eq("parent_id", user.id)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_health_statement")
        .select("*")
        .eq("parent_id", user.id)
        .in("student_id", studentIds),
    ]);

    // Fetch immunization file counts for each student
    const [immunizationCounts, religiousExemptionCounts] = await Promise.all([
      Promise.all(
        studentIds.map(async (sid) => {
          const { data } = await adminClient.storage
            .from("immunization-records")
            .list(`${user.id}/${sid}`);
          const count = (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder").length;
          return { sid, count };
        })
      ),
      Promise.all(
        studentIds.map(async (sid) => {
          const { data } = await adminClient.storage
            .from("religious-exemption-affidavits")
            .list(`${user.id}/${sid}`);
          const count = (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder").length;
          return { sid, count };
        })
      ),
    ]);
    for (const { sid, count } of immunizationCounts) {
      immunizationFileCountByStudent[sid] = count;
    }
    for (const { sid, count } of religiousExemptionCounts) {
      religiousExemptionCountByStudent[sid] = count;
    }

    for (const row of healthStatementRows ?? []) {
      healthStatementByStudent[row.student_id] = { option_type: row.option_type };
    }

    for (const row of consentRows ?? []) {
      consentByStudent[row.student_id] = row.consent_level as "FULL" | "LIMITED" | "NO";
    }

    for (const sig of sigs ?? []) {
      signaturesByStudent[sig.student_id] ??= {};
      signaturesByStudent[sig.student_id][
        `${sig.contract_id}-${sig.section_id}`
      ] = sig;
    }

    for (const row of healthInfoRows ?? []) {
      healthInfoByStudent[row.student_id] = row as StudentHealthInfo;
    }

    for (const sid of studentIds) {
      medicationPlanByStudent[sid] = {
        plan: (medicationPlanRows ?? []).find((r) => r.student_id === sid) as StudentMedicationPlan | null ?? null,
        medications: (medicationRows ?? []).filter((r) => r.student_id === sid) as StudentMedication[],
      };
    }

    for (const sid of studentIds) {
      authorizedPickupByStudent[sid] = {
        plan: (authorizedPickupPlanRows ?? []).find((r) => r.student_id === sid) as AuthorizedPickupPlan | null ?? null,
        persons: (authorizedPickupPersonRows ?? []).filter((r) => r.student_id === sid) as AuthorizedPickupPerson[],
      };
    }
  }

  return (
    <div className="bg-welcome-bg">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/assets/Logo.png"
              alt="Sage Field"
              width={50}
              height={24}
              className="object-contain"
            />
          </Link>
          {user?.email && (
            <ProfileDropdown email={user.email} fullName={fullName} />
          )}
        </header>

        <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
          {/* Welcome */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
              Welcome, {fullName ?? "Parent"}.
            </h1>
          </div>

          <ChildTabs
            apps={approvedApps}
            signaturesByStudent={signaturesByStudent}
            healthInfoByStudent={healthInfoByStudent}
            medicationPlanByStudent={medicationPlanByStudent}
            parentName={fullName ?? ""}
            parentId={user.id}
            parentEmail={user.email ?? ""}
            immunizationFileCountByStudent={immunizationFileCountByStudent}
            consentByStudent={consentByStudent}
            authorizedPickupByStudent={authorizedPickupByStudent}
            registrationFeePaidByStudent={registrationFeePaidByStudent}
            healthStatementByStudent={healthStatementByStudent}
            religiousExemptionCountByStudent={religiousExemptionCountByStudent}
          />
        </main>
      </div>
      <Footer />
    </div>
  );
}
