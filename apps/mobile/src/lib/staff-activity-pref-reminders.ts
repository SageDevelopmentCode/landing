import { supabase } from "@/lib/supabase";

const API_BASE = "https://sagefield.co";

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export type ActivityPreferenceReminderResponse = {
  success: boolean;
  emailSent?: boolean;
  pushSent?: boolean;
  error?: string;
};

export async function sendActivityPreferenceReminder(
  studentId: string,
  activityId: string,
): Promise<ActivityPreferenceReminderResponse> {
  const token = await getAccessToken();
  const res = await fetch(
    `${API_BASE}/api/mobile/staff/activity-preference-reminder`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ studentId, activityId }),
    },
  );

  const json = await res.json();
  if (!res.ok) {
    return {
      success: false,
      emailSent: json.emailSent ?? false,
      pushSent: json.pushSent ?? false,
      error: json.error ?? "Failed to send reminder",
    };
  }

  return {
    success: true,
    emailSent: json.emailSent ?? false,
    pushSent: json.pushSent ?? false,
  };
}
