"use server";

import { createAdminClient } from "@/app/lib/supabase-server";
import { getOutreachEmailCatalogEntry } from "@/app/admin/constants/outreachEmails";
import {
  getOutreachEmailSender,
  type OutreachApplication,
} from "@/app/admin/constants/outreachEmailSenders";

const MAX_ERRORS = 10;

export async function sendBulkOutreachEmail(opts: {
  emailKey: string;
  applicationIds: string[];
}): Promise<{
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}> {
  const catalogEntry = getOutreachEmailCatalogEntry(opts.emailKey);
  if (!catalogEntry) {
    return {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [`Unknown outreach email: ${opts.emailKey}`],
    };
  }

  const sender = getOutreachEmailSender(opts.emailKey);
  if (!sender) {
    return {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [`No sender configured for: ${opts.emailKey}`],
    };
  }

  if (opts.applicationIds.length === 0) {
    return { sent: 0, failed: 0, skipped: 0, errors: [] };
  }

  const adminClient = createAdminClient();
  const { data: applications, error: fetchError } = await adminClient
    .schema("parent_app")
    .from("applications")
    .select(
      "id, user_id, g1_full_name, g1_email, child_legal_name, program, student_id",
    )
    .in("id", opts.applicationIds);

  if (fetchError) {
    return {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [fetchError.message],
    };
  }

  const appsById = new Map(
    (applications ?? []).map((app) => [app.id, app as OutreachApplication]),
  );

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const applicationId of opts.applicationIds) {
    const app = appsById.get(applicationId);
    if (!app) {
      skipped++;
      if (errors.length < MAX_ERRORS) {
        errors.push(`${applicationId}: Application not found`);
      }
      continue;
    }

    if (!app.g1_email) {
      skipped++;
      if (errors.length < MAX_ERRORS) {
        const label = app.child_legal_name ?? applicationId;
        errors.push(`${label}: No parent email`);
      }
      continue;
    }

    try {
      const result = await sender(app);
      if (result.success) {
        sent++;
      } else {
        failed++;
        if (errors.length < MAX_ERRORS) {
          const label = app.child_legal_name ?? app.g1_email;
          errors.push(`${label}: ${result.error ?? "Failed to send"}`);
        }
      }
    } catch (err) {
      failed++;
      if (errors.length < MAX_ERRORS) {
        const label = app.child_legal_name ?? app.g1_email;
        errors.push(`${label}: ${String(err)}`);
      }
    }
  }

  return { sent, failed, skipped, errors };
}
