import { createAdminClient } from "@/app/lib/supabase-server";
import {
  buildActivityPreferenceReminderEmail,
  sendZohoEmail,
} from "@/app/lib/zoho";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type ActivityPreferenceReminderResult = {
  success: boolean;
  emailSent: boolean;
  pushSent: boolean;
  error?: string;
};

type UpcomingActivity = {
  id: string;
  title: string;
  activity_date: string | null;
};

function formatActivityDateLong(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatActivityDateShort(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getNextUpcomingPublishedActivity(
  admin = createAdminClient(),
): Promise<UpcomingActivity | null> {
  const today = todayIsoDate();
  const { data, error } = await admin
    .schema("teachers")
    .from("activities")
    .select("id, title, activity_date")
    .eq("status", "published")
    .eq("is_deleted", false)
    .gte("activity_date", today)
    .order("activity_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function sendExpoPush(
  pushToken: string,
  activityId: string,
  body: string,
): Promise<boolean> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
  };

  const expoToken = process.env.EXPO_ACCESS_TOKEN;
  if (expoToken) headers.Authorization = `Bearer ${expoToken}`;

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify([
      {
        to: pushToken,
        title: "Activity preference needed",
        body: body.slice(0, 140),
        sound: "default",
        channelId: "messages",
        data: { activityId },
      },
    ]),
  });

  if (!res.ok) return false;

  try {
    const json = await res.json();
    const ticket = Array.isArray(json.data) ? json.data[0] : null;
    return ticket?.status === "ok";
  } catch {
    return false;
  }
}

export async function sendActivityPreferenceReminder(opts: {
  studentId: string;
  activityId?: string;
}): Promise<ActivityPreferenceReminderResult> {
  const admin = createAdminClient();

  let activityId = opts.activityId;
  let activityTitle: string;
  let activityDate: string | null;

  if (activityId) {
    const { data: activity, error } = await admin
      .schema("teachers")
      .from("activities")
      .select("id, title, activity_date")
      .eq("id", activityId)
      .single();

    if (error || !activity) {
      return {
        success: false,
        emailSent: false,
        pushSent: false,
        error: "Activity not found",
      };
    }

    activityTitle = activity.title;
    activityDate = activity.activity_date;
  } else {
    const activity = await getNextUpcomingPublishedActivity(admin);
    if (!activity) {
      return {
        success: false,
        emailSent: false,
        pushSent: false,
        error: "No upcoming published activities",
      };
    }

    activityId = activity.id;
    activityTitle = activity.title;
    activityDate = activity.activity_date;
  }

  const { data: student, error: studentError } = await admin
    .schema("admin")
    .from("students")
    .select("child_legal_name, parent_id")
    .eq("id", opts.studentId)
    .single();

  if (studentError || !student) {
    return {
      success: false,
      emailSent: false,
      pushSent: false,
      error: "Student not found",
    };
  }

  const { data: application } = await admin
    .schema("parent_app")
    .from("applications")
    .select("g1_email, g1_full_name")
    .eq("student_id", opts.studentId)
    .maybeSingle();

  let parentEmail: string | null = null;
  let parentName: string | null = null;
  let pushToken: string | null = null;

  if (student.parent_id) {
    const { data: parent } = await admin
      .schema("admin")
      .from("users")
      .select("email, full_name, push_token")
      .eq("id", student.parent_id)
      .maybeSingle();

    parentEmail = parent?.email ?? null;
    parentName = parent?.full_name ?? null;
    pushToken = parent?.push_token ?? null;
  }

  const email = parentEmail ?? application?.g1_email ?? null;
  const g1FullName = parentName ?? application?.g1_full_name ?? "Parent";
  const childLegalName = student.child_legal_name ?? "your child";

  if (!email) {
    return {
      success: false,
      emailSent: false,
      pushSent: false,
      error: "No parent email on file",
    };
  }

  const formattedDate = activityDate
    ? formatActivityDateLong(activityDate)
    : "Date TBD";

  const { subject, content } = await buildActivityPreferenceReminderEmail({
    g1FullName,
    childLegalName,
    activityTitle,
    activityDate: formattedDate,
  });

  const emailResult = await sendZohoEmail({
    toAddress: email,
    subject,
    content,
  });
  const emailSent = emailResult.success;

  let pushSent = false;
  if (pushToken && activityId) {
    const shortDate = activityDate
      ? formatActivityDateShort(activityDate)
      : "Date TBD";
    pushSent = await sendExpoPush(
      pushToken,
      activityId,
      `${activityTitle} · ${shortDate}`,
    );
  }

  const success = emailSent || pushSent;
  return {
    success,
    emailSent,
    pushSent,
    error: success
      ? undefined
      : (emailResult.error ?? "Failed to send reminder"),
  };
}
