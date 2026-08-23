import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAttendingStudentIdsForActivityDate } from "@/app/lib/activity-attending-students";
import { createAdminClient } from "@/app/lib/supabase-server";
import {
  createActivityPreferenceRemindersSentEmbed,
  sendDiscordNotification,
} from "@/app/lib/discord";
import { getChicagoDateTimeParts } from "@/shared/staff/pickup-reminder";
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

export type ActivityPrefReminderSentRow = {
  parentName: string;
  parentEmail: string;
  childName: string;
  activityTitle: string;
  activityDate: string;
  daysBefore: 1 | 2;
  emailSent: boolean;
  pushSent: boolean;
};

export type ActivityPrefReminderCronResult = {
  sent2Day: number;
  sent1Day: number;
  skipped: number;
  errors: string[];
  reminders: ActivityPrefReminderSentRow[];
};

type UpcomingActivity = {
  id: string;
  title: string;
  activity_date: string | null;
};

type ActivityRow = {
  id: string;
  title: string;
  activity_date: string;
};

type StudentRow = {
  id: string;
  child_legal_name: string | null;
  parent_id: string;
};

type ApplicationRow = {
  student_id: string;
  g1_email: string | null;
  g1_full_name: string | null;
};

type ParentRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  push_token: string | null;
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

