import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  authenticateApiRequest,
  canAccessParentDashboard,
} from "@/app/lib/authenticate-api-request";
import { getConferenceTeacherAssignments } from "@/app/lib/get-conference-teacher-assignments";
import { getConferenceBookings } from "@/app/lib/get-conference-bookings";

export async function GET(request: NextRequest) {
  const user = await authenticateApiRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parentId =
    request.nextUrl.searchParams.get("parentId")?.trim() || user.id;

  const allowed = await canAccessParentDashboard(user.id, parentId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = createAdminClient();
  const { data: studentsData } = await adminClient
    .schema("admin")
    .from("students")
    .select("id, child_legal_name")
    .eq("parent_id", parentId)
    .eq("is_deleted", false);

  const students = studentsData ?? [];

  const [{ conferenceTeachers, conferenceStudents }, bookingsResult] =
    await Promise.all([
      getConferenceTeacherAssignments(students),
      getConferenceBookings(parentId),
    ]);

  return NextResponse.json({
    conferenceTeachers,
    conferenceStudents,
    bookingsByStudent: bookingsResult.bookingsByStudentId,
    takenSlotKeys: bookingsResult.takenSlotKeys,
  });
}
