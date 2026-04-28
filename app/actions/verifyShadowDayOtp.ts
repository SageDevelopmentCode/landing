'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'
import { sendDiscordNotification, createParentSignupEmbed, createShadowDayBookingEmbed, createErrorEmbed } from '@/app/lib/discord'

export async function verifyShadowDayOtp(formData: FormData): Promise<{ error?: string; redirectTo?: string }> {
  const email = formData.get('email') as string
  const token = formData.get('token') as string
  const fullName = formData.get('fullName') as string | null

  // Booking fields
  const shadowDate = formData.get('shadowDate') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const phone = formData.get('phone') as string | null
  const childName = formData.get('childName') as string
  const childGrade = formData.get('childGrade') as string | null
  const referralSource = formData.get('referralSource') as string | null
  const notes = formData.get('notes') as string | null

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })

  if (error) {
    void sendDiscordNotification(createErrorEmbed({
      context: 'verifyShadowDayOtp – OTP Verify',
      error: error.message,
      details: { email },
    })).catch(() => {})
    return { error: error.message }
  }

  const userId = data.user!.id
  const adminClient = createAdminClient()

  // Create admin.users record if this is a new user
  const { data: existingUser } = await adminClient
    .schema('admin')
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (!existingUser) {
    const { error: insertError } = await adminClient
      .schema('admin')
      .from('users')
      .insert({ id: userId, email, full_name: fullName ?? '', role: 'parent' })

    if (insertError) {
      void sendDiscordNotification(createErrorEmbed({
        context: 'verifyShadowDayOtp – DB Insert user',
        error: insertError.message,
        details: { email, userId },
      })).catch(() => {})
      return { error: `Account setup failed: ${insertError.message}` }
    }

    void sendDiscordNotification(createParentSignupEmbed({ fullName: fullName ?? '', email })).catch(() => {})
  }

  // Upsert the shadow day booking (one booking per user — update if they re-verify)
  const { error: bookingError } = await adminClient
    .schema('marketing')
    .from('shadow_day_bookings')
    .upsert(
      {
        user_id: userId,
        shadow_date: shadowDate,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        child_name: childName,
        child_grade: childGrade || null,
        referral_source: referralSource || null,
        notes: notes || null,
        payment_status: 'pending',
      },
      { onConflict: 'user_id' },
    )

  if (bookingError) {
    void sendDiscordNotification(createErrorEmbed({
      context: 'verifyShadowDayOtp – DB Insert booking',
      error: bookingError.message,
      details: { email, userId, shadowDate },
    })).catch(() => {})
    // Non-fatal: still redirect to dashboard; booking can be retried
  } else {
    void sendDiscordNotification(createShadowDayBookingEmbed({
      firstName,
      lastName,
      email,
      phone: phone || null,
      childName,
      childGrade: childGrade || null,
      shadowDate,
      isNewAccount: !existingUser,
    })).catch(() => {})
  }

  return { redirectTo: '/shadow-day/dashboard' }
}
