"use server";

import {
  buildParentTeacherConferenceConfirmationEmail,
  sendZohoEmail,
} from "../lib/zoho";

export async function sendParentTeacherConferenceConfirmationEmail(opts: {
  parentFirstName: string;
  childName: string;
  teacherName: string;
  conferenceDate: string;
  timeSlot: string;
  format: "in_person" | "virtual";
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } =
    await buildParentTeacherConferenceConfirmationEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
