"use server"
import { buildSchoolYearWeekFiveNewsletterEmail, sendZohoEmail } from "../lib/zoho"

export async function sendSchoolYearWeekFiveNewsletterEmail(opts: {
  g1FullName: string
  childLegalName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildSchoolYearWeekFiveNewsletterEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
