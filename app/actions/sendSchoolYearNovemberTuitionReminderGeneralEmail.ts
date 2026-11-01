"use server";
import {
  buildSchoolYearNovemberTuitionReminderGeneralEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendSchoolYearNovemberTuitionReminderGeneralEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } =
    await buildSchoolYearNovemberTuitionReminderGeneralEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
