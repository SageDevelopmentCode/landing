import { API_BASE_URL } from "@/constants/config";
import { supabase } from "@/lib/supabase";

export type ParentCalendarEventPayload = {
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time?: string | null;
  end_time?: string | null;
  description?: string;
  location?: string;
};

export type ParentCalendarEventRecord = {
  id: string;
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string;
  category: string | null;
  shared_with: string[];
  programs: string[];
  description: string | null;
  location: string | null;
  attachment_links: string[] | null;
  created_by: string | null;
};

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return session.access_token;
}

export async function createParentCalendarEvent(
  payload: ParentCalendarEventPayload,
): Promise<ParentCalendarEventRecord> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/parent/calendar/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as {
    event?: ParentCalendarEventRecord;
    error?: string;
  };
  if (!res.ok || !data.event) {
    throw new Error(data.error ?? "Failed to add event");
  }
  return data.event;
}

export async function updateParentCalendarEvent(
  id: string,
  payload: ParentCalendarEventPayload,
): Promise<ParentCalendarEventRecord> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/parent/calendar/events`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, ...payload }),
  });
  const data = (await res.json()) as {
    event?: ParentCalendarEventRecord;
    error?: string;
  };
  if (!res.ok || !data.event) {
    throw new Error(data.error ?? "Failed to update event");
  }
  return data.event;
}

export async function deleteParentCalendarEvent(id: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/parent/calendar/events`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id }),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to delete event");
  }
}
