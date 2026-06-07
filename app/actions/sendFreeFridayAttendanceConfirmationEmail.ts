"use server";

import { buildFreeFridayAttendanceConfirmationEmail, sendZohoEmail } from "../lib/zoho";

export async function sendFreeFridayAttendanceConfirmationEmail(opts: {
  parentName: string;
  childName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildFreeFridayAttendanceConfirmationEmail({
    parentName: opts.parentName,
    childName: opts.childName,
  });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
