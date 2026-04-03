import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import Footer from "@/app/components/Footer";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import FormsPage from "./FormsPage";
import type { StudentSignatureMap } from "@/app/types/enrollment-signatures";
import type { Database } from "@/app/types/database.types";

type StudentHealthInfo =
  Database["parent_app"]["Tables"]["student_health_info"]["Row"];
type StudentMedicationPlan =
  Database["parent_app"]["Tables"]["student_medication_plan"]["Row"];
type StudentMedication =
  Database["parent_app"]["Tables"]["student_medications"]["Row"];
type AuthorizedPickupPlan =
  Database["parent_app"]["Tables"]["student_authorized_pickup_plan"]["Row"];
type AuthorizedPickupPerson =
  Database["parent_app"]["Tables"]["student_authorized_pickup_persons"]["Row"];

export default async function FormsRoute() {
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
      .select("full_name, profile_image_url")
      .eq("id", user.id)
      .single(),
  ]);

  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;
  const approvedApps = apps ?? [];

  const studentIds = approvedApps
    .map((a) => a.student_id)
    .filter((id): id is string => id !== null);

  const signaturesByStudent: StudentSignatureMap = {};
  const healthInfoByStudent: Record<string, StudentHealthInfo> = {};
  const medicationPlanByStudent: Record<
    string,
    { plan: StudentMedicationPlan | null; medications: StudentMedication[] }
  > = {};
  const immunizationFileCountByStudent: Record<string, number> = {};
  const consentByStudent: Record<string, "FULL" | "LIMITED" | "NO"> = {};
  const authorizedPickupByStudent: Record<
    string,
    { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] }
  > = {};
  const healthStatementByStudent: Record<
    string,
    { option_type: string } | null
  > = {};
  const religiousExemptionCountByStudent: Record<string, number> = {};

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

    const [immunizationCounts, religiousExemptionCounts] = await Promise.all([
      Promise.all(
        studentIds.map(async (sid) => {
          const { data } = await adminClient.storage
            .from("immunization-records")
            .list(`${user.id}/${sid}`);
          const count = (data ?? []).filter(
            (f) => f.name !== ".emptyFolderPlaceholder",
          ).length;
          return { sid, count };
        }),
      ),
      Promise.all(
        studentIds.map(async (sid) => {
          const { data } = await adminClient.storage
            .from("religious-exemption-affidavits")
            .list(`${user.id}/${sid}`);
          const count = (data ?? []).filter(
            (f) => f.name !== ".emptyFolderPlaceholder",
          ).length;
          return { sid, count };
        }),
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
      signaturesByStudent[sig.student_id][`${sig.contract_id}-${sig.section_id}`] = sig;
    }

    for (const row of healthInfoRows ?? []) {
      healthInfoByStudent[row.student_id] = row as StudentHealthInfo;
    }

    for (const sid of studentIds) {
      medicationPlanByStudent[sid] = {
        plan:
          ((medicationPlanRows ?? []).find(
            (r) => r.student_id === sid,
          ) as StudentMedicationPlan | null) ?? null,
        medications: (medicationRows ?? []).filter(
          (r) => r.student_id === sid,
        ) as StudentMedication[],
      };
    }

    for (const sid of studentIds) {
      authorizedPickupByStudent[sid] = {
        plan:
          ((authorizedPickupPlanRows ?? []).find(
            (r) => r.student_id === sid,
          ) as AuthorizedPickupPlan | null) ?? null,
        persons: (authorizedPickupPersonRows ?? []).filter(
          (r) => r.student_id === sid,
        ) as AuthorizedPickupPerson[],
      };
    }
  }

  return (
    <div className="bg-welcome-bg">
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-3 items-center">
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/assets/Logo.png"
                alt="Sage Field"
                width={50}
                height={24}
                className="object-contain"
              />
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <DashboardNav />
          </div>
          <div className="flex items-center justify-end">
            {user?.email && (
              <ProfileDropdown email={user.email} fullName={fullName} userId={user.id} profileImageUrl={profileImageUrl} />
            )}
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
          <div className="mb-10">
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
              Forms &amp; Documents
            </h1>
          </div>
          <FormsPage
            apps={approvedApps}
            signaturesByStudent={signaturesByStudent}
            healthInfoByStudent={healthInfoByStudent}
            medicationPlanByStudent={medicationPlanByStudent}
            immunizationFileCountByStudent={immunizationFileCountByStudent}
            consentByStudent={consentByStudent}
            authorizedPickupByStudent={authorizedPickupByStudent}
            healthStatementByStudent={healthStatementByStudent}
            religiousExemptionCountByStudent={religiousExemptionCountByStudent}
            parentId={user.id}
            parentName={fullName ?? ""}
          />
        </main>
      </div>
      <Footer />
    </div>
  );
}
