"use server";
import { buildSchoolYearTuitionClarificationEmail, sendZohoEmail } from "@/app/lib/zoho";

export async function sendSchoolYearTuitionClarificationEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildSchoolYearTuitionClarificationEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
