import { API_BASE_URL } from "@/constants/config";
import { supabase } from "@/lib/supabase";
import type {
  ConferenceBookingRecord,
  ConferenceStudentContext,
  ConferenceTeacherDisplay,
} from "@/lib/parent-teacher-conference";

export type ConferenceContext = {
  conferenceTeachers: ConferenceTeacherDisplay[];
  conferenceStudents: ConferenceStudentContext[];
  bookingsByStudent: Record<string, ConferenceBookingRecord>;
  takenSlotKeys: string[];
};

export type BookConferencePayload = {
  parentId: string;
  studentId: string;
  teacherId: string;
  weekStart: string;
  conferenceDate: string;
  timeSlot: string;
  format: "in_person" | "virtual";
  accommodationNote?: string;
};

const FETCH_TIMEOUT_MS = 10_000;

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return session.access_token;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Could not reach server. Check your connection.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchConferenceContext(
  parentId: string,
): Promise<ConferenceContext> {
  const token = await getAccessToken();
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/parent-teacher-conference/context?parentId=${encodeURIComponent(parentId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const data = (await res.json()) as ConferenceContext & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load conference data");
  }
  return data;
}

export async function bookConference(
  payload: BookConferencePayload,
): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(
    `${API_BASE_URL}/api/parent-teacher-conference/book`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );
  const data = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  }
}
