import { supabase } from "@/lib/supabase";

const API_BASE = "https://sagefield.co";

export type TourBooking = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  child_name: string;
  child_grade: string;
  num_children: number;
  tour_date: string;
  tour_time: string;
  how_did_you_hear: string;
  accommodations: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  created_at: string;
};

export type ClockSessionWithTeacher = {
  id: string;
  teacher_id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  note: string | null;
  created_at: string;
  full_name: string | null;
  profile_image_url: string | null;
};

export type EmployeeOption = {
  id: string;
  full_name: string | null;
};

export const TOUR_TIME_SLOTS_15MIN = [
  "9:00 AM", "9:15 AM", "9:30 AM", "9:45 AM",
  "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
  "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM",
  "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM",
  "1:00 PM", "1:15 PM", "1:30 PM", "1:45 PM",
  "2:00 PM", "2:15 PM", "2:30 PM", "2:45 PM",
  "3:00 PM", "3:15 PM", "3:30 PM", "3:45 PM",
  "4:00 PM", "4:15 PM", "4:30 PM", "4:45 PM",
  "5:00 PM",
];

export function formatTourDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTourDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function buildTourMessageReminder(
  booking: Pick<TourBooking, "first_name" | "tour_time">,
): string {
  return `Hi ${booking.first_name}! Just a friendly reminder that your tour is later today at ${booking.tour_time} and I'm looking forward to meeting you and your family!

Our address is: 2760 Gattis School Rd, Round Rock, TX 78664

Please let me know if you have any questions.`;
}

function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nextUtcDayStr(date: string): string {
  const next = new Date(date + "T00:00:00.000Z");
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export async function fetchUpcomingTours(): Promise<TourBooking[]> {
  const today = todayDateKey();
  const { data, error } = await supabase
    .schema("marketing")
    .from("tour_bookings")
    .select("*")
    .eq("is_deleted", false)
    .gte("tour_date", today)
    .in("status", ["pending", "confirmed"])
    .order("tour_date", { ascending: true })
    .order("tour_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as TourBooking[];
}

export async function updateTourBookingDateTime(input: {
  id: string;
  tour_date: string;
  tour_time: string;
}): Promise<TourBooking> {
  const { data, error } = await supabase
    .schema("marketing")
    .from("tour_bookings")
    .update({
      tour_date: input.tour_date,
      tour_time: input.tour_time,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Failed to update booking");
  return data as TourBooking;
}

export async function sendTourReminderEmail(opts: {
  firstName: string;
  email: string;
  tourDate: string;
  tourTime: string;
}): Promise<{ success: boolean; error?: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/api/mobile/admin/tour-reminder`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(opts),
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error ?? "Failed to send email" };
  return { success: true };
}

export async function sendTourThankYouEmail(opts: {
  firstName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/api/mobile/admin/tour-thank-you`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(opts),
  });
  const json = await res.json();
  if (!res.ok) return { success: false, error: json.error ?? "Failed to send email" };
  return { success: true };
}

export async function fetchClockSessionsForDate(
  date: string,
): Promise<ClockSessionWithTeacher[]> {
  const nextDayStr = nextUtcDayStr(date);

  const { data: sessions, error } = await supabase
    .schema("teachers")
    .from("clock_sessions")
    .select("id, teacher_id, clock_in_at, clock_out_at, note, created_at")
    .gte("clock_in_at", `${date}T00:00:00+00`)
    .lt("clock_in_at", `${nextDayStr}T00:00:00+00`)
    .order("clock_in_at", { ascending: false });

  if (error) throw error;
  if (!sessions?.length) return [];

  const teacherIds = [...new Set(sessions.map((s) => s.teacher_id))];
  const { data: users, error: usersError } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name, profile_image_url")
    .in("id", teacherIds);

  if (usersError) throw usersError;

  const userMap = new Map(
    (users ?? []).map((u) => [u.id, u]),
  );

  return sessions.map((s) => {
    const u = userMap.get(s.teacher_id);
    return {
      ...s,
      note: s.note ?? null,
      full_name: u?.full_name ?? null,
      profile_image_url: u?.profile_image_url ?? null,
    };
  });
}

export async function fetchEmployees(): Promise<EmployeeOption[]> {
  const { data, error } = await supabase
    .schema("admin")
    .from("users")
    .select("id, full_name")
    .in("role", ["teacher", "super_admin"])
    .eq("is_deleted", false)
    .order("full_name");

  if (error) throw error;
  return (data ?? []) as EmployeeOption[];
}

export async function updateClockSession(
  sessionId: string,
  clockInAt: string,
  clockOutAt: string | null,
): Promise<void> {
  if (clockOutAt && new Date(clockOutAt) <= new Date(clockInAt)) {
    throw new Error("Clock out must be after clock in");
  }

  const { error } = await supabase
    .schema("teachers")
    .from("clock_sessions")
    .update({ clock_in_at: clockInAt, clock_out_at: clockOutAt })
    .eq("id", sessionId);

  if (error) throw error;
}

export async function createClockSessionForTeacher(
  teacherId: string,
  clockInAt: string,
  clockOutAt: string | null,
  note: string | null,
): Promise<void> {
  if (clockOutAt && new Date(clockOutAt) <= new Date(clockInAt)) {
    throw new Error("Clock out must be after clock in");
  }

  const { error } = await supabase
    .schema("teachers")
    .from("clock_sessions")
    .insert({
      teacher_id: teacherId,
      clock_in_at: clockInAt,
      clock_out_at: clockOutAt,
      note: note ?? "",
    });

  if (error) throw error;
}
