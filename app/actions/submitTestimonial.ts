"use server"

import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase-server"
import { sendDiscordNotification, createTestimonialEmbed } from "@/app/lib/discord"

export async function submitTestimonial(opts: {
  testimonial: string
  childName: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const adminClient = createAdminClient()

  const { data: adminUser } = await adminClient
    .schema("admin")
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single()

  const parentName = adminUser?.full_name ?? ""
  const parentEmail = user.email ?? ""

  const { error } = await adminClient
    .schema("marketing")
    .from("testimonials")
    .insert({
      parent_id: user.id,
      parent_name: parentName,
      parent_email: parentEmail,
      child_name: opts.childName,
      testimonial: opts.testimonial,
    })

  if (error) return { success: false, error: error.message }

  void sendDiscordNotification(
    createTestimonialEmbed({
      parentName,
      parentEmail,
      childName: opts.childName,
      testimonial: opts.testimonial,
    })
  ).catch(() => {})

  return { success: true }
}
