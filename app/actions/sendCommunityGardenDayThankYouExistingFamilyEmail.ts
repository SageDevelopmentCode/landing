"use server";

import {
  buildCommunityGardenDayThankYouExistingFamilyEmail,
  sendZohoEmail,
} from "../lib/zoho";

export async function sendCommunityGardenDayThankYouExistingFamilyEmail(opts: {
  parentName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const firstName = opts.parentName.split(" ")[0] || opts.parentName;
  const { subject, content } =
    await buildCommunityGardenDayThankYouExistingFamilyEmail({ firstName });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
