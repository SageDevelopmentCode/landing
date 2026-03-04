"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createWaitlistEmbed,
} from "@/app/lib/discord";
import {
  createTrelloCard,
  createWaitlistCard,
} from "@/app/lib/trello";

// Validation schema for waitlist form
const waitlistSchema = z.object({
  parentName: z
    .string()
    .min(1, "Parent/Guardian name is required")
    .max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .max(20, "Phone number is too long")
    .optional(),
  childName: z
    .string()
    .min(1, "Child name is required")
    .max(100, "Name is too long"),
  childAge: z
    .number()
    .int()
    .min(1, "Age must be at least 1")
    .max(18, "Age must be 18 or less"),
  programInterest: z.enum(["summer-2026", "school-year-2026", "both"], {
    message: "Please select a program",
  }),
  specialInterests: z
    .string()
    .max(500, "Special interests text is too long")
    .optional(),
});

export type WaitlistFormData = z.infer<typeof waitlistSchema>;

// Response type for the action
export type WaitlistResponse = {
  success: boolean;
  message: string;
  error?: string;
};

/**
 * Server Action to submit waitlist form
 * This runs on the server and inserts data into Supabase
 */
export async function submitWaitlist(
  data: WaitlistFormData,
): Promise<WaitlistResponse> {
  try {
    // Validate the input data
    const validated = waitlistSchema.parse(data);

    // Create Supabase client
    const supabase = await createServerSupabaseClient();

    // Insert into waitlist.submissions table
    const { error } = await supabase
      .schema("waitlist")
      .from("submissions")
      .insert({
        parent_name: validated.parentName,
        email: validated.email,
        phone: validated.phone || null,
        child_name: validated.childName,
        child_age: validated.childAge,
        program_interest: validated.programInterest,
        special_interests: validated.specialInterests || null,
      });

    if (error) {
      console.error("Supabase error:", error);

      // Check for duplicate email (if we add a unique constraint later)
      if (error.code === "23505") {
        return {
          success: false,
          message: "This email has already been registered on the waitlist.",
          error: error.message,
        };
      }

      return {
        success: false,
        message: "Failed to submit to waitlist. Please try again.",
        error: error.message,
      };
    }

    // Send Discord notification (non-blocking)
    try {
      const embed = createWaitlistEmbed({
        parentName: validated.parentName,
        email: validated.email,
        phone: validated.phone,
        childName: validated.childName,
        childAge: validated.childAge,
        programInterest: validated.programInterest,
        specialInterests: validated.specialInterests,
      });
      await sendDiscordNotification(embed);
    } catch (discordError) {
      // Log but don't fail the submission if Discord notification fails
      console.error("Failed to send Discord notification:", discordError);
    }

    // Create Trello card (non-blocking)
    try {
      const card = await createWaitlistCard({
        parentName: validated.parentName,
        email: validated.email,
        phone: validated.phone,
        childName: validated.childName,
        childAge: validated.childAge,
        programInterest: validated.programInterest,
        specialInterests: validated.specialInterests,
      });
      await createTrelloCard(card);
    } catch (trelloError) {
      // Log but don't fail the submission if Trello card creation fails
      console.error("Failed to create Trello card:", trelloError);
    }

    return {
      success: true,
      message: "Successfully added to waitlist! We'll be in touch soon.",
    };
  } catch (error) {
    console.error("Waitlist submission error:", error);

    // Handle validation errors
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
