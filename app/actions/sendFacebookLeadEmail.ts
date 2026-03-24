"use server";

import { buildFacebookLeadEmail, sendZohoEmail } from "../lib/zoho";

export async function sendFacebookLeadEmail(opts: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildFacebookLeadEmail({ name: opts.name });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
