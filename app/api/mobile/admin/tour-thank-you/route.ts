import { NextRequest, NextResponse } from "next/server";
import { sendTourThankYouEmail } from "@/app/actions/sendTourThankYouEmail";
import { requireSuperAdminFromRequest } from "../_auth";

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { firstName, email } = body ?? {};

    if (!firstName || !email) {
      return NextResponse.json(
        { error: "firstName and email are required" },
        { status: 400 },
      );
    }

    const result = await sendTourThankYouEmail({ firstName, email });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[mobile/admin/tour-thank-you]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
