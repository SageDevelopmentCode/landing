import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createTeacherClockInEmbed,
  createTeacherClockOutEmbed,
  createStudentCheckInEmbed,
  createStudentCheckOutEmbed,
  createHelpRequestEmbed,
  createVolunteerInterestEmbed,
  createAppErrorEmbed,
  createPaystubSubmittedEmbed,
  createSpecialRequestEmbed,
} from "@/app/lib/discord";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, data } = await request.json();

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing type or data" },
        { status: 400 },
      );
    }

    if (type === "clock_in") {
      const { teacherName, clockInAt } = data;
      if (!teacherName || !clockInAt) {
        return NextResponse.json(
          { error: "clock_in requires teacherName and clockInAt" },
          { status: 400 },
        );
      }
      const embed = createTeacherClockInEmbed({ teacherName, clockInAt });
      await sendDiscordNotification(
        embed,
        process.env.DISCORD_EMPLOYEE_WEBHOOK_URL,
      );
      return NextResponse.json({ success: true });
    }

    if (type === "clock_out") {
      const { teacherName, clockInAt, clockOutAt } = data;
      if (!teacherName || !clockInAt || !clockOutAt) {
        return NextResponse.json(
          {
            error: "clock_out requires teacherName, clockInAt, and clockOutAt",
          },
          { status: 400 },
        );
      }
      const embed = createTeacherClockOutEmbed({
        teacherName,
        clockInAt,
        clockOutAt,
      });
      await sendDiscordNotification(
        embed,
        process.env.DISCORD_EMPLOYEE_WEBHOOK_URL,
      );
      return NextResponse.json({ success: true });
    }

    if (type === "student_check_in") {
      const { studentName, checkedInAt, program, classroom } = data;
      if (!studentName || !checkedInAt) {
        return NextResponse.json(
          { error: "student_check_in requires studentName and checkedInAt" },
          { status: 400 },
        );
      }
      const embed = createStudentCheckInEmbed({
        studentName,
        checkedInAt,
        program,
        classroom,
      });
      await sendDiscordNotification(
        embed,
        process.env.DISCORD_STUDENT_WEBHOOK_URL,
      );
      return NextResponse.json({ success: true });
    }

    if (type === "student_check_out") {
      const { studentName, checkedInAt, checkedOutAt, program, classroom } =
        data;
      if (!studentName || !checkedInAt || !checkedOutAt) {
        return NextResponse.json(
          {
            error:
              "student_check_out requires studentName, checkedInAt, and checkedOutAt",
          },
          { status: 400 },
        );
      }
      const embed = createStudentCheckOutEmbed({
        studentName,
        checkedInAt,
        checkedOutAt,
        program,
        classroom,
      });
      await sendDiscordNotification(
        embed,
        process.env.DISCORD_STUDENT_WEBHOOK_URL,
      );
      return NextResponse.json({ success: true });
    }

    if (type === "help_request") {
      const {
        parentName,
        parentEmail,
        description,
        helpRequestId,
        screenName,
        attachmentCount,
      } = data;
      if (!parentName || !parentEmail || !description || !helpRequestId) {
        return NextResponse.json(
          {
            error:
              "help_request requires parentName, parentEmail, description, and helpRequestId",
          },
          { status: 400 },
        );
      }
      const embed = createHelpRequestEmbed({
        parentName,
        parentEmail,
        description,
        helpRequestId,
        pageUrl: screenName ?? null,
        attachmentCount:
          typeof attachmentCount === "number" ? attachmentCount : 0,
      });
      await sendDiscordNotification(embed, process.env.DISCORD_WEBHOOK_URL);
      return NextResponse.json({ success: true });
    }

    if (type === "volunteer_interest") {
      const { parentName, skills, helpAreas, availability, notes } = data;
      if (!parentName || !skills || !helpAreas || !availability) {
        return NextResponse.json(
          {
            error:
              "volunteer_interest requires parentName, skills, helpAreas, and availability",
          },
          { status: 400 },
        );
      }
      const embed = createVolunteerInterestEmbed({
        parentName,
        skills,
        helpAreas,
        availability,
        notes: notes ?? null,
      });
      await sendDiscordNotification(embed, process.env.DISCORD_WEBHOOK_URL);
      return NextResponse.json({ success: true });
    }

    if (type === "app_error") {
      const { error, area, userId, userEmail } = data;
      if (!error || !area) {
        return NextResponse.json(
          { error: "app_error requires error and area" },
          { status: 400 },
        );
      }
      const embed = createAppErrorEmbed({ error, area, userId, userEmail });
      await sendDiscordNotification(embed, process.env.DISCORD_MOBILE_WEBHOOK_URL);
      return NextResponse.json({ success: true });
    }

    if (type === "dropoff_time_selected" || type === "dropoff_time_updated") {
      const { slot, slotLabel } = data;
      if (!slot || !slotLabel) {
        return NextResponse.json(
          { error: "dropoff_time_selected/updated requires slot and slotLabel" },
          { status: 400 },
        );
      }
      const { data: profile } = await supabase
        .schema("admin")
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();
      const isUpdate = type === "dropoff_time_updated";
      await sendDiscordNotification(
        {
          title: isUpdate ? "✏️  Drop-Off Time Updated" : "🚗 Drop-Off Time Selected",
          color: isUpdate ? 0xf59e0b : 0x5e7c68,
          fields: [
            {
              name: "Parent",
              value: profile?.full_name ?? user.email ?? "Unknown",
              inline: true,
            },
            { name: "Slot", value: `${slotLabel} AM`, inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
        process.env.DISCORD_WEBHOOK_URL,
      );
      return NextResponse.json({ success: true });
    }

    if (type === "paystub_submitted") {
      const { teacherName, teacherEmail, periodStart, periodEnd, totalHours, hourlyRate, grossPay } = data;
      if (!teacherName || !periodStart || !periodEnd || !totalHours || !hourlyRate || !grossPay) {
        return NextResponse.json(
          {
            error:
              "paystub_submitted requires teacherName, teacherEmail, periodStart, periodEnd, totalHours, hourlyRate, grossPay",
          },
          { status: 400 },
        );
      }
      const embed = createPaystubSubmittedEmbed({
        teacherName,
        teacherEmail: teacherEmail ?? "",
        periodStart,
        periodEnd,
        totalHours,
        hourlyRate,
        grossPay,
      });
      await sendDiscordNotification(embed, process.env.DISCORD_EMPLOYEE_WEBHOOK_URL);
      return NextResponse.json({ success: true });
    }

    if (type === "paystub_status_changed") {
      const { teacherName, newStatus, periodStart, periodEnd, grossPay } = data;
      if (!teacherName || !newStatus || !periodStart || !periodEnd || !grossPay) {
        return NextResponse.json(
          {
            error:
              "paystub_status_changed requires teacherName, newStatus, periodStart, periodEnd, grossPay",
          },
          { status: 400 },
        );
      }
      await sendDiscordNotification(
        {
          title: newStatus === "paid" ? "💸 Paystub Marked Paid" : "✅ Paystub Approved",
          color: newStatus === "paid" ? 0x4a7c59 : 0x3b82f6,
          fields: [
            { name: "Teacher", value: teacherName, inline: true },
            { name: "Period", value: `${periodStart} → ${periodEnd}`, inline: true },
            { name: "Gross Pay", value: `$${grossPay}`, inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
        process.env.DISCORD_EMPLOYEE_WEBHOOK_URL,
      );
      return NextResponse.json({ success: true });
    }

    if (type === "special_request_created") {
      const { studentName, category, noteText } = data;
      if (!studentName || !category || !noteText) {
        return NextResponse.json(
          { error: "special_request_created requires studentName, category, and noteText" },
          { status: 400 },
        );
      }
      const embed = createSpecialRequestEmbed({ studentName, category, noteText });
      await sendDiscordNotification(embed, process.env.DISCORD_WEBHOOK_URL);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: `Unknown type: ${type}` },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error sending Discord notification:", error);
    return NextResponse.json(
      {
        error: "Failed to send Discord notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
