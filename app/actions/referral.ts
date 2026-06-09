"use server";

import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createErrorEmbed,
  createReferralEmbed,
} from "@/app/lib/discord";
import {
  buildReferralConfirmationEmail,
  buildReferralInviteEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

const referralSchema = z.object({
  referrerName: z.string().min(1, "Your name is required").max(100),
  referrerEmail: z.string().email("Please enter a valid email address"),
  referrerPhone: z.string().max(20).optional(),
  referredName: z.string().min(1, "Their name is required").max(100),
  referredEmail: z.string().email("Please enter a valid email for the referred family"),
  referredPhone: z.string().max(20).optional(),
  childAge: z.number().int().min(1).max(18).optional(),
  message: z.string().max(1000).optional(),
});

export type ReferralFormData = z.infer<typeof referralSchema>;

export type ReferralResponse = {
  success: boolean;
  message: string;
  error?: string;
};

export async function submitReferral(
  data: ReferralFormData,
): Promise<ReferralResponse> {
  try {
    const validated = referralSchema.parse(data);

    const supabase = createAdminClient();

    const { error } = await supabase
      .schema("marketing")
      .from("referral_submissions")
      .insert({
        referrer_name: validated.referrerName,
        referrer_email: validated.referrerEmail,
        referrer_phone: validated.referrerPhone || null,
        referred_name: validated.referredName,
        referred_email: validated.referredEmail,
        referred_phone: validated.referredPhone || null,
        child_age: validated.childAge || null,
        message: validated.message || null,
      });

    if (error) {
      console.error("Supabase referral insert error:", error);
      void sendDiscordNotification(
        createErrorEmbed({
          context: "Referral – DB Insert",
          error: error.message,
          details: { referrerEmail: validated.referrerEmail },
        }),
      ).catch(() => {});
      return {
        success: false,
        message: "Failed to submit referral. Please try again.",
        error: error.message,
      };
    }

    // Email to referrer — confirmation
    try {
      const { subject, content } = await buildReferralConfirmationEmail({
        referrerName: validated.referrerName,
        referredName: validated.referredName,
      });
      await sendZohoEmail({ toAddress: validated.referrerEmail, subject, content });
    } catch (e) {
      console.error("Failed to send referral confirmation email:", e);
    }

    // Email to referred family — rich invite
    try {
      const { subject, content } = await buildReferralInviteEmail({
        referrerName: validated.referrerName,
        referredName: validated.referredName,
      });
      await sendZohoEmail({ toAddress: validated.referredEmail, subject, content });
    } catch (e) {
      console.error("Failed to send referral invite email:", e);
    }

    // Discord notification
    try {
      await sendDiscordNotification(
        createReferralEmbed({
          referrerName: validated.referrerName,
          referrerEmail: validated.referrerEmail,
          referrerPhone: validated.referrerPhone,
          referredName: validated.referredName,
          referredEmail: validated.referredEmail,
          referredPhone: validated.referredPhone,
          childAge: validated.childAge,
          message: validated.message,
        }),
      );
    } catch (e) {
      console.error("Failed to send Discord referral notification:", e);
    }

    return {
      success: true,
      message: "Referral submitted! We'll reach out to the family soon.",
    };
  } catch (error) {
    console.error("Referral submission error:", error);
    if (!(error instanceof z.ZodError)) {
      void sendDiscordNotification(
        createErrorEmbed({
          context: "Referral – Unexpected Error",
          error: error instanceof Error ? error.message : String(error),
        }),
      ).catch(() => {});
    }
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0]?.message ?? "Validation error", error: "Validation error" };
    }
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
