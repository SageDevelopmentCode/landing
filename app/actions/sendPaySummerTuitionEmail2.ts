"use server"

import { buildPaySummerTuitionEmail2, sendZohoEmail } from "../lib/zoho"

export async function sendPaySummerTuitionEmail2(opts: {
  g1FullName: string
  childLegalName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildPaySummerTuitionEmail2({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
