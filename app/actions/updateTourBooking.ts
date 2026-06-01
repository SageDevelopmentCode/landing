"use server";

import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import type { TourBooking } from "@/app/admin/marketing/page";

const updateTourBookingSchema = z.object({
  id: z.string().uuid(),
  tour_date: z.string().min(1, "Tour date is required"),
  tour_time: z.string().min(1, "Tour time is required"),
});

export type UpdateTourBookingData = z.infer<typeof updateTourBookingSchema>;

export type UpdateTourBookingResponse = {
  success: boolean;
  message: string;
  booking?: TourBooking;
};

export async function updateTourBooking(
  data: UpdateTourBookingData
): Promise<UpdateTourBookingResponse> {
  try {
    const validated = updateTourBookingSchema.parse(data);
    const supabase = createAdminClient();

    const { data: updated, error } = await supabase
      .schema("marketing")
      .from("tour_bookings")
      .update({
        tour_date: validated.tour_date,
        tour_time: validated.tour_time,
      })
      .eq("id", validated.id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, message: "Failed to update booking. Please try again." };
    }

    return { success: true, message: "Booking updated.", booking: updated as TourBooking };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0]?.message || "Validation error" };
    }
    console.error("Update tour booking error:", error);
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}
