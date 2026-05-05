"use server"

import { buildFullSummerThankYouEmail, sendZohoEmail } from "../lib/zoho"

export async function sendFullSummerThankYouEmail(opts: {
  g1FullName: string
  childLegalName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildFullSummerThankYouEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
