"use server"
import { buildSchoolYearWeekNineNewsletterEmail, sendZohoEmail } from "../lib/zoho"

export async function sendSchoolYearWeekNineNewsletterEmail(opts: {
  g1FullName: string
  childLegalName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildSchoolYearWeekNineNewsletterEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
