"use server";

import { buildOpenHouseTwoDayReminderEmail, sendZohoEmail } from "../lib/zoho";

export async function sendOpenHouseTwoDayReminderEmail(opts: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildOpenHouseTwoDayReminderEmail({ name: opts.name });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
