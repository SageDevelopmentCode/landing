"use server";
import {
  buildSchoolYearOctoberDueSoonTuitionReminderEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendSchoolYearOctoberDueSoonTuitionReminderEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } =
    await buildSchoolYearOctoberDueSoonTuitionReminderEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
