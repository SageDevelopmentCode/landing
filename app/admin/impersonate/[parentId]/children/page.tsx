import { createAdminClient } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";
import { resolveEffectiveParentId } from "../../resolveEffectiveParentId";
import SharedAccessBanner from "@/app/parent/dashboard/SharedAccessBanner";
import { Suspense } from "react";
import AdminPreviewBanner from "../../AdminPreviewBanner";
import DashboardNav from "@/app/parent/dashboard/DashboardNav";
import ImpersonateNotificationBell from "../../ImpersonateNotificationBell";
import ChildrenPage from "@/app/parent/children/ChildrenPage";
import { getAllStudentAssignments } from "@/app/actions/teacherAssignments";
import type { TeacherAssignment } from "@/app/actions/teacherAssignments";
import type { LearningNote } from "@/app/actions/saveParentLearningNote";
import type { Database } from "@/app/types/database.types";

type Student = Database["admin"]["Tables"]["students"]["Row"];
type AuthorizedPickupPlan =
  Database["parent_app"]["Tables"]["student_authorized_pickup_plan"]["Row"];
type AuthorizedPickupPerson =
  Database["parent_app"]["Tables"]["student_authorized_pickup_persons"]["Row"];

export default async function ImpersonateChildrenPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const adminClient = createAdminClient();
  const { effectiveParentId, isSharedAccess, ownerName } = await resolveEffectiveParentId(parentId);

  const [{ data: studentsData }, { data: adminUser }] = await Promise.all([
    adminClient
      .schema("admin")
      .from("students")
      .select("*")
      .eq("parent_id", effectiveParentId)
      .eq("is_deleted", false),
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, email, profile_image_url")
      .eq("id", parentId)
      .single(),
  ]);

  if (!adminUser) notFound();

  const fullName = adminUser.full_name ?? null;
  const email = (adminUser.email as string | null) ?? "";
  const children: Student[] = studentsData ?? [];
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
  const pickupByStudent: Record<
    string,
    { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] }
  > = {};
  const notesByStudent: Record<string, LearningNote[]> = {};

  if (studentIds.length > 0) {
    const [
      { data: appsData },
      { data: pickupPlansData },
      { data: pickupPersonsData },
      { data: learningNotesData },
    ] = await Promise.all([
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
      const prog = app.program ?? app.drop_in_program;
      if (prog && !studentProgramMap[app.student_id]) {
        studentProgramMap[app.student_id] = prog;
      }
    }

    for (const sid of studentIds) {
      pickupByStudent[sid] = {
        plan: pickupPlansData?.find((p) => p.student_id === sid) ?? null,
        persons:
          pickupPersonsData?.filter((p) => p.student_id === sid) ?? [],
      };
      notesByStudent[sid] = (learningNotesData?.filter(
        (n) => n.student_id === sid
      ) ?? []) as LearningNote[];
    }
  }

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
      <main className="flex-1 flex overflow-hidden">
        <Suspense>
          <ChildrenPage
            children={children}
            teachersByStudent={teachersByStudent}
            nonEnrolledAppByStudent={nonEnrolledAppByStudent}
            studentProgramMap={studentProgramMap}
            pickupByStudent={pickupByStudent}
            notesByStudent={notesByStudent}
          />
        </Suspense>
      </main>
    </div>
  );
}
