"use server"
import { buildTourThankYouEmail, sendZohoEmail } from "../lib/zoho"

export async function sendTourThankYouEmail(opts: {
  firstName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildTourThankYouEmail({
    firstName: opts.firstName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
