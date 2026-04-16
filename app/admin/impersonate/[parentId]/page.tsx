import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import ApplicationList from "@/app/apply/dashboard/ApplicationList";
import ChildTabs from "@/app/parent/dashboard/ChildTabs";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import AdminPreviewBanner from "../AdminPreviewBanner";
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
type Application = Database["parent_app"]["Tables"]["applications"]["Row"];

export default async function ImpersonateParentPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();

  const { data: adminUser } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name, email, profile_image_url")
    .eq("id", parentId)
    .single();

  if (!adminUser) notFound();

  const fullName = adminUser.full_name ?? null;
  const email = (adminUser.email as string | null) ?? "";

  const [{ data: allApps }, { data: pendingAppsData }] = await Promise.all([
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("*")
      .eq("user_id", parentId),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("*")
      .eq("user_id", parentId)
      .eq("approved", false)
      .eq("denied", false),
  ]);

  const apps = (allApps ?? []) as Application[];
  const hasApproved = apps.some((a) => a.approved === true);

  if (hasApproved) {
    const approvedApps = apps.filter((a) => a.approved === true);
    const pendingApps = (pendingAppsData ?? []) as Application[];

    const registrationFeePaidByStudent: Record<string, boolean> = {};
    for (const app of approvedApps) {
      if (app.student_id) {
        registrationFeePaidByStudent[app.student_id] =
          app.registration_fee_paid ?? false;
      }
    }

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
        immunizationCounts,
        religiousExemptionCounts,
      ] = await Promise.all([
        adminClient
          .schema("parent_app")
          .from("enrollment_signatures")
          .select("*")
          .eq("parent_id", parentId)
          .in("student_id", studentIds),
        adminClient
          .schema("parent_app")
          .from("student_health_info")
          .select("*")
          .eq("parent_id", parentId)
          .in("student_id", studentIds),
        adminClient
          .schema("parent_app")
          .from("student_medication_plan")
          .select("*")
          .eq("parent_id", parentId)
          .in("student_id", studentIds),
        adminClient
          .schema("parent_app")
          .from("student_medications")
          .select("*")
          .eq("parent_id", parentId)
          .in("student_id", studentIds),
        adminClient
          .schema("parent_app")
          .from("student_photo_release_consent")
          .select("*")
          .eq("parent_id", parentId)
          .in("student_id", studentIds),
        adminClient
          .schema("parent_app")
          .from("student_authorized_pickup_plan")
          .select("*")
          .eq("parent_id", parentId)
          .in("student_id", studentIds),
        adminClient
          .schema("parent_app")
          .from("student_authorized_pickup_persons")
          .select("*")
          .eq("parent_id", parentId)
          .in("student_id", studentIds),
        adminClient
          .schema("parent_app")
          .from("student_health_statement")
          .select("*")
          .eq("parent_id", parentId)
          .in("student_id", studentIds),
        Promise.all(
          studentIds.map(async (sid) => {
            const { data } = await adminClient.storage
              .from("immunization-records")
              .list(`${parentId}/${sid}`);
            const count = (data ?? []).filter(
              (f) => f.name !== ".emptyFolderPlaceholder"
            ).length;
            return { sid, count };
          })
        ),
        Promise.all(
          studentIds.map(async (sid) => {
            const { data } = await adminClient.storage
              .from("religious-exemption-affidavits")
              .list(`${parentId}/${sid}`);
            const count = (data ?? []).filter(
              (f) => f.name !== ".emptyFolderPlaceholder"
            ).length;
            return { sid, count };
          })
        ),
      ]);

      for (const { sid, count } of immunizationCounts)
        immunizationFileCountByStudent[sid] = count;
      for (const { sid, count } of religiousExemptionCounts)
        religiousExemptionCountByStudent[sid] = count;
      for (const row of healthStatementRows ?? [])
        healthStatementByStudent[row.student_id] = {
          option_type: row.option_type,
        };
      for (const row of consentRows ?? [])
        consentByStudent[row.student_id] = row.consent_level as
          | "FULL"
          | "LIMITED"
          | "NO";
      for (const sig of sigs ?? []) {
        signaturesByStudent[sig.student_id] ??= {};
        signaturesByStudent[sig.student_id][
          `${sig.contract_id}-${sig.section_id}`
        ] = sig;
      }
      for (const row of healthInfoRows ?? [])
        healthInfoByStudent[row.student_id] = row as StudentHealthInfo;
      for (const sid of studentIds) {
        medicationPlanByStudent[sid] = {
          plan:
            ((medicationPlanRows ?? []).find(
              (r) => r.student_id === sid
            ) as StudentMedicationPlan | null) ?? null,
          medications: (medicationRows ?? []).filter(
            (r) => r.student_id === sid
          ) as StudentMedication[],
        };
      }
      for (const sid of studentIds) {
        authorizedPickupByStudent[sid] = {
          plan:
            ((authorizedPickupPlanRows ?? []).find(
              (r) => r.student_id === sid
            ) as AuthorizedPickupPlan | null) ?? null,
          persons: (authorizedPickupPersonRows ?? []).filter(
            (r) => r.student_id === sid
          ) as AuthorizedPickupPerson[],
        };
      }
    }

    return (
      <div>
        <AdminPreviewBanner parentName={fullName} parentEmail={email} />
        {/* Parent dashboard header with DashboardNav — mirrors the gate in parent/dashboard/page.tsx */}
        {(parentId === "f5a4edbc-5683-40dc-9d9b-7cd0522736fd" ||
          parentId === "893f483e-2724-428f-a2f9-4333831501c7") && (
          <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-center">
            <DashboardNav />
          </header>
        )}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
              Welcome, {fullName ?? "Parent"}.
            </h1>
          </div>
          <ChildTabs
            apps={approvedApps}
            pendingApps={pendingApps}
            signaturesByStudent={signaturesByStudent}
            healthInfoByStudent={healthInfoByStudent}
            medicationPlanByStudent={medicationPlanByStudent}
            parentName={fullName ?? ""}
            parentId={parentId}
            parentEmail={email}
            immunizationFileCountByStudent={immunizationFileCountByStudent}
            consentByStudent={consentByStudent}
            authorizedPickupByStudent={authorizedPickupByStudent}
            registrationFeePaidByStudent={registrationFeePaidByStudent}
            healthStatementByStudent={healthStatementByStudent}
            religiousExemptionCountByStudent={religiousExemptionCountByStudent}
          />
        </div>
      </div>
    );
  }

  // Apply dashboard path
  const inProgressCount = apps.filter((a) => a.status === "in_progress").length;
  const submittedCount = apps.filter(
    (a) => a.status !== "in_progress" && a.status != null
  ).length;
  const hasSubmitted = submittedCount > 0;
  const g1Name =
    (apps[0]?.g1_full_name as string | null) ??
    fullName?.split(" ")[0] ??
    "Parent";

  function buildSubtitle() {
    const parts: string[] = [];
    if (inProgressCount > 0)
      parts.push(
        `${inProgressCount} in-progress application${inProgressCount !== 1 ? "s" : ""}`
      );
    if (submittedCount > 0)
      parts.push(
        `${submittedCount} submitted application${submittedCount !== 1 ? "s" : ""}`
      );
    if (parts.length === 0) return "No applications found.";
    return `You have ${parts.join(" and ")}.`;
  }

  return (
    <div>
      <AdminPreviewBanner parentName={fullName} parentEmail={email} />
      <div className="max-w-4xl mx-auto px-6 py-12">
        {hasSubmitted && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-sm text-amber-800 font-body">
              <span className="font-semibold">
                We&apos;re reviewing your application.
              </span>{" "}
              Our team will be in touch soon.
            </p>
          </div>
        )}
        <div className="mb-10">
          <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
            Welcome back, {g1Name}.
          </h1>
          <p className="text-gray-500 font-body text-sm">{buildSubtitle()}</p>
        </div>
        <div className="pointer-events-none select-none">
          <ApplicationList apps={apps as Record<string, string | null | boolean>[]} />
        </div>
      </div>
    </div>
  );
}
