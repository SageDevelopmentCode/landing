"use server"

import { buildEnrollmentReminderEmail, sendZohoEmail } from "../lib/zoho"

export async function sendEnrollmentReminderEmail(opts: {
  g1FullName: string
  childLegalName: string
  program: string | null
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildEnrollmentReminderEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
    program: opts.program,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
