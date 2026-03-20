"use server";

import { createServerSupabaseClient } from "@/app/lib/supabase-server";

export async function updateWaitlistTags(
  submissionId: string,
  tags: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .schema("waitlist")
      .from("submissions")
      .update({ tags })
      .eq("id", submissionId);

    if (error) {
      console.error("Error updating waitlist tags:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating waitlist tags:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateContactTags(
  submissionId: string,
  tags: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .schema("contact")
      .from("submissions")
      .update({ tags })
      .eq("id", submissionId);

    if (error) {
      console.error("Error updating contact tags:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating contact tags:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
