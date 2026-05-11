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
import DashboardNav from "./DashboardNav";
import OnboardingChecklistButton from "@/app/parent/components/OnboardingChecklistButton";
import SharedAccessBanner from "./SharedAccessBanner";
import type { StudentSignatureMap } from "@/app/types/enrollment-signatures";
import type { Database } from "@/app/types/database.types";
import { getAllStudentAssignments } from "@/app/actions/teacherAssignments";
import type { TeacherAssignment } from "@/app/actions/teacherAssignments";

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

export default async function ParentDashboard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  // Check if this user was granted access to someone else's dashboard
  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const effectiveParentId = grant?.owner_id ?? user.id;
  const isSharedAccess = !!grant;

  let primaryOwnerName: string | null = null;
  if (isSharedAccess) {
    const { data: ownerUser } = await adminClient
      .schema("admin")
      .from("users")
      .select("full_name")
      .eq("id", effectiveParentId)
      .single();
    primaryOwnerName = ownerUser?.full_name ?? null;
  }

  const [{ data: apps }, { data: pendingAppsData }, { data: adminUser }] =
    await Promise.all([
      adminClient
        .schema("parent_app")
        .from("applications")
        .select("*")
        .eq("user_id", effectiveParentId)
        .eq("approved", true),
      adminClient
        .schema("parent_app")
        .from("applications")
        .select("*")
        .eq("user_id", effectiveParentId)
        .eq("approved", false)
        .eq("denied", false),
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
  const pendingApps = pendingAppsData ?? [];

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
  const profileImageByStudent: Record<string, string | null> = {};

  const teachersByStudent: Record<string, TeacherAssignment[]> = {};
  if (studentIds.length > 0) {
    const allAssignments = await getAllStudentAssignments();
    for (const sid of studentIds) {
      teachersByStudent[sid] = allAssignments[sid] ?? [];
    }
  }

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
      { data: studentsData },
    ] = await Promise.all([
      adminClient
        .schema("parent_app")
        .from("enrollment_signatures")
        .select("*")
        .eq("parent_id", effectiveParentId)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_health_info")
        .select("*")
        .eq("parent_id", effectiveParentId)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_medication_plan")
        .select("*")
        .eq("parent_id", effectiveParentId)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_medications")
        .select("*")
        .eq("parent_id", effectiveParentId)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_photo_release_consent")
        .select("*")
        .eq("parent_id", effectiveParentId)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_authorized_pickup_plan")
        .select("*")
        .eq("parent_id", effectiveParentId)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_authorized_pickup_persons")
        .select("*")
        .eq("parent_id", effectiveParentId)
        .in("student_id", studentIds),
      adminClient
        .schema("parent_app")
        .from("student_health_statement")
        .select("*")
        .eq("parent_id", effectiveParentId)
        .in("student_id", studentIds),
      adminClient
        .schema("admin")
        .from("students")
        .select("id, profile_image_url")
        .in("id", studentIds),
    ]);

    for (const s of studentsData ?? []) {
      profileImageByStudent[s.id] = s.profile_image_url ?? null;
    }

    // Fetch immunization file counts for each student
    const [immunizationCounts, religiousExemptionCounts] = await Promise.all([
      Promise.all(
        studentIds.map(async (sid) => {
          const { data } = await adminClient.storage
            .from("immunization-records")
            .list(`${effectiveParentId}/${sid}`);
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
            .list(`${effectiveParentId}/${sid}`);
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
      healthStatementByStudent[row.student_id] = {
        option_type: row.option_type,
      };
    }

    for (const row of consentRows ?? []) {
      consentByStudent[row.student_id] = row.consent_level as
        | "FULL"
        | "LIMITED"
        | "NO";
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
        {/* Header */}
        <header className="relative bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[auto_1fr_auto] items-center">
          <div className="hidden md:flex items-center">
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
            <DashboardNav
              hasEnrolledStudent={approvedApps.some((a) => a.status === "enrolled")}
              isSharedAccess={isSharedAccess}
            />
          </div>
          <div className="flex items-center justify-end gap-1">
            <OnboardingChecklistButton />
            {user?.email && (
              <ProfileDropdown
                email={user.email}
                fullName={fullName}
                userId={user.id}
                profileImageUrl={profileImageUrl}
              />
            )}
          </div>
        </header>

        <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={primaryOwnerName} />

        <main className="flex-1 flex overflow-hidden">
          <ChildTabs
            apps={approvedApps}
            pendingApps={pendingApps}
            signaturesByStudent={signaturesByStudent}
            healthInfoByStudent={healthInfoByStudent}
            medicationPlanByStudent={medicationPlanByStudent}
            parentName={primaryOwnerName ?? fullName ?? ""}
            parentId={effectiveParentId}
            parentEmail={user.email ?? ""}
            immunizationFileCountByStudent={immunizationFileCountByStudent}
            consentByStudent={consentByStudent}
            authorizedPickupByStudent={authorizedPickupByStudent}
            registrationFeePaidByStudent={registrationFeePaidByStudent}
            healthStatementByStudent={healthStatementByStudent}
            religiousExemptionCountByStudent={religiousExemptionCountByStudent}
            profileImageByStudent={profileImageByStudent}
          />
        </main>
      </div>
      <Footer />
    </div>
  );
}
