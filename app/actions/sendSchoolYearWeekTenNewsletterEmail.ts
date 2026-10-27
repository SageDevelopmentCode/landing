"use server"
import { buildSchoolYearWeekTenNewsletterEmail, sendZohoEmail } from "../lib/zoho"

export async function sendSchoolYearWeekTenNewsletterEmail(opts: {
  g1FullName: string
  childLegalName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildSchoolYearWeekTenNewsletterEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
