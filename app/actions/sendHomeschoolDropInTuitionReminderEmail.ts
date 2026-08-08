"use server";
import {
  buildHomeschoolDropInTuitionReminderEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendHomeschoolDropInTuitionReminderEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildHomeschoolDropInTuitionReminderEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
