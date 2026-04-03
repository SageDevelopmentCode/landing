"use server";

import { buildOpenHouseReminderEmail, sendZohoEmail } from "../lib/zoho";

export async function sendOpenHouseReminderEmail(opts: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildOpenHouseReminderEmail({ name: opts.name });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
