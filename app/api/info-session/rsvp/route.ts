import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createInfoSessionRSVPEmbed,
  createErrorEmbed,
} from "@/app/lib/discord";
import {
  sendZohoEmail,
  buildInfoSessionRSVPEmail,
} from "@/app/lib/zoho";

const childSchema = z.object({
  name: z.string().min(1),
  age: z.string().min(1),
});

const rsvpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  children: z.array(childSchema).min(1, "At least one child is required"),
  programs: z.array(z.string()).min(1, "Please select at least one program"),
  hearAboutUs: z.string().optional(),
  questions: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = rsvpSchema.parse(body);

    const { firstName, lastName, email, phone, children, programs, hearAboutUs, questions } =
      validated;

    const supabase = createAdminClient();

    const { error: insertError } = await supabase
      .schema("marketing")
      .from("info_session_rsvps")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        children,
        programs,
        hear_about_us: hearAboutUs ?? null,
        questions: questions ?? null,
      });

    if (insertError) {
      console.error("Failed to insert info session RSVP:", insertError);
      return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 });
    }

    // Non-blocking: email + Discord
    (async () => {
      try {
        const { subject, content } = await buildInfoSessionRSVPEmail({ firstName });
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
            context: "Info Session RSVP — email send",
            error: String(err),
            details: { email },
          })
        ).catch(() => {});
      }

      sendDiscordNotification(
        createInfoSessionRSVPEmbed({
          firstName,
          lastName,
          email,
          phone,
          children,
          programs,
          hearAboutUs,
          questions,
        })
      ).catch((err) => console.error("Discord notification failed:", err));
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Info session RSVP error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
