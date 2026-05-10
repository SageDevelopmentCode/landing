"use server"

import { buildEnrollmentReminder3Email, sendZohoEmail } from "../lib/zoho"

export async function sendEnrollmentReminder3Email(opts: {
  g1FullName: string
  childLegalName: string
  program: string | null
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildEnrollmentReminder3Email({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
    program: opts.program,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
