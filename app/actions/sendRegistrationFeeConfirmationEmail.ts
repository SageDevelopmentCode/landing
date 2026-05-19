"use server"

import { buildRegistrationFeeConfirmationEmail, sendZohoEmail } from "../lib/zoho"

export async function sendRegistrationFeeConfirmationEmail(opts: {
  g1FullName: string
  childLegalName: string
  program: string | null
  amountDollars: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildRegistrationFeeConfirmationEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
    program: opts.program ?? '',
    amountDollars: opts.amountDollars,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
