"use server";
import { buildSchoolYearTuitionReminderEmail, sendZohoEmail } from "@/app/lib/zoho";

export async function sendSchoolYearTuitionReminderEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildSchoolYearTuitionReminderEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
