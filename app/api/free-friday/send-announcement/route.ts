import { NextResponse } from "next/server";
import { createAdminClient, createServerSupabaseClient } from "@/app/lib/supabase-server";
import { buildFreeFridayAnnouncementEmail, sendZohoEmail } from "@/app/lib/zoho";
import { sendDiscordNotification, createErrorEmbed } from "@/app/lib/discord";

export async function POST() {
  try {
    // Verify admin session
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch all approved, active applications with parent + child info
    const { data: applications, error: fetchError } = await supabase
      .schema("parent_app")
      .from("applications")
      .select("g1_full_name, g1_email, child_legal_name")
      .eq("approved", true)
      .eq("is_active", true)
      .not("g1_email", "is", null);

    if (fetchError) {
      console.error("Failed to fetch enrolled parents:", fetchError);
      return NextResponse.json({ error: "Failed to fetch recipients" }, { status: 500 });
    }

    // De-duplicate by email — keep first child name per parent
    const recipientMap = new Map<string, { parentName: string; childName: string }>();
    for (const app of applications ?? []) {
      if (!app.g1_email) continue;
      const key = app.g1_email.toLowerCase();
      if (!recipientMap.has(key)) {
        recipientMap.set(key, {
          parentName: app.g1_full_name ?? "there",
          childName: app.child_legal_name ?? "your child",
        });
      }
    }

    const recipients = Array.from(recipientMap.entries()).map(([email, info]) => ({
      email,
      ...info,
    }));

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const { subject, content } = await buildFreeFridayAnnouncementEmail({
          parentName: recipient.parentName,
          childName: recipient.childName,
        });
        const result = await sendZohoEmail({
          toAddress: recipient.email,
          subject,
          content,
        });
        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`${recipient.email}: ${result.error ?? "unknown"}`);
        }
      } catch (err) {
        failed++;
        errors.push(`${recipient.email}: ${String(err)}`);
      }
    }

    if (failed > 0) {
      sendDiscordNotification(
        createErrorEmbed({
          context: "Free Friday Announcement Blast",
          error: `${failed} emails failed to send`,
          details: { errors: errors.slice(0, 5).join("; ") },
        })
      ).catch(() => {});
    }

    return NextResponse.json({ sent, failed, total: recipients.length });
  } catch (error) {
    console.error("Free Friday announcement blast error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
