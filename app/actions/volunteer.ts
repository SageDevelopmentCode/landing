"use server";

import { z } from "zod";
import {
  sendDiscordNotification,
  createErrorEmbed,
} from "@/app/lib/discord";
import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/app/lib/supabase-server";

const volunteerSchema = z.object({
  skills: z.string().min(1, "Skills & experience is required").max(2000),
  helpAreas: z.array(z.string()).min(1, "Please select at least one area"),
  availability: z.array(z.string()).min(1, "Please select at least one time"),
  notes: z.string().max(2000).optional(),
});

export type VolunteerFormData = z.infer<typeof volunteerSchema>;

export type VolunteerResponse = {
  success: boolean;
  message: string;
  error?: string;
};

export async function submitVolunteerInterest(
  data: VolunteerFormData,
): Promise<VolunteerResponse> {
  try {
    const {
      data: { user },
    } = await (await createServerSupabaseClient()).auth.getUser();
    if (!user) {
      return {
        success: false,
        message: "Please sign in again to send your volunteer interest.",
        error: "Unauthorized",
      };
    }

    const validated = volunteerSchema.parse(data);

    const adminClient = createAdminClient();
    const { data: parentRow } = await adminClient
      .schema("admin")
      .from("users")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    const parentName = (parentRow?.full_name as string | null | undefined)?.trim() || "Unknown";
    const parentEmail = (parentRow?.email as string | null | undefined) || user.email || "Unknown";

    const { error: dbError } = await adminClient
      .schema("admin")
      .from("volunteer_interests")
      .insert({
        parent_id: user.id,
        skills: validated.skills,
        help_areas: validated.helpAreas,
        availability: validated.availability,
        notes: validated.notes ?? null,
      });

    if (dbError) {
      console.error("Failed to save volunteer interest:", dbError);
      void sendDiscordNotification(
        createErrorEmbed({
          context: "Volunteer Interest – DB Insert Error",
          error: dbError.message,
        }),
      ).catch(() => {});
      return { success: false, message: "Failed to save your submission. Please try again." };
    }

    const embed = {
      title: "🙋 New Volunteer Interest",
      color: 0x4a7c59,
      fields: [
        { name: "Parent", value: parentName, inline: true },
        { name: "Email", value: parentEmail, inline: true },
        {
          name: "Skills & Experience",
          value: validated.skills,
          inline: false,
        },
        {
          name: "How They'd Like to Help",
          value: validated.helpAreas.join(", "),
          inline: false,
        },
        {
          name: "Availability",
          value: validated.availability.join(", "),
          inline: false,
        },
        ...(validated.notes
          ? [{ name: "Additional Notes", value: validated.notes, inline: false }]
          : []),
      ],
      timestamp: new Date().toISOString(),
    };

    try {
      await sendDiscordNotification(embed);
    } catch (discordError) {
      console.error("Failed to send Discord notification:", discordError);
    }

    return {
      success: true,
      message: "Thank you for your interest! We'll be in touch soon.",
    };
  } catch (error) {
    console.error("Volunteer submission error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0].message,
        error: "Validation error",
      };
    }

    void sendDiscordNotification(
      createErrorEmbed({
        context: "Volunteer Interest – Unexpected Error",
        error: error instanceof Error ? error.message : String(error),
      }),
    ).catch(() => {});

    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
