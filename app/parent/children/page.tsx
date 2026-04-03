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
import ChildrenPage from "./ChildrenPage";
import type { Database } from "@/app/types/database.types";
import { getAllStudentAssignments } from "@/app/actions/teacherAssignments";
import type { TeacherAssignment } from "@/app/actions/teacherAssignments";

type Student = Database["admin"]["Tables"]["students"]["Row"];

export default async function ChildrenRoute() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  const [{ data: studentsData }, { data: adminUser }] = await Promise.all([
    adminClient
      .schema("admin")
      .from("students")
      .select("*")
      .eq("parent_id", user.id)
      .eq("is_deleted", false),
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, profile_image_url")
      .eq("id", user.id)
      .single(),
  ]);

  const children: Student[] = studentsData ?? [];
  const fullName = adminUser?.full_name ?? null;
  const profileImageUrl = adminUser?.profile_image_url ?? null;

  const studentIds = children.map((s) => s.id);
  const teachersByStudent: Record<string, TeacherAssignment[]> = {};
  if (studentIds.length > 0) {
    const allAssignments = await getAllStudentAssignments();
    for (const sid of studentIds) {
      teachersByStudent[sid] = allAssignments[sid] ?? [];
    }
  }

  const nonEnrolledAppByStudent: Record<string, string> = {};
  if (studentIds.length > 0) {
    const { data: appsData } = await adminClient
      .schema("parent_app")
      .from("applications")
      .select("id, student_id, status")
      .eq("user_id", user.id)
      .eq("approved", true)
      .in("student_id", studentIds);

    for (const app of appsData ?? []) {
      if (app.student_id && app.status !== "enrolled") {
        nonEnrolledAppByStudent[app.student_id] = app.id;
      }
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
              My Children
            </h1>
          </div>
          <ChildrenPage children={children} teachersByStudent={teachersByStudent} nonEnrolledAppByStudent={nonEnrolledAppByStudent} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
