"use server"

import { buildEnrollmentChecklistDeadlineReminderEmail, sendZohoEmail } from "../lib/zoho"

export async function sendEnrollmentChecklistDeadlineReminderEmail(opts: {
  g1FullName: string
  childLegalName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildEnrollmentChecklistDeadlineReminderEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
