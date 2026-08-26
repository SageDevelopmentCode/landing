"use server";
import {
  buildSchoolYearSeptemberDropInTuitionReminderEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendSchoolYearSeptemberDropInTuitionReminderEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } =
    await buildSchoolYearSeptemberDropInTuitionReminderEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
