"use server";
import {
  buildSchoolYearOctoberDueSoonDropInTuitionReminderEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendSchoolYearOctoberDueSoonDropInTuitionReminderEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
  useUpdatedHomeschoolPricing?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } =
    await buildSchoolYearOctoberDueSoonDropInTuitionReminderEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
