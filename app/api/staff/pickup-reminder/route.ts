import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  createUnpickedPickupReminderEmbed,
  sendDiscordNotification,
} from "@/app/lib/discord";
import {
  getChicagoDateTimeParts,
  isSchoolYearPickupReminderCronMinute,
  isStudentAwaitingPickup,
} from "@/shared/staff/pickup-reminder";

const NOTIFICATION_TYPE = "unpicked_pickup_reminder";

type AppRow = {
  student_id: string;
  admin_tags: string[] | null;
  program: string | null;
  drop_in_program: string | null;
  preferred_name: string | null;
  child_legal_name: string | null;
};

type RecordRow = {
  student_id: string;
  marked_absent: boolean;
  picked_up_by_name: string | null;
};

type StudentRow = {
  id: string;
  child_legal_name: string | null;
};

function isSchoolYearApp(a: AppRow): boolean {
  return (
    a.program === "school_year_26_27" ||
    a.program === "both" ||
    (a.program === "homeschool_drop_in" &&
      (a.drop_in_program === "school_year_26_27" ||
        a.drop_in_program === "both"))
  );
}

function resolveStudentName(
  studentId: string,
  apps: AppRow[],
  students: StudentRow[],
): string {
  const app = apps.find((a) => a.student_id === studentId);
  const student = students.find((s) => s.id === studentId);
  if (app?.preferred_name?.trim()) return app.preferred_name.trim();
  if (app?.child_legal_name?.trim()) return app.child_legal_name.trim();
  if (student?.child_legal_name?.trim()) return student.child_legal_name.trim();
  return "Student";
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isCron =
      process.env.CRON_SECRET && token === process.env.CRON_SECRET;

    if (!isCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    if (!isSchoolYearPickupReminderCronMinute(now)) {
      return NextResponse.json({ skipped: true, reason: "outside_window" });
    }

    const { ymd: date } = getChicagoDateTimeParts(now);
    const db = createAdminClient();

    const [appsRes, studentsRes, recordsRes] = await Promise.all([
      db
        .schema("parent_app")
        .from("applications")
        .select(
          "student_id, admin_tags, program, drop_in_program, preferred_name, child_legal_name",
        )
        .eq("status", "enrolled"),
      db
        .schema("admin")
        .from("students")
        .select("id, child_legal_name")
        .eq("is_deleted", false),
      db
        .schema("attendance")
        .from("school_year_records")
        .select("student_id, marked_absent, picked_up_by_name")
        .eq("date", date),
    ]);

    if (appsRes.error) throw new Error(appsRes.error.message);
    if (studentsRes.error) throw new Error(studentsRes.error.message);
    if (recordsRes.error) throw new Error(recordsRes.error.message);

    const apps = (appsRes.data ?? []) as AppRow[];
    const enrolledIds = new Set(
      apps
        .filter(
          (a) =>
            isSchoolYearApp(a) &&
            !(a.admin_tags ?? []).includes("Don't Include"),
        )
        .map((a) => a.student_id),
    );

    const students = (studentsRes.data ?? []) as StudentRow[];
    const records = (recordsRes.data ?? []) as RecordRow[];

    const unpickedIds = records
      .filter(
        (r) =>
          enrolledIds.has(r.student_id) &&
          isStudentAwaitingPickup(r),
      )
      .map((r) => r.student_id);

    if (unpickedIds.length === 0) {
      return NextResponse.json({ sent: false, count: 0, date });
    }

    const studentNames = unpickedIds
      .map((id) => resolveStudentName(id, apps, students))
      .sort((a, b) => a.localeCompare(b));

    const logRes = await db
      .schema("admin")
      .from("staff_notification_log")
      .insert({
        notification_type: NOTIFICATION_TYPE,
        date,
      })
      .select("id")
      .maybeSingle();

    if (logRes.error) {
      if (logRes.error.code === "23505") {
        return NextResponse.json({
          sent: false,
          count: unpickedIds.length,
          date,
          reason: "already_sent",
        });
      }
      throw new Error(logRes.error.message);
    }

    const embed = createUnpickedPickupReminderEmbed({
      date,
      studentNames,
      count: studentNames.length,
    });

    await sendDiscordNotification(
      embed,
      process.env.DISCORD_STUDENT_WEBHOOK_URL,
    );

    return NextResponse.json({
      sent: true,
      count: studentNames.length,
      date,
    });
  } catch (error) {
    console.error("Pickup reminder cron error:", error);
    return NextResponse.json(
      {
        error: "Failed to process pickup reminder",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
