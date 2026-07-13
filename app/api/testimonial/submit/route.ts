import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createTestimonialEmbed,
  createErrorEmbed,
} from "@/app/lib/discord";
import {
  sendZohoEmail,
  buildTestimonialConfirmationEmail,
} from "@/app/lib/zoho";

const testimonialSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  testimonial: z.string().min(1, "Testimonial is required"),
  featureConsent: z.enum(["yes", "ask"]).nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = testimonialSchema.parse(body);

    const { firstName, lastName, email, testimonial, featureConsent } = validated;

    const supabase = createAdminClient();

    const { error: insertError } = await supabase
      .schema("marketing")
      .from("testimonials")
      .insert({
        parent_id: null,
        parent_name: `${firstName} ${lastName}`,
        parent_email: email,
        child_name: lastName,
        testimonial,
        feature_consent: featureConsent ?? null,
      });

    if (insertError) {
      console.error("Failed to insert testimonial:", insertError);
      return NextResponse.json({ error: "Failed to save testimonial" }, { status: 500 });
    }

    // Send confirmation email
    try {
      const { subject, content } = await buildTestimonialConfirmationEmail({ firstName });
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
          context: "Testimonial — email send",
          error: String(err),
          details: { email },
        })
      ).catch(() => {});
    }

    // Send Discord notification
    try {
      await sendDiscordNotification(
        createTestimonialEmbed({
          parentName: `${firstName} ${lastName}`,
          parentEmail: email,
          childName: lastName,
          testimonial,
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
    console.error("Testimonial submit error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
