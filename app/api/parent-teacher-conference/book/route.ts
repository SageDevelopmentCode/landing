import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  authenticateApiRequest,
  canAccessParentDashboard,
} from "@/app/lib/authenticate-api-request";
import {
  sendDiscordNotification,
  createParentTeacherConferenceEmbed,
  createErrorEmbed,
} from "@/app/lib/discord";
import {
  sendZohoEmail,
  buildParentTeacherConferenceConfirmationEmail,
} from "@/app/lib/zoho";
import {
  CONFERENCE_TEACHER_IDS,
  CONFERENCE_SEASON,
  CONFERENCE_TEACHERS,
  formatConferenceDateForDisplay,
  isValidConferenceBooking,
} from "@/app/lib/parent-teacher-conference";

const bookSchema = z.object({
  parentId: z.string().uuid(),
  studentId: z.string().uuid(),
  teacherId: z.string().uuid(),
  weekStart: z.string().min(1),
  conferenceDate: z.string().min(1),
  timeSlot: z.string().min(1),
  format: z.enum(["in_person", "virtual"]),
  accommodationNote: z.string().max(2000).optional(),
});

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export async function POST(request: NextRequest) {
  const user = await authenticateApiRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let validated: z.infer<typeof bookSchema>;
  try {
    validated = bookSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const allowed = await canAccessParentDashboard(user.id, validated.parentId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    !CONFERENCE_TEACHER_IDS.includes(
      validated.teacherId as (typeof CONFERENCE_TEACHER_IDS)[number],
    )
  ) {
    return NextResponse.json({ error: "Invalid teacher" }, { status: 400 });
  }

  if (
    !isValidConferenceBooking({
      weekStart: validated.weekStart,
      conferenceDate: validated.conferenceDate,
      timeSlot: validated.timeSlot,
    })
  ) {
    return NextResponse.json({ error: "Invalid date or time slot" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: student, error: studentError } = await adminClient
    .schema("admin")
    .from("students")
    .select("id, child_legal_name, parent_id")
    .eq("id", validated.studentId)
    .eq("parent_id", validated.parentId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (studentError || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const { data: existingStudentBooking } = await adminClient
    .schema("teachers")
    .from("parent_teacher_conference_bookings")
    .select("id")
    .eq("student_id", validated.studentId)
    .eq("season", CONFERENCE_SEASON)
    .eq("status", "confirmed")
    .maybeSingle();

  if (existingStudentBooking) {
    return NextResponse.json(
      {
        error: `${firstName(student.child_legal_name)} already has a conference scheduled`,
      },
      { status: 409 },
    );
  }

  const { data: existingSlot } = await adminClient
    .schema("teachers")
    .from("parent_teacher_conference_bookings")
    .select("id")
    .eq("teacher_id", validated.teacherId)
    .eq("conference_date", validated.conferenceDate)
    .eq("time_slot", validated.timeSlot)
    .eq("status", "confirmed")
    .maybeSingle();

  if (existingSlot) {
    return NextResponse.json(
      { error: "That time was just booked — please pick another" },
      { status: 409 },
    );
  }

  const accommodationNote = validated.accommodationNote?.trim() || null;

  const { error: insertError } = await adminClient
    .schema("teachers")
    .from("parent_teacher_conference_bookings")
    .insert({
      parent_id: validated.parentId,
      student_id: validated.studentId,
      teacher_id: validated.teacherId,
      season: CONFERENCE_SEASON,
      week_start: validated.weekStart,
      conference_date: validated.conferenceDate,
      time_slot: validated.timeSlot,
      format: validated.format,
      accommodation_note: accommodationNote,
      status: "confirmed",
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "That time was just booked — please pick another" },
        { status: 409 },
      );
    }
    console.error("PTC booking insert error:", insertError);
    return NextResponse.json({ error: "Failed to save booking" }, { status: 500 });
  }

  const { data: parentUser } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name, email")
    .eq("id", validated.parentId)
    .maybeSingle();

  const { data: teacherUser } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name")
    .eq("id", validated.teacherId)
    .maybeSingle();

  const parentName = parentUser?.full_name ?? user.email ?? "Parent";
  const parentFirstName = firstName(parentName);
  const childName = firstName(student.child_legal_name);
  const teacherName =
    teacherUser?.full_name ??
    CONFERENCE_TEACHERS.find((t) => t.id === validated.teacherId)?.name ??
    "Teacher";
  const conferenceDateDisplay = formatConferenceDateForDisplay(
    validated.conferenceDate,
  );
  const parentEmail = parentUser?.email ?? user.email ?? "";

  try {
    const { subject, content } = await buildParentTeacherConferenceConfirmationEmail({
      parentFirstName,
      childName,
      teacherName,
      conferenceDate: conferenceDateDisplay,
      timeSlot: validated.timeSlot,
      format: validated.format,
    });

    if (parentEmail) {
      const emailResult = await sendZohoEmail({
        toAddress: parentEmail,
        subject,
        content,
      });

      await adminClient
        .schema("email_logs")
        .from("sends")
        .insert({
          to_address: parentEmail,
          subject,
          status: emailResult.success ? "success" : "error",
          error_message: emailResult.error ?? null,
          sent_at: new Date().toISOString(),
        });
    }
  } catch (err) {
    sendDiscordNotification(
      createErrorEmbed({
        context: "PTC booking — email send",
        error: String(err),
        details: { parentId: validated.parentId, studentId: validated.studentId },
      }),
    ).catch(() => {});
  }

  try {
    await sendDiscordNotification(
      createParentTeacherConferenceEmbed({
        parentName,
        email: parentEmail || "Not provided",
        childName: student.child_legal_name,
        teacherName,
        conferenceDate: conferenceDateDisplay,
        timeSlot: validated.timeSlot,
        format: validated.format,
        accommodationNote,
      }),
    );
  } catch (err) {
    console.error("PTC Discord notification failed:", err);
  }

  return NextResponse.json({ success: true });
}
