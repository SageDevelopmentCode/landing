import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createSchoolYearCommitmentEmbed,
  createErrorEmbed,
} from "@/app/lib/discord";
import {
  sendZohoEmail,
  buildSchoolYearCommitmentEmail,
} from "@/app/lib/zoho";

const commitmentSchema = z.object({
  intent: z.enum(["yes", "maybe", "no"]),
  firstName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  children: z.array(z.string()).default([]),
  programType: z.enum(["homeschool_dropin", "full_time"]).nullable().optional(),
  notes: z.string().optional(),
  contactMethod: z.enum(["email", "phone"]).default("email"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = commitmentSchema.parse(body);

    const { intent, firstName, email, phone, children, programType, notes, contactMethod } = validated;

    const supabase = createAdminClient();

    const { error: insertError } = await supabase
      .schema("marketing")
      .from("school_year_2026_commitments")
      .insert({
        intent,
        first_name: firstName ?? null,
        email: email || null,
        phone: phone ?? null,
        children: children.filter(Boolean),
        program_type: programType ?? null,
        notes: notes ?? null,
        contact_method: contactMethod,
      });

    if (insertError) {
      console.error("Failed to insert school year commitment:", insertError);
      return NextResponse.json({ error: "Failed to save commitment" }, { status: 500 });
    }

    // Send confirmation email only if they gave an email
    if (contactMethod === "email" && email) {
      try {
        const { subject, content } = await buildSchoolYearCommitmentEmail({
          firstName: firstName || "friend",
        });
        const emailResult = await sendZohoEmail({ toAddress: email, subject, content });

        await supabase
          .schema("email_logs")
          .from("sends")
          .insert({
            to_address: email,
            subject,
            status: emailResult.success ? "success" : "error",
            error_message: emailResult.success ? null : (emailResult.error ?? "Unknown error"),
            sent_at: new Date().toISOString(),
          });
      } catch (err) {
        sendDiscordNotification(
          createErrorEmbed({
            context: "School Year 2026 Commitment — email send",
            error: String(err),
            details: { email: email ?? "" },
          })
        ).catch(() => {});
      }
    }

    // Discord notification
    try {
      await sendDiscordNotification(
        createSchoolYearCommitmentEmbed({
          firstName: firstName ?? null,
          email: email || null,
          phone: phone ?? null,
          intent,
          children: children.filter(Boolean),
          programType: programType ?? null,
          notes: notes ?? null,
          contactMethod,
        })
      );
    } catch (err) {
      console.error("Discord notification failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("School year commitment error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
