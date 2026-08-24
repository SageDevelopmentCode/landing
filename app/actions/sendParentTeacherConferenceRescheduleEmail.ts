"use server";

import {
  buildParentTeacherConferenceRescheduleEmail,
  sendZohoEmail,
} from "../lib/zoho";

export async function sendParentTeacherConferenceRescheduleEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } =
    await buildParentTeacherConferenceRescheduleEmail({
      g1FullName: opts.g1FullName,
      childLegalName: opts.childLegalName,
    });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
