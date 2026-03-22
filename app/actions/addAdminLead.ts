"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import { LeadStatus } from "@/app/types/lead-status";

const addAdminLeadSchema = z.object({
  parentName: z
    .string()
    .min(1, "Parent/Guardian name is required")
    .max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().max(20, "Phone number is too long").optional(),
  childName: z
    .string()
    .min(1, "Child name is required")
    .max(100, "Name is too long"),
  childAge: z
    .number()
    .int()
    .min(1, "Age must be at least 1")
    .max(18, "Age must be 18 or less"),
  programInterest: z.enum(["summer-2026", "school-year-2026", "both", "homeschool_drop_in"], {
    message: "Please select a program",
  }),
  specialInterests: z
    .string()
    .max(500, "Special interests text is too long")
    .optional(),
  status: z.string().min(1, "Status is required"),
});

export type AddAdminLeadData = z.infer<typeof addAdminLeadSchema>;

export type AddAdminLeadResponse = {
  success: boolean;
  message: string;
  leadId?: string;
  error?: string;
};

export async function addAdminLead(
  data: AddAdminLeadData
): Promise<AddAdminLeadResponse> {
  try {
    const validated = addAdminLeadSchema.parse(data);

    const supabase = await createServerSupabaseClient();

    const { data: inserted, error } = await supabase
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
        status: validated.status as LeadStatus,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return {
        success: false,
        message: "Failed to add lead. Please try again.",
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Lead added successfully.",
      leadId: inserted.id,
    };
  } catch (error) {
    console.error("Add admin lead error:", error);

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