function addDaysToYmd(ymd: string, days: number): string {
  const dt = new Date(`${ymd}T12:00:00`);
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function needsActivityPreferenceReminder(
  studentId: string,
  activityId: string,
  prefSet: Set<string>,
  defaultPrefStudentIds: Set<string>,
): boolean {
  if (defaultPrefStudentIds.has(studentId)) return false;
  if (prefSet.has(`${studentId}:${activityId}`)) return false;
  return true;
}

async function tryReserveReminderLog(
  db: SupabaseClient,
  studentId: string,
  activityId: string,
  daysBefore: 1 | 2,
): Promise<boolean> {
  const { error } = await db
    .schema("parent_app")
    .from("activity_preference_reminder_log")
    .insert({
      student_id: studentId,
      activity_id: activityId,
      days_before: daysBefore,
    });

  if (error) {
    if (error.code === "23505") return false;
    throw new Error(error.message);
  }

  return true;
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
  daysBefore?: 1 | 2;
  admin?: SupabaseClient;
}): Promise<ActivityPreferenceReminderResult> {
  const admin = opts.admin ?? createAdminClient();

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
    daysBefore: opts.daysBefore,
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

export async function maybeSendActivityPreferenceReminders(
  db: SupabaseClient,
  now = new Date(),
): Promise<ActivityPrefReminderCronResult> {
  const { ymd: today } = getChicagoDateTimeParts(now);
  const twoDaysOut = addDaysToYmd(today, 2);
  const oneDayOut = addDaysToYmd(today, 1);
  const targetDates = [twoDaysOut, oneDayOut];

  const activitiesRes = await db
    .schema("teachers")
    .from("activities")
    .select("id, title, activity_date")
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("is_deleted", false)
    .in("activity_date", targetDates);

  if (activitiesRes.error) throw new Error(activitiesRes.error.message);

  const activities = (activitiesRes.data ?? []) as ActivityRow[];
  if (activities.length === 0) {
    return {
      sent2Day: 0,
      sent1Day: 0,
      skipped: 0,
      errors: [],
      reminders: [],
    };
  }

  const activityIds = activities.map((a) => a.id);
  const daysBeforeByActivity = new Map<string, 1 | 2>();
  for (const activity of activities) {
    daysBeforeByActivity.set(
      activity.id,
      activity.activity_date === twoDaysOut ? 2 : 1,
    );
  }

  const uniqueTargetDates = [...new Set(activities.map((a) => a.activity_date))];
  const attendingByDateEntries = await Promise.all(
    uniqueTargetDates.map(async (date) => [
      date,
      await fetchAttendingStudentIdsForActivityDate(db, date),
    ] as const),
  );
  const attendingByDate = new Map(attendingByDateEntries);

  const [enrolledAppsRes, studentsRes, prefsRes, defaultsRes] =
    await Promise.all([
      db
        .schema("parent_app")
        .from("applications")
        .select("student_id, g1_email, g1_full_name")
        .eq("status", "enrolled"),
      db
        .schema("admin")
        .from("students")
        .select("id, child_legal_name, parent_id")
        .eq("is_deleted", false),
      db
        .schema("parent_app")
        .from("activity_preferences")
        .select("student_id, activity_id")
        .in("activity_id", activityIds),
      db
        .schema("parent_app")
        .from("student_default_preferences")
        .select("student_id"),
    ]);

  if (enrolledAppsRes.error) throw new Error(enrolledAppsRes.error.message);
  if (studentsRes.error) throw new Error(studentsRes.error.message);
  if (prefsRes.error) throw new Error(prefsRes.error.message);
  if (defaultsRes.error) throw new Error(defaultsRes.error.message);

  const enrolledIds = new Set(
    (enrolledAppsRes.data ?? [])
      .map((a) => a.student_id)
      .filter((id): id is string => !!id),
  );

  const students = ((studentsRes.data ?? []) as StudentRow[]).filter((s) =>
    enrolledIds.has(s.id),
  );

  if (students.length === 0) {
    return {
      sent2Day: 0,
      sent1Day: 0,
      skipped: 0,
      errors: [],
      reminders: [],
    };
  }

  const applications = (enrolledAppsRes.data ?? []) as ApplicationRow[];
  const applicationByStudent = new Map(
    applications.map((a) => [a.student_id, a]),
  );

  const parentIds = [
    ...new Set(students.map((s) => s.parent_id).filter(Boolean)),
  ];
  const parentsRes =
    parentIds.length > 0
      ? await db
          .schema("admin")
          .from("users")
          .select("id, email, full_name, push_token")
          .in("id", parentIds)
      : { data: [] as ParentRow[], error: null };

  if (parentsRes.error) throw new Error(parentsRes.error.message);

  const parentById = new Map(
    ((parentsRes.data ?? []) as ParentRow[]).map((p) => [p.id, p]),
  );

  const prefSet = new Set(
    (prefsRes.data ?? []).map(
      (p) => `${p.student_id}:${p.activity_id}`,
    ),
  );
  const defaultPrefStudentIds = new Set(
    (defaultsRes.data ?? []).map((d) => d.student_id as string),
  );

  const result: ActivityPrefReminderCronResult = {
    sent2Day: 0,
    sent1Day: 0,
    skipped: 0,
    errors: [],
    reminders: [],
  };

  for (const activity of activities) {
    const daysBefore = daysBeforeByActivity.get(activity.id)!;
    const attendingIds =
      attendingByDate.get(activity.activity_date) ?? new Set<string>();

    for (const student of students) {
      if (!attendingIds.has(student.id)) continue;

      if (
        !needsActivityPreferenceReminder(
          student.id,
          activity.id,
          prefSet,
          defaultPrefStudentIds,
        )
      ) {
        continue;
      }

      const application = applicationByStudent.get(student.id);
      const parent = parentById.get(student.parent_id);
      const parentEmail = parent?.email ?? application?.g1_email ?? null;
      const parentName =
        parent?.full_name ?? application?.g1_full_name ?? "Parent";
      const childName = student.child_legal_name ?? "Student";

      if (!parentEmail) {
        result.skipped += 1;
        result.errors.push(
          `No email for ${childName} (${activity.title})`,
        );
        continue;
      }

      const reserved = await tryReserveReminderLog(
        db,
        student.id,
        activity.id,
        daysBefore,
      );
      if (!reserved) {
        result.skipped += 1;
        continue;
      }

      try {
        const sendResult = await sendActivityPreferenceReminder({
          studentId: student.id,
          activityId: activity.id,
          daysBefore,
          admin: db,
        });

        if (!sendResult.success) {
          await db
            .schema("parent_app")
            .from("activity_preference_reminder_log")
            .delete()
            .eq("student_id", student.id)
            .eq("activity_id", activity.id)
            .eq("days_before", daysBefore);
          result.errors.push(
            sendResult.error ??
              `Failed to remind ${parentEmail} for ${activity.title}`,
          );
          continue;
        }

        if (daysBefore === 2) result.sent2Day += 1;
        else result.sent1Day += 1;

        result.reminders.push({
          parentName,
          parentEmail,
          childName,
          activityTitle: activity.title,
          activityDate: formatActivityDateShort(activity.activity_date),
          daysBefore,
          emailSent: sendResult.emailSent,
          pushSent: sendResult.pushSent,
        });
      } catch (err) {
        result.errors.push(
          err instanceof Error ? err.message : "Unknown send error",
        );
      }
    }
  }

  if (result.reminders.length > 0) {
    const dateLabel = new Date(now).toLocaleDateString("en-US", {
      timeZone: "America/Chicago",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const embed = createActivityPreferenceRemindersSentEmbed({
      date: dateLabel,
      reminders: result.reminders,
    });
    await sendDiscordNotification(
      embed,
      process.env.DISCORD_REMINDERS_SENT_WEBHOOK_URL,
    );
  }

  return result;
}
