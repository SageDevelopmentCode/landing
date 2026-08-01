import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import Footer from "@/app/components/Footer";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import DashboardHeader from "@/app/parent/dashboard/DashboardHeader";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import ChildrenPage from "./ChildrenPage";
import ParentHeaderRight from "@/app/parent/components/ParentHeaderRight";
import type { Database } from "@/app/types/database.types";
import { getAllStudentAssignments } from "@/app/actions/teacherAssignments";
import type { TeacherAssignment } from "@/app/actions/teacherAssignments";
import type { LearningNote } from "@/app/actions/saveParentLearningNote";

type Student = Database["admin"]["Tables"]["students"]["Row"];
type AuthorizedPickupPlan = Database["parent_app"]["Tables"]["student_authorized_pickup_plan"]["Row"];
type AuthorizedPickupPerson = Database["parent_app"]["Tables"]["student_authorized_pickup_persons"]["Row"];

export default async function ChildrenRoute() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  const { data: grant } = await adminClient
    .schema("parent_app")
    .from("dashboard_access_grants")
    .select("owner_id")
    .eq("grantee_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const effectiveParentId = grant?.owner_id ?? user.id;

  const [{ data: studentsData }, { data: adminUser }, { data: enrolledCheck }] = await Promise.all([
    adminClient
      .schema("admin")
      .from("students")
      .select("*")
      .eq("parent_id", effectiveParentId)
      .eq("is_deleted", false),
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, profile_image_url")
      .eq("id", user.id)
      .single(),
    adminClient
      .schema("parent_app")
      .from("applications")
      .select("id")
      .eq("user_id", effectiveParentId)
      .eq("status", "enrolled")
      .limit(1),
  ]);

  const children: Student[] = studentsData ?? [];
  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;
  const isSharedAccess = !!grant;

  let primaryOwnerName: string | null = null;
  if (isSharedAccess) {
    const { data: ownerUser } = await adminClient.schema("admin").from("users").select("full_name").eq("id", effectiveParentId).single();
    primaryOwnerName = ownerUser?.full_name ?? null;
  }

  if ((enrolledCheck ?? []).length === 0) redirect("/parent/dashboard");

  const studentIds = children.map((s) => s.id);
  const teachersByStudent: Record<string, TeacherAssignment[]> = {};
  if (studentIds.length > 0) {
    const allAssignments = await getAllStudentAssignments();
    for (const sid of studentIds) {
      teachersByStudent[sid] = allAssignments[sid] ?? [];
    }
  }

  const nonEnrolledAppByStudent: Record<string, string> = {};
  const studentProgramMap: Record<string, string> = {};
  const pickupByStudent: Record<string, { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] }> = {};
  const notesByStudent: Record<string, LearningNote[]> = {};
  if (studentIds.length > 0) {
    const [{ data: appsData }, { data: pickupPlansData }, { data: pickupPersonsData }, { data: learningNotesData }] = await Promise.all([
      adminClient
        .schema("parent_app")
        .from("applications")
        .select("id, student_id, status, program, drop_in_program")
        .eq("user_id", effectiveParentId)
        .eq("approved", true)
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
        .in("student_id", studentIds)
        .order("sort_order", { ascending: true }),
      adminClient
        .schema("parent_app")
        .from("student_learning_notes")
        .select("*")
        .eq("parent_id", effectiveParentId)
        .eq("is_deleted", false)
        .in("student_id", studentIds)
        .order("created_at", { ascending: false }),
    ]);

    for (const app of appsData ?? []) {
      if (!app.student_id) continue;
      if (app.status !== "enrolled") {
        nonEnrolledAppByStudent[app.student_id] = app.id;
      }
      // Set program label — prefer the primary program, fall back to drop_in_program
      const prog = app.program ?? app.drop_in_program;
      if (prog && !studentProgramMap[app.student_id]) {
        studentProgramMap[app.student_id] = prog;
      }
    }

    for (const sid of studentIds) {
      pickupByStudent[sid] = {
        plan: pickupPlansData?.find((p) => p.student_id === sid) ?? null,
        persons: pickupPersonsData?.filter((p) => p.student_id === sid) ?? [],
      };
      notesByStudent[sid] = (learningNotesData?.filter((n) => n.student_id === sid) ?? []) as LearningNote[];
    }
  }

  return (
    <div className="bg-welcome-bg">
      <div className="min-h-screen flex flex-col">
        <DashboardHeader>
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
            <DashboardNav hasEnrolledStudent={(enrolledCheck ?? []).length > 0} />
          </div>
          <ParentHeaderRight userId={user.id} email={user.email ?? ""} fullName={fullName} profileImageUrl={profileImageUrl} />
        </DashboardHeader>

        <SharedAccessBanner isSharedAccess={isSharedAccess} primaryOwnerName={primaryOwnerName} />

        <main className="flex-1 flex overflow-hidden">
          <Suspense>
            <ChildrenPage students={children} teachersByStudent={teachersByStudent} nonEnrolledAppByStudent={nonEnrolledAppByStudent} studentProgramMap={studentProgramMap} pickupByStudent={pickupByStudent} notesByStudent={notesByStudent} isSharedAccess={isSharedAccess} />
          </Suspense>
        </main>
      </div>
      <Footer />
    </div>
  );
}
