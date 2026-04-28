"use server"
import { buildTourReminderEmail, sendZohoEmail } from "../lib/zoho"

export async function sendTourReminderEmail(opts: {
  firstName: string
  email: string
  tourDate: string
  tourTime: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildTourReminderEmail({
    firstName: opts.firstName,
    tourDate: opts.tourDate,
    tourTime: opts.tourTime,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
