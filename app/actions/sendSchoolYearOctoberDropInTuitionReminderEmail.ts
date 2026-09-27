"use server";
import {
  buildSchoolYearOctoberDropInTuitionReminderEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendSchoolYearOctoberDropInTuitionReminderEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
  useUpdatedHomeschoolPricing?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } =
    await buildSchoolYearOctoberDropInTuitionReminderEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
