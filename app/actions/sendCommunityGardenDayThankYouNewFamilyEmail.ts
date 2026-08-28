"use server";

import {
  buildCommunityGardenDayThankYouNewFamilyEmail,
  sendZohoEmail,
} from "../lib/zoho";

export async function sendCommunityGardenDayThankYouNewFamilyEmail(opts: {
  parentName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const firstName = opts.parentName.split(" ")[0] || opts.parentName;
  const { subject, content } =
    await buildCommunityGardenDayThankYouNewFamilyEmail({ firstName });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
