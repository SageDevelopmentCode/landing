"use server";

import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import { sendDiscordNotification, createErrorEmbed } from "@/app/lib/discord";

const rsvpSchema = z.object({
  name: z.string().min(1, "Full name is required").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().max(20, "Phone number is too long").optional(),
  adultsAttending: z
    .number()
    .int()
    .min(1, "At least 1 adult must attend")
    .max(10, "Maximum 10 adults"),
  childrenAttending: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .max(10, "Maximum 10 children"),
  notes: z.string().max(1000, "Notes are too long").optional(),
});

export type RSVPFormData = z.infer<typeof rsvpSchema>;

export type RSVPResponse = {
  success: boolean;
  message: string;
  error?: string;
};

export async function submitRSVP(data: RSVPFormData): Promise<RSVPResponse> {
  try {
    const validated = rsvpSchema.parse(data);

    const supabase = createAdminClient();

    const { error } = await supabase
      .schema("marketing")
      .from("open_house_rsvps")
      .insert({
        name: validated.name,
        email: validated.email,
        phone: validated.phone || null,
        adults_attending: validated.adultsAttending,
        children_attending: validated.childrenAttending,
        notes: validated.notes || null,
      });

    if (error) {
      console.error("Supabase error:", error);
      void sendDiscordNotification(
        createErrorEmbed({
          context: "Open House RSVP – DB Insert",
          error: error.message,
          details: { email: validated.email },
        }),
      ).catch(() => {});

      if (error.code === "23505") {
        return {
          success: false,
          message: "This email has already been registered for the open house.",
          error: error.message,
        };
      }

      return {
        success: false,
        message: "Failed to submit RSVP. Please try again.",
        error: error.message,
      };
    }

    // Send Discord notification (non-blocking)
    try {
      const embed = {
        title: "🏡 New Open House RSVP",
        color: 0x5e7c68,
        fields: [
          { name: "Name", value: validated.name, inline: true },
          { name: "Email", value: validated.email, inline: true },
          {
            name: "Phone",
            value: validated.phone || "Not provided",
            inline: true,
          },
          {
            name: "Adults Attending",
            value: String(validated.adultsAttending),
            inline: true,
          },
          {
            name: "Children Attending",
            value: String(validated.childrenAttending),
            inline: true,
          },
          ...(validated.notes
            ? [
                {
                  name: "Notes",
                  value: validated.notes.substring(0, 1024),
                  inline: false,
                },
              ]
            : []),
        ],
        timestamp: new Date().toISOString(),
      };
      await sendDiscordNotification(embed);
    } catch (discordError) {
      console.error("Failed to send Discord notification:", discordError);
    }

    return {
      success: true,
      message: "You're on the list! We'll see you April 18.",
    };
  } catch (error) {
    console.error("RSVP submission error:", error);
    if (!(error instanceof z.ZodError)) {
      void sendDiscordNotification(
        createErrorEmbed({
          context: "Open House RSVP – Unexpected Error",
          error: error instanceof Error ? error.message : String(error),
        }),
      ).catch(() => {});
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.message,
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
