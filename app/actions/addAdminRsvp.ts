"use server";

import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import type { OpenHouseRsvp } from "@/app/admin/marketing/page";

const addAdminRsvpSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().max(20, "Phone number is too long").optional(),
  adults_attending: z
    .number()
    .int()
    .min(1, "At least 1 adult is required")
    .max(10, "Maximum 10 adults"),
  children_attending: z
    .number()
    .int()
    .min(0, "Children must be 0 or more")
    .max(10, "Maximum 10 children"),
  notes: z.string().max(500, "Notes are too long").optional(),
});

export type AddAdminRsvpData = z.infer<typeof addAdminRsvpSchema>;

export type AddAdminRsvpResponse = {
  success: boolean;
  message: string;
  rsvp?: OpenHouseRsvp;
  error?: string;
};

export async function addAdminRsvp(
  data: AddAdminRsvpData
): Promise<AddAdminRsvpResponse> {
  try {
    const validated = addAdminRsvpSchema.parse(data);

    const supabase = createAdminClient();

    const { data: inserted, error } = await supabase
      .schema("marketing")
      .from("open_house_rsvps")
      .insert({
        name: validated.name,
        email: validated.email,
        phone: validated.phone || null,
        adults_attending: validated.adults_attending,
        children_attending: validated.children_attending,
        notes: validated.notes || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return {
        success: false,
        message: "Failed to add RSVP. Please try again.",
        error: error.message,
      };
    }

    return {
      success: true,
      message: "RSVP added successfully.",
      rsvp: inserted as OpenHouseRsvp,
    };
  } catch (error) {
    console.error("Add admin RSVP error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || "Validation error",
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
