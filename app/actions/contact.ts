"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import {
  sendDiscordNotification,
  createContactEmbed,
} from "@/app/lib/discord";

// Validation schema for contact form
const contactSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .max(20, "Phone number is too long")
    .optional(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject is too long"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(2000, "Message is too long"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// Response type for the action
export type ContactResponse = {
  success: boolean;
  message: string;
  error?: string;
};

/**
 * Server Action to submit contact form
 * This runs on the server and inserts data into Supabase
 */
export async function submitContact(
  data: ContactFormData,
): Promise<ContactResponse> {
  try {
    // Validate the input data
    const validated = contactSchema.parse(data);

    // Create Supabase client
    const supabase = await createServerSupabaseClient();

    // Insert into contact.submissions table
    const { error } = await supabase
      .schema("contact")
      .from("submissions")
      .insert({
        name: validated.name,
        email: validated.email,
        phone: validated.phone || null,
        subject: validated.subject,
        message: validated.message,
      });

    if (error) {
      console.error("Supabase error:", error);

      return {
        success: false,
        message: "Failed to submit your message. Please try again.",
        error: error.message,
      };
    }

    // Send Discord notification (non-blocking)
    try {
      const embed = createContactEmbed({
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        subject: validated.subject,
        message: validated.message,
      });
      await sendDiscordNotification(embed);
    } catch (discordError) {
      // Log but don't fail the submission if Discord notification fails
      console.error("Failed to send Discord notification:", discordError);
    }

    return {
      success: true,
      message: "Thank you for reaching out! We'll get back to you soon.",
    };
  } catch (error) {
    console.error("Contact submission error:", error);

    // Handle validation errors
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
