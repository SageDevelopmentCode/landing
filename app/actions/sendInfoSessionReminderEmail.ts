"use server";

import { buildInfoSessionReminderEmail, sendZohoEmail } from "../lib/zoho";

export async function sendInfoSessionReminderEmail(opts: {
  firstName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildInfoSessionReminderEmail({ firstName: opts.firstName });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
