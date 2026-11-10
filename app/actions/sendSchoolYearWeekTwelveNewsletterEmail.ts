"use server"
import { assertSuperAdmin } from "@/app/lib/assertSuperAdmin"
import { buildSchoolYearWeekTwelveNewsletterEmail, sendZohoEmail } from "../lib/zoho"

export async function sendSchoolYearWeekTwelveNewsletterEmail(opts: {
  g1FullName: string
  childLegalName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const auth = await assertSuperAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  const { subject, content } = await buildSchoolYearWeekTwelveNewsletterEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
