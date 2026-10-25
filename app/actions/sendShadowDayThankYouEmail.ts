"use server"
import { buildShadowDayThankYouEmail, sendZohoEmail } from "../lib/zoho"

export async function sendShadowDayThankYouEmail(opts: {
  firstName: string
  childName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildShadowDayThankYouEmail({
    firstName: opts.firstName,
    childName: opts.childName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
