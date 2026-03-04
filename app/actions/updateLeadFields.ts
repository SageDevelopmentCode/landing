"use server";

import { createServerSupabaseClient } from "@/app/lib/supabase-server";

export type UpdateLeadFieldsResponse = { success: boolean; error?: string };

export async function updateWaitlistLead(
  id: string,
  data: {
    parent_name: string;
    email: string;
    phone: string;
    child_name: string;
    child_age: number | null;
    notes: string | null;
  }
): Promise<UpdateLeadFieldsResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .schema("waitlist")
      .from("submissions")
      .update(data)
      .eq("id", id);

    if (error) {
      console.error("Error updating waitlist lead:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating waitlist lead:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateContactLead(
  id: string,
  data: {
    name: string;
    email: string;
    phone: string;
    message: string;
  }
): Promise<UpdateLeadFieldsResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .schema("contact")
      .from("submissions")
      .update(data)
      .eq("id", id);

    if (error) {
      console.error("Error updating contact lead:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating contact lead:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
