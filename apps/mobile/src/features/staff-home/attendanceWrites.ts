// Attendance write cores shared by the staff Home and the staff Attendance
// screen. Plain async functions on primitives: callers own optimistic state,
// locks, Discord notifications and feedback. Both screens must write the same
// columns so a check-in made on one shows correctly on the other.
import { supabase } from "@/lib/supabase";
import type { PickupPerson } from "./staffHomeUtils";

export type SchoolYearTable = "school_year_records" | "school_year_field_friday_records";
export type AttendanceTable = SchoolYearTable | "aftercare_records";

type DbResult = { data: unknown; error: unknown };

/**
 * Parent/guardian names (G1, G2 from the enrolled application) followed by the
 * authorized pickup people, de-duplicated by name (case-insensitive).
 */
export async function fetchPickupPersons(
  studentId: string,
): Promise<{ ok: boolean; persons: PickupPerson[]; error?: unknown }> {
  try {
    const [appsRes, authRes] = await Promise.all([
      supabase
        .schema("parent_app")
        .from("applications")
        .select("g1_full_name, g1_relationship, g2_full_name, g2_relationship")
        .eq("student_id", studentId)
        .eq("status", "enrolled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .schema("parent_app")
        .from("student_authorized_pickup_persons")
        .select("full_name, relationship, sort_order")
        .eq("student_id", studentId)
        .order("sort_order", { ascending: true }),
    ]);

    const persons: PickupPerson[] = [];
    const seen = new Set<string>();
    const add = (name: string | null, rel: string | null) => {
      if (!name) return;
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      persons.push({ name, relationship: rel ?? "" });
    };
    add(appsRes.data?.g1_full_name ?? null, appsRes.data?.g1_relationship ?? null);
    add(appsRes.data?.g2_full_name ?? null, appsRes.data?.g2_relationship ?? null);
    for (const p of (authRes.data ?? []) as { full_name: string; relationship: string }[]) {
      add(p.full_name, p.relationship);
    }
    const error = appsRes.error ?? authRes.error;
    return { ok: !error, persons, error: error ?? undefined };
  } catch (error) {
    return { ok: false, persons: [], error };
  }
}

/**
 * Mark a school-year / Field Friday student present (staff Home semantics): an
 * absent record is flipped in place; otherwise the record is upserted with the
 * current user as `recorded_by` (who checked the child in).
 */
export async function writeSchoolYearPresent(
  table: SchoolYearTable,
  args: {
    studentId: string;
    date: string;
    userId: string;
    paidForDay: boolean;
    existing: { id: string; marked_absent?: boolean | null } | null;
    select: string;
  },
): Promise<DbResult> {
  const { studentId, date, userId, paidForDay, existing, select } = args;
  if (existing?.marked_absent) {
    return supabase
      .schema("attendance")
      .from(table)
      .update({ marked_absent: false, checked_in: true, excluded_from_roster: false })
      .eq("id", existing.id)
      .select(select)
      .single();
  }
  return supabase
    .schema("attendance")
    .from(table)
    .upsert(
      {
        student_id: studentId,
        date,
        recorded_by: userId,
        paid_for_day: paidForDay,
        marked_absent: false,
        checked_in: true,
        excluded_from_roster: false,
      },
      { onConflict: "student_id,date" },
    )
    .select(select)
    .single();
}

/** Remove an attendance record (un-mark present / check out of aftercare). */
export async function deleteAttendanceRecord(
  table: AttendanceTable,
  id: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase.schema("attendance").from(table).delete().eq("id", id);
  return { error };
}

/**
 * Record who picked a student up. When the record already exists only the
 * pickup columns change, so `recorded_by` (who checked the child in) is kept.
 */
export async function writePickup(
  table: AttendanceTable,
  args: {
    studentId: string;
    date: string;
    userId: string;
    paidForDay: boolean;
    existing: { id: string } | null;
    person: PickupPerson;
    select: string;
  },
): Promise<DbResult> {
  const { studentId, date, userId, paidForDay, existing, person, select } = args;
  const pickup = {
    picked_up_by_name: person.name,
    picked_up_by_relationship: person.relationship,
    pickup_recorded_by: userId,
  };
  if (existing) {
    return supabase
      .schema("attendance")
      .from(table)
      .update(pickup)
      .eq("id", existing.id)
      .select(select)
      .single();
  }
  return supabase
    .schema("attendance")
    .from(table)
    .upsert(
      { student_id: studentId, date, recorded_by: userId, paid_for_day: paidForDay, ...pickup },
      { onConflict: "student_id,date" },
    )
    .select(select)
    .single();
}
