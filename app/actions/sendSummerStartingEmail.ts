"use server"

import { buildSummerStartingEmail, sendZohoEmail } from "../lib/zoho"

export async function sendSummerStartingEmail(opts: {
  g1FullName: string
  childLegalName: string
  email: string
  program?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildSummerStartingEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
    program: opts.program,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
