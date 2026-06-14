"use server"

import { buildSummerWeekThreeNewsletterEmail, sendZohoEmail } from "../lib/zoho"

export async function sendSummerWeekThreeNewsletterEmail(opts: {
  g1FullName: string
  childLegalName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildSummerWeekThreeNewsletterEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
