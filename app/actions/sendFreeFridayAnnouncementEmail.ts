"use server";

import { buildFreeFridayAnnouncementEmail, sendZohoEmail } from "../lib/zoho";

export async function sendFreeFridayAnnouncementEmail(opts: {
  parentName: string;
  childName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildFreeFridayAnnouncementEmail({
    parentName: opts.parentName,
    childName: opts.childName,
  });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
