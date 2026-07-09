import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createMeetMissJoyRSVPEmbed,
  createErrorEmbed,
} from "@/app/lib/discord";
import {
  sendZohoEmail,
  buildMeetMissJoyRSVPEmail,
} from "@/app/lib/zoho";

const rsvpSchema = z.object({
  parentName: z.string().min(1, "Parent name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  childName: z.string().min(1, "Child's name is required"),
  childAge: z.number().int().min(1).max(12),
  adultsAttending: z.string().min(1, "Please select how many adults are attending"),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = rsvpSchema.parse(body);

    const { parentName, email, phone, childName, childAge, adultsAttending, notes } = validated;

    const supabase = createAdminClient();

    const { error: insertError } = await supabase
      .schema("marketing")
      .from("meet_miss_joy_rsvps")
      .insert({
        parent_name: parentName,
        email,
        phone: phone ?? null,
        child_name: childName,
        child_age: childAge,
        adults_attending: adultsAttending,
        notes: notes ?? null,
      });

    if (insertError) {
      console.error("Failed to insert Meet Miss Joy RSVP:", insertError);
      return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 });
    }

    // Send confirmation email
    const firstName = parentName.split(" ")[0];
    try {
      const { subject, content } = await buildMeetMissJoyRSVPEmail({ firstName });
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
          context: "Meet Miss Joy RSVP — email send",
          error: String(err),
          details: { email },
        })
      ).catch(() => {});
    }

    // Send Discord notification
    try {
      await sendDiscordNotification(
        createMeetMissJoyRSVPEmbed({
          parentName,
          email,
          phone,
          childName,
          childAge,
          adultsAttending,
          notes,
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
    console.error("Meet Miss Joy RSVP error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
