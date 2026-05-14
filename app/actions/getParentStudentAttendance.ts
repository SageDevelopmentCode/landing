'use server'

import { createServerSupabaseClient, createAdminClient } from '@/app/lib/supabase-server'

export type AttendanceProgram = "summer" | "aftercare" | "field_friday";

export type UnifiedAttendanceRecord = {
  id: string;
  program: AttendanceProgram;
  date: string;
  recorded_by: string;
  notes: string | null;
  paid_for_day: boolean;
  pickup_time: string | null;
  picked_up_by_name: string | null;
  picked_up_by_relationship: string | null;
  pickup_recorded_by: string | null;
};

export type UserProfile = { full_name: string; profile_image_url: string | null };
export type UserMap = Record<string, UserProfile>;

export type AttendanceResult = { records: UnifiedAttendanceRecord[]; userMap: UserMap };

const SELECT_COLS = "id, date, recorded_by, notes, paid_for_day, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by";

export async function getParentStudentAttendance(studentId: string): Promise<AttendanceResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { records: [], userMap: {} };

  const adminClient = createAdminClient();

  const { data: student } = await adminClient
    .schema('admin')
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .eq('is_deleted', false)
    .limit(1)
    .maybeSingle();

  if (!student) return { records: [], userMap: {} };

  const [summerRes, aftercareRes, fridayRes] = await Promise.all([
    adminClient
      .schema('attendance')
      .from('summer_records')
      .select(SELECT_COLS)
      .eq('student_id', studentId)
      .order('date', { ascending: false }),
    adminClient
      .schema('attendance')
      .from('aftercare_records')
      .select(SELECT_COLS)
      .eq('student_id', studentId)
      .order('date', { ascending: false }),
    adminClient
      .schema('attendance')
      .from('field_friday_records')
      .select(SELECT_COLS)
      .eq('student_id', studentId)
      .order('date', { ascending: false }),
  ]);

  const merged: UnifiedAttendanceRecord[] = [
    ...((summerRes.data ?? []) as any[]).map((r) => ({ ...r, program: "summer" as const })),
    ...((aftercareRes.data ?? []) as any[]).map((r) => ({ ...r, program: "aftercare" as const })),
    ...((fridayRes.data ?? []) as any[]).map((r) => ({ ...r, program: "field_friday" as const })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const staffIds = [
    ...new Set(
      merged.flatMap((r) => [r.recorded_by, r.pickup_recorded_by]).filter(Boolean) as string[],
    ),
  ];

  const userMap: UserMap = {};
  if (staffIds.length > 0) {
    const { data: users } = await adminClient
      .schema('admin')
      .from('users')
      .select('id, full_name, profile_image_url')
      .in('id', staffIds);
    for (const u of users ?? []) {
      userMap[u.id] = { full_name: u.full_name, profile_image_url: u.profile_image_url };
    }
  }

  return { records: merged, userMap };
}
