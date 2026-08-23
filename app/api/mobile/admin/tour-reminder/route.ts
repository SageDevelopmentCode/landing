import { NextRequest, NextResponse } from "next/server";
import { sendTourReminderEmail } from "@/app/actions/sendTourReminderEmail";
import { requireSuperAdminFromRequest } from "../_auth";

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { firstName, email, tourDate, tourTime } = body ?? {};

    if (!firstName || !email || !tourDate || !tourTime) {
      return NextResponse.json(
        { error: "firstName, email, tourDate, and tourTime are required" },
        { status: 400 },
      );
    }

    const result = await sendTourReminderEmail({
      firstName,
      email,
      tourDate,
      tourTime,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[mobile/admin/tour-reminder]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
