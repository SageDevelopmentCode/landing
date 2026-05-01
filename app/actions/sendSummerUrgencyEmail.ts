"use server";

import { buildSummerUrgencyEmail, sendZohoEmail } from "../lib/zoho";

export async function sendSummerUrgencyEmail(opts: {
  parentName: string;
  email: string;
  spotsRemaining: number;
  deadlineDate: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildSummerUrgencyEmail({
    parentName: opts.parentName,
    spotsRemaining: opts.spotsRemaining,
    deadlineDate: opts.deadlineDate,
  });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
