"use server";
import { buildCommunityGardenDayInviteEmail, sendZohoEmail } from "../lib/zoho";

export async function sendCommunityGardenDayInviteEmail(opts: {
  g1FullName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildCommunityGardenDayInviteEmail({
    g1FullName: opts.g1FullName,
  });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
