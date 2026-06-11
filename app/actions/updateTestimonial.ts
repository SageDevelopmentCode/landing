"use server"

import { createAdminClient } from "@/app/lib/supabase-server"

export async function updateTestimonialStatus(
  id: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .schema("marketing")
    .from("testimonials")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function updateTestimonialGiftCard(
  id: string,
  sent: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .schema("marketing")
    .from("testimonials")
    .update({ gift_card_sent: sent, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function updateTestimonialNotes(
  id: string,
  admin_notes: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .schema("marketing")
    .from("testimonials")
    .update({ admin_notes, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
