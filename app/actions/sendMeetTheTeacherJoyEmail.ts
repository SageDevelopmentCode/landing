"use server";
import { buildMeetTheTeacherJoyEmail, sendZohoEmail } from "../lib/zoho";

export async function sendMeetTheTeacherJoyEmail(opts: {
  parentName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildMeetTheTeacherJoyEmail({ parentName: opts.parentName });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
