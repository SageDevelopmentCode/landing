import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/app/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/app/apply/dashboard/ProfileDropdown";
import TeacherNav from "../../dashboard/TeacherNav";
import TeacherProfileClient from "./TeacherProfileClient";

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  // Fetch current viewer info + all teacher profile data in parallel
  const [
    { data: currentAdminUser },
    { data: teacherUser },
    { data: profileRow, error: profileErr },
    { data: quals, error: qualsErr },
    { data: expRows, error: expErr },
    { data: assignments },
  ] = await Promise.all([
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, role, profile_image_url")
      .eq("id", user.id)
      .single(),
    adminClient
      .schema("admin")
      .from("users")
      .select("full_name, role, profile_image_url")
      .eq("id", teacherId)
      .single(),
    adminClient
      .schema("teachers")
      .from("teacher_profiles")
      .select("bio, quote, years_experience, grade_range")
      .eq("user_id", teacherId)
      .maybeSingle(),
    adminClient
      .schema("teachers")
      .from("teacher_qualifications")
      .select("id, icon, text, sort_order")
      .eq("user_id", teacherId)
      .eq("is_deleted", false)
      .order("sort_order"),
    adminClient
      .schema("teachers")
      .from("teacher_experience")
      .select("id, role, place, period, is_current, detail, sort_order")
      .eq("user_id", teacherId)
      .eq("is_deleted", false)
      .order("sort_order"),
    adminClient
      .schema("teachers")
      .from("teacher_students")
      .select("id, student_id, program, classroom")
      .eq("teacher_id", teacherId)
      .eq("is_deleted", false),
  ]);

  if (profileErr) console.error("[teacher profile] teacher_profiles error:", profileErr.message);
  if (qualsErr) console.error("[teacher profile] teacher_qualifications error:", qualsErr.message);
  if (expErr) console.error("[teacher profile] teacher_experience error:", expErr.message);

  console.log("[teacher profile] profileRow:", profileRow, "quals:", quals?.length, "exp:", expRows?.length);

  if (!teacherUser) {
    redirect("/teacher/dashboard");
  }

  // Bulk fetch students
  let students: {
    id: string;
    student_id: string;
    child_legal_name: string;
    child_grade: string | null;
    profile_image_url: string | null;
    program: string | null;
    classroom: string | null;
  }[] = [];

  if (assignments && assignments.length > 0) {
    const studentIds = assignments.map((a) => a.student_id);
    const { data: studentRows } = await adminClient
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, child_grade, profile_image_url")
      .in("id", studentIds)
      .eq("is_deleted", false);

    if (studentRows) {
      students = assignments.map((a) => {
        const s = studentRows.find((r) => r.id === a.student_id);
        return {
          id: a.id,
          student_id: a.student_id,
          program: a.program,
          classroom: a.classroom,
          child_legal_name: s?.child_legal_name ?? "Unknown",
          child_grade: s?.child_grade ?? null,
          profile_image_url: s?.profile_image_url ?? null,
        };
      });
    }
  }

  const currentUserRole = currentAdminUser?.role ?? null;
  const canEdit =
    user.id === teacherId &&
    (currentUserRole === "teacher" || currentUserRole === "super_admin");

  return (
    <div className="bg-welcome-bg min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 px-5 py-3 grid grid-cols-[auto_1fr_auto] items-center">
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
          <TeacherNav />
        </div>
        <div className="flex items-center justify-end">
          {user?.email && (
            <ProfileDropdown
              email={user.email}
              fullName={currentAdminUser?.full_name ?? null}
              userId={user.id}
              profileImageUrl={currentAdminUser?.profile_image_url ?? null}
            />
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <TeacherProfileClient
          teacher={{
            id: teacherId,
            full_name: teacherUser.full_name ?? "Unknown",
            role: teacherUser.role ?? "teacher",
            profile_image_url: teacherUser.profile_image_url ?? null,
          }}
          profile={profileRow ?? null}
          qualifications={quals ?? []}
          experience={expRows ?? []}
          students={students}
          canEdit={canEdit}
          backHref="/teacher/feed"
          messageHref={null}
        />
      </main>
    </div>
  );
}
