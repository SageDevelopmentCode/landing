"use server";

import { z } from "zod";
import { createAdminClient } from "@/app/lib/supabase-server";
import { sendDiscordNotification, createTourBookingEmbed, createErrorEmbed } from "@/app/lib/discord";
import { sendZohoEmail, buildTourConfirmationEmail } from "@/app/lib/zoho";

const schema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().max(20).optional(),
  child_name: z.string().min(1, "Child's name is required").max(100),
  child_grade: z.string().min(1, "Grade is required"),
  num_children: z.number().int().min(1).max(5),
  tour_date: z.string().min(1, "Date is required"),
  tour_time: z.string().min(1, "Time is required"),
  how_did_you_hear: z.string().min(1, "Please select how you heard about us"),
  accommodations: z.string().max(1000).optional(),
});

export type SubmitTourBookingData = z.infer<typeof schema>;

// Format YYYY-MM-DD to "Monday, April 27, 2026"
function formatTourDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function submitTourBooking(
  data: SubmitTourBookingData
): Promise<{ success: boolean; message: string }> {
  try {
    const validated = schema.parse(data);
    const supabase = createAdminClient();

    const { data: booking, error } = await supabase
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
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      sendDiscordNotification(
        createErrorEmbed({
          context: "Tour booking submission",
          error: error.message,
          details: {
            email: validated.email,
            tour_date: validated.tour_date,
            tour_time: validated.tour_time,
          },
        }),
      ).catch(() => {});
      return { success: false, message: "Failed to submit booking. Please try again." };
    }

    // Block this date+time so future visitors can't book the same slot
    await supabase
      .schema("marketing")
      .from("tour_unavailability")
      .insert({
        unavailable_date: validated.tour_date,
        unavailable_time: validated.tour_time,
        reason: "Booked",
        is_recurring: false,
        booking_id: booking.id,
      });

    const formattedDate = formatTourDate(validated.tour_date);

    // Discord notification (non-blocking)
    try {
      await sendDiscordNotification(
        createTourBookingEmbed({
          firstName: validated.first_name,
          lastName: validated.last_name,
          email: validated.email,
          phone: validated.phone,
          childName: validated.child_name,
          childGrade: validated.child_grade,
          numChildren: validated.num_children,
          tourDate: formattedDate,
          tourTime: validated.tour_time,
          howDidYouHear: validated.how_did_you_hear,
          accommodations: validated.accommodations,
        })
      );
    } catch (discordError) {
      console.error("Failed to send Discord notification:", discordError);
    }

    // Confirmation email to the family (non-blocking)
    try {
      const { subject, content } = await buildTourConfirmationEmail({
        firstName: validated.first_name,
        tourDate: formattedDate,
        tourTime: validated.tour_time,
      });
      await sendZohoEmail({ toAddress: validated.email, subject, content });
    } catch (emailError) {
      console.error("Failed to send tour confirmation email:", emailError);
    }

    return { success: true, message: "Tour booked successfully." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0]?.message || "Validation error" };
    }
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}
