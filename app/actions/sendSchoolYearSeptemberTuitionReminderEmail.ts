"use server";
import {
  buildSchoolYearSeptemberTuitionReminderEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendSchoolYearSeptemberTuitionReminderEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } =
    await buildSchoolYearSeptemberTuitionReminderEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
