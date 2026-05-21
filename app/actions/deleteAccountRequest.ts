"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createErrorEmbed,
} from "@/app/lib/discord";

const schema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  reason: z.string().max(1000).optional(),
});

export type DeleteAccountRequestData = z.infer<typeof schema>;

export type DeleteAccountRequestResponse = {
  success: boolean;
  message: string;
  error?: string;
};

export async function submitDeleteAccountRequest(
  data: DeleteAccountRequestData,
): Promise<DeleteAccountRequestResponse> {
  try {
    const validated = schema.parse(data);

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .schema("contact")
      .from("account_deletion_requests")
      .insert({
        full_name: validated.full_name,
        email: validated.email,
        reason: validated.reason || null,
      });

    if (error) {
      console.error("Supabase error:", error);
      void sendDiscordNotification(
        createErrorEmbed({
          context: "Account Deletion Request – DB Insert",
          error: error.message,
          details: { email: validated.email },
        }),
      ).catch(() => {});

      return {
        success: false,
        message: "Failed to submit your request. Please try again.",
        error: error.message,
      };
    }

    try {
      await sendDiscordNotification({
        title: "Account Deletion Request",
        color: 0xe74c3c,
        fields: [
          { name: "Name", value: validated.full_name, inline: true },
          { name: "Email", value: validated.email, inline: true },
          {
            name: "Reason",
            value: validated.reason || "Not provided",
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      });
    } catch (discordError) {
      console.error("Failed to send Discord notification:", discordError);
    }

    return {
      success: true,
      message:
        "Your deletion request has been received. We will process it within 30 days and send a confirmation to your email.",
    };
  } catch (error) {
    console.error("Delete account request error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0].message,
        error: "Validation error",
      };
    }

    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
