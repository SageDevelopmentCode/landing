import { NextRequest, NextResponse } from "next/server";
import { sendActivityPreferenceReminder } from "@/app/lib/activity-preference-reminder";
import { requireStaffFromRequest } from "../_auth";

export async function POST(request: NextRequest) {
  const auth = await requireStaffFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { studentId, activityId } = body ?? {};

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 },
      );
    }

    const result = await sendActivityPreferenceReminder({
      studentId,
      activityId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          emailSent: result.emailSent,
          pushSent: result.pushSent,
          error: result.error ?? "Failed to send reminder",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      emailSent: result.emailSent,
      pushSent: result.pushSent,
    });
  } catch (err) {
    console.error("[mobile/staff/activity-preference-reminder]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
