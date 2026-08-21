"use server";

import {
  getNextUpcomingPublishedActivity,
} from "@/app/lib/activity-preference-reminder";
import {
  buildActivityPreferenceReminderEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

function formatActivityDateLong(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function sendActivityPreferenceReminderEmail(opts: {
  email: string;
  g1FullName: string;
  childLegalName: string;
  activityTitle: string;
  activityDate: string;
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildActivityPreferenceReminderEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
    activityTitle: opts.activityTitle,
    activityDate: opts.activityDate,
  });

  return sendZohoEmail({
    toAddress: opts.email,
    subject,
    content,
  });
}

export async function sendActivityPreferenceReminderPreview(opts: {
  email: string;
  g1FullName: string;
  childLegalName: string;
}): Promise<{ success: boolean; error?: string }> {
  const activity = await getNextUpcomingPublishedActivity();
  if (!activity) {
    return {
      success: false,
      error: "No upcoming published activities",
    };
  }

  const activityDate = activity.activity_date
    ? formatActivityDateLong(activity.activity_date)
    : "Date TBD";

  return sendActivityPreferenceReminderEmail({
    email: opts.email,
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
    activityTitle: activity.title,
    activityDate,
  });
}
