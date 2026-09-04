"use server";
import { buildLaborDayReminderEmail, sendZohoEmail } from "../lib/zoho";

export async function sendLaborDayReminderEmail(opts: {
  g1FullName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildLaborDayReminderEmail({
    g1FullName: opts.g1FullName,
  });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
