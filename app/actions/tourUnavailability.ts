"use server";

import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";

export type TourUnavailability = {
  id: string;
  unavailable_date: string;
  unavailable_time: string | null;
  reason: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
};

const addSchema = z.object({
  unavailable_date: z.string().min(1, "Date is required"),
  unavailable_time: z.string().nullable().optional(),
  reason: z.string().max(200).nullable().optional(),
  is_recurring: z.boolean().default(false),
});

export type AddTourUnavailabilityData = z.infer<typeof addSchema>;

export async function addTourUnavailability(
  data: AddTourUnavailabilityData
): Promise<{ success: boolean; message: string; record?: TourUnavailability }> {
  try {
    const validated = addSchema.parse(data);
    const supabase = createAdminClient();

    const { data: inserted, error } = await supabase
      .schema("marketing")
      .from("tour_unavailability")
      .insert({
        unavailable_date: validated.unavailable_date,
        unavailable_time: validated.unavailable_time || null,
        reason: validated.reason || null,
        is_recurring: validated.is_recurring,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, message: "Failed to add block. Please try again." };
    }

    return { success: true, message: "Block added.", record: inserted as TourUnavailability };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0]?.message || "Validation error" };
    }
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function deleteTourUnavailability(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .schema("marketing")
      .from("tour_unavailability")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, message: "Failed to delete block." };
    }

    return { success: true, message: "Block removed." };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}
