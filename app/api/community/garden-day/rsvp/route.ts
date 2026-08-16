import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createCommunityGardenDayRSVPEmbed,
  createErrorEmbed,
} from "@/app/lib/discord";
import {
  sendZohoEmail,
  buildCommunityGardenDayRSVPEmail,
} from "@/app/lib/zoho";

const rsvpSchema = z.object({
  parentName: z.string().min(1, "Parent name is required").max(100),
  email: z.string().email("Valid email is required"),
  phone: z
    .string()
    .max(20)
    .refine(
      (val) => !val || val.replace(/\D/g, "").length >= 10,
      "Please enter a valid 10-digit phone number"
    )
    .optional(),
  adultsAttending: z.string().min(1, "Please indicate how many adults are attending"),
  childrenAttending: z.string().min(1, "Please indicate how many children are attending"),
  isSageFieldFamily: z.enum(["yes", "no", "interested"]),
  hearAboutUs: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = rsvpSchema.parse(body);

    const {
      parentName,
      email,
      phone,
      adultsAttending,
      childrenAttending,
      isSageFieldFamily,
      hearAboutUs,
      notes,
    } = validated;

    const supabase = createAdminClient();

    const { error: insertError } = await supabase
      .schema("marketing")
      .from("community_garden_day_rsvps")
      .insert({
        parent_name: parentName,
        email,
        phone: phone ?? null,
        adults_attending: adultsAttending,
        children_attending: childrenAttending,
        is_sage_field_family: isSageFieldFamily,
        hear_about_us: hearAboutUs ?? null,
        notes: notes ?? null,
      });

    if (insertError) {
      console.error("Failed to insert Community Garden Day RSVP:", insertError);

      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This email has already been registered for Community Garden Day." },
          { status: 409 },
        );
      }

      void sendDiscordNotification(
        createErrorEmbed({
          context: "Community Garden Day RSVP — DB insert",
          error: insertError.message,
          details: { email },
        }),
      ).catch(() => {});

      return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 });
    }

    const firstName = parentName.split(" ")[0];

    try {
      const { subject, content } = await buildCommunityGardenDayRSVPEmail({
        firstName,
      });
      const emailResult = await sendZohoEmail({ toAddress: email, subject, content });

      if (emailResult.success) {
        await supabase
          .schema("email_logs")
          .from("sends")
          .insert({
            to_address: email,
            subject,
            status: "success",
            sent_at: new Date().toISOString(),
          });
      } else {
        await supabase
          .schema("email_logs")
          .from("sends")
          .insert({
            to_address: email,
            subject,
            status: "error",
            error_message: emailResult.error ?? "Unknown error",
            sent_at: new Date().toISOString(),
          });
      }
    } catch (err) {
      sendDiscordNotification(
        createErrorEmbed({
          context: "Community Garden Day RSVP — email send",
          error: String(err),
          details: { email },
        }),
      ).catch(() => {});
    }

    try {
      await sendDiscordNotification(
        createCommunityGardenDayRSVPEmbed({
          parentName,
          email,
          phone,
          adultsAttending,
          childrenAttending,
          isSageFieldFamily,
          hearAboutUs,
          notes,
        }),
      );
    } catch (err) {
      console.error("Discord notification failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Community Garden Day RSVP error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
