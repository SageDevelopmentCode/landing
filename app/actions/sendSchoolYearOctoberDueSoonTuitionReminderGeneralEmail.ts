"use server";
import {
  buildSchoolYearOctoberDueSoonTuitionReminderGeneralEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendSchoolYearOctoberDueSoonTuitionReminderGeneralEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } =
    await buildSchoolYearOctoberDueSoonTuitionReminderGeneralEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
