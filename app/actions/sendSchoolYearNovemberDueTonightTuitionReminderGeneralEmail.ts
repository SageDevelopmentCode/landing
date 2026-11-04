"use server";
import {
  buildSchoolYearNovemberDueTonightTuitionReminderGeneralEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendSchoolYearNovemberDueTonightTuitionReminderGeneralEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } =
    await buildSchoolYearNovemberDueTonightTuitionReminderGeneralEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
