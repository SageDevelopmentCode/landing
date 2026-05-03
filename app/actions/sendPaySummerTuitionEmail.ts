"use server"

import { buildPaySummerTuitionEmail, sendZohoEmail } from "../lib/zoho"

export async function sendPaySummerTuitionEmail(opts: {
  g1FullName: string
  childLegalName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildPaySummerTuitionEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
