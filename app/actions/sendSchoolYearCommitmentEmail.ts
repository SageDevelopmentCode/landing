"use server";
import { buildSchoolYearCommitmentRequestEmail, sendZohoEmail } from "@/app/lib/zoho";

export async function sendSchoolYearCommitmentEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildSchoolYearCommitmentRequestEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
