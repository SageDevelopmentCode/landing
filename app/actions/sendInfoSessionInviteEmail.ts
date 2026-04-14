"use server";

import { buildInfoSessionInviteEmail, sendZohoEmail } from "../lib/zoho";

export async function sendInfoSessionInviteEmail(opts: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildInfoSessionInviteEmail({ name: opts.name });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
