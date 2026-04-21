"use server";

import { buildParkingEmail, sendZohoEmail } from "../lib/zoho";

export async function sendParkingEmail(opts: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildParkingEmail({ name: opts.name });
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
