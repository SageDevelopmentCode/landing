"use server";

import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import type { TourBooking } from "@/app/admin/marketing/page";

const GRADES = [
  "Pre-K", "Kindergarten",
  "1st Grade", "2nd Grade", "3rd Grade", "4th Grade",
  "5th Grade", "6th Grade", "7th Grade", "8th Grade",
] as const;

const HOW_OPTIONS = [
  "google", "social_media", "friend_family", "flyer", "other",
] as const;

const addAdminTourSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().max(20).optional(),
  child_name: z.string().min(1, "Child name is required").max(100),
  child_grade: z.enum(GRADES, { error: "Please select a grade" }),
  num_children: z.number().int().min(1).max(5),
  tour_date: z.string().min(1, "Tour date is required"),
  tour_time: z.string().min(1, "Tour time is required"),
  how_did_you_hear: z.enum(HOW_OPTIONS, { error: "Please select an option" }),
  accommodations: z.string().max(500).optional(),
});

export type AddAdminTourData = z.infer<typeof addAdminTourSchema>;

export type AddAdminTourResponse = {
  success: boolean;
  message: string;
  booking?: TourBooking;
};

export async function addAdminTour(data: AddAdminTourData): Promise<AddAdminTourResponse> {
  try {
    const validated = addAdminTourSchema.parse(data);
    const supabase = createAdminClient();

    const { data: inserted, error } = await supabase
      .schema("marketing")
      .from("tour_bookings")
      .insert({
        first_name: validated.first_name,
        last_name: validated.last_name,
        email: validated.email,
        phone: validated.phone || null,
        child_name: validated.child_name,
        child_grade: validated.child_grade,
        num_children: validated.num_children,
        tour_date: validated.tour_date,
        tour_time: validated.tour_time,
        how_did_you_hear: validated.how_did_you_hear,
        accommodations: validated.accommodations || null,
        status: "pending",
        is_deleted: false,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, message: "Failed to add tour booking. Please try again." };
    }

    return { success: true, message: "Tour booking added successfully.", booking: inserted as TourBooking };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0]?.message || "Validation error" };
    }
    console.error("Add admin tour error:", error);
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}
