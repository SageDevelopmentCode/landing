"use server";
import { buildSchoolYearTuitionInfoEmail, sendZohoEmail } from "@/app/lib/zoho";

export async function sendSchoolYearTuitionInfoEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildSchoolYearTuitionInfoEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
