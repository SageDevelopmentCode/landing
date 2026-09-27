"use server";
import {
  buildSchoolYearOctoberTuitionReminderEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendSchoolYearOctoberTuitionReminderEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } =
    await buildSchoolYearOctoberTuitionReminderEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
