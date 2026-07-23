"use server";
import { buildHomeschoolDropInClarificationEmail, sendZohoEmail } from "@/app/lib/zoho";

export async function sendHomeschoolDropInClarificationEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildHomeschoolDropInClarificationEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
