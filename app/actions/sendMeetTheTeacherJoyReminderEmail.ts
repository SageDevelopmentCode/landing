"use server";
import { buildMeetTheTeacherJoyReminderEmail, sendZohoEmail } from "../lib/zoho";

export async function sendMeetTheTeacherJoyReminderEmail(opts: {
  parentName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildMeetTheTeacherJoyReminderEmail({ parentName: opts.parentName });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
