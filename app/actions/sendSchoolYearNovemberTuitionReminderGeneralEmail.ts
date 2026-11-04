"use server";
import { assertSuperAdmin } from "@/app/lib/assertSuperAdmin";
import {
  buildSchoolYearNovemberTuitionReminderGeneralEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

export async function sendSchoolYearNovemberTuitionReminderGeneralEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const auth = await assertSuperAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const { subject, content } =
    await buildSchoolYearNovemberTuitionReminderGeneralEmail(opts);
  return sendZohoEmail({ toAddress: opts.email, subject, content });
}
