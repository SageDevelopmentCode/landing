"use server";

import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import { LeadStatus } from "../types/lead-status";

export async function updateWaitlistStatus(
  submissionId: string,
  newStatus: LeadStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .schema("waitlist")
      .from("submissions")
      .update({ status: newStatus })
      .eq("id", submissionId);

    if (error) {
      console.error("Error updating waitlist status:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating waitlist status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateContactStatus(
  submissionId: string,
  newStatus: LeadStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .schema("contact")
      .from("submissions")
      .update({ status: newStatus })
      .eq("id", submissionId);

    if (error) {
      console.error("Error updating contact status:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating contact status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
