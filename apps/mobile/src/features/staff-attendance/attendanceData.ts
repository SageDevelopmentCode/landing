// Staff Attendance data: types, date helpers and the four loaders, carried
// over from the original app/(staff)/attendance.tsx (roster rules, sorting and
// Month Plan counts unchanged). New: every query's error is checked (a failed
// query used to look like "No enrolled students"), and the student profile
// loader lives here as fetchStudentProfile().
import { supabase } from "@/lib/supabase";
import {
  buildDisplayNameMap,
  getStudentDisplayName,
} from "@/lib/student-display-name";
import {
  SCHOOL_YEAR_AFTERCARE_MONTHS,
  SCHOOL_YEAR_MONTHS,
  SCHOOL_YEAR_FUN_FRIDAY_MONTHS,
} from "@/lib/school-year";
import {
  getCurrentSchoolYearMonthIndex,
  getSchoolYearMonthDates,
  isSchoolYearAftercarePaid,
  isSchoolYearFieldFridayPaid,
  isSchoolYearWeekdayPaid,
  SCHOOL_YEAR_START,
} from "@/lib/school-year-attendance";

/** Throw when a Supabase response carries an error, so callers can report it. */
function assertOk(...results: ({ error: unknown } | null | undefined)[]) {
  for (const r of results) if (r?.error) throw r.error;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SchoolYearRecord = {
  id: string;
  date: string;
  student_id: string;
  recorded_by: string;
  notes: string | null;
  paid_for_day: boolean;
  marked_absent: boolean;
  excluded_from_roster: boolean;
  checked_in: boolean;
  pickup_time: string | null;
  picked_up_by_name: string | null;
  picked_up_by_relationship: string | null;
  pickup_recorded_by: string | null;
};

export type PickupPerson = {
  name: string;
  relationship: string;
};

export type StaffUser = {
  id: string;
  full_name: string | null;
  profile_image_url: string | null;
};

export type SchoolYearStudentRow = {
  student_id: string;
  name: string | null;
  grade: string | null;
  profile_image_url: string | null;
  record: SchoolYearRecord | null;
  hasEnrollment: boolean;
  has_allergies: string | null;
  program: string | null;
};

export type TxnRow = {
  student_id: string;
  payment_type: string;
  metadata: Record<string, unknown> | null;
};

export type AftercareRecord = {
  id: string;
  date: string;
  student_id: string;
  pickup_time: string | null;
  picked_up_by_name: string | null;
  picked_up_by_relationship: string | null;
  pickup_recorded_by: string | null;
  recorded_by: string;
  notes: string | null;
  paid_for_day: boolean;
};

export type AftercareStudentRow = {
  student_id: string;
  name: string | null;
  grade: string | null;
  profile_image_url: string | null;
  record: AftercareRecord | null;
  hasEnrollment: boolean;
  has_allergies: string | null;
  program: string | null;
};

export type FieldFridayRecord = {
  id: string;
  date: string;
  student_id: string;
  pickup_time: string | null;
  picked_up_by_name: string | null;
  picked_up_by_relationship: string | null;
  pickup_recorded_by: string | null;
  recorded_by: string;
  notes: string | null;
  paid_for_day: boolean;
  marked_absent?: boolean;
  excluded_from_roster?: boolean;
  checked_in?: boolean;
};

export type FieldFridayStudentRow = {
  student_id: string;
  name: string | null;
  grade: string | null;
  profile_image_url: string | null;
  record: FieldFridayRecord | null;
  hasEnrollment: boolean;
  has_allergies: string | null;
  program: string | null;
};

export type HeadcountStudent = {
  student_id: string;
  name: string | null;
  profile_image_url: string | null;
};

export type ProgramHeadcount = {
  count: number;
  students: HeadcountStudent[];
};

export type DayHeadcount = {
  date: string;
  school_year: ProgramHeadcount | null;
  aftercare: ProgramHeadcount | null;
  field_friday: ProgramHeadcount | null;
};

export type ProfileStudentDetail = {
  id: string;
  child_legal_name: string;
  child_grade: string | null;
  profile_image_url: string | null;
  dob_day: string | null;
  dob_month: string | null;
  dob_year: string | null;
  learning_style: string | null;
  special_interests: string | null;
  strengths_interests: string | null;
  current_challenges: string | null;
  dysregulation_response: string | null;
  regulation_strategies: string | null;
  activities_to_avoid: string | null;
  has_medical_conditions: string | null;
  medical_conditions_description: string | null;
  has_allergies: string | null;
  allergies_description: string | null;
  emergency_medications: string | null;
  needs_aide: string | null;
  parent_id: string | null;
};

export type ProfileContacts = {
  g1_full_name: string | null;
  g1_relationship: string | null;
  g1_cell_phone: string | null;
  g1_work_phone: string | null;
  g1_email: string | null;
  g2_full_name: string | null;
  g2_relationship: string | null;
  g2_cell_phone: string | null;
  g2_work_phone: string | null;
  g2_email: string | null;
  in_state_contact_name: string | null;
  in_state_contact_relation: string | null;
  in_state_contact_phone: string | null;
  out_of_state_contact_name: string | null;
  out_of_state_contact_relation: string | null;
  out_of_state_contact_phone: string | null;
};

export type ProfileNote = {
  id: string;
  note_text: string;
  category: "general" | "behavioral" | "academic" | "social" | "health";
  is_shared: boolean;
  created_at: string;
};

export type ProfileTab = "info" | "contacts" | "notes" | "weeks";

export type ProfileSchedule = {
  programType: "school_year_full" | "homeschool" | null;
  paidMonths: number[];
  homeschoolSelections: Array<{ month: number; days: string[] }>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const SY_COLOR = "#4a6354";
export const FRIDAY_COLOR = "#0891b2";

export const PROGRAMS = [
  { key: "month_plan", label: "Month Plan", icon: "calendar-outline", color: "#3b82f6" },
  { key: "school_year", label: "School Year", icon: "school-outline", color: SY_COLOR },
  { key: "aftercare", label: "Extended Learning", icon: "home-outline", color: "#7c3aed" },
  { key: "field_friday", label: "Friday Enrichment", icon: "leaf-outline", color: FRIDAY_COLOR },
] as const;
export type ProgramKey = (typeof PROGRAMS)[number]["key"];
export type CalendarTarget = "aftercare" | "field_friday" | "school_year";

export const ALL_SY_WEEKDAY_DATES = SCHOOL_YEAR_AFTERCARE_MONTHS.flatMap((m) =>
  m.days.map((d) => d.date),
).sort();

export const ALL_SY_FRIDAY_DATES = SCHOOL_YEAR_FUN_FRIDAY_MONTHS.flatMap((m) =>
  m.fridays.map((f) => f.date),
).sort();

export const SY_WEEKDAY_DATE_SET = new Set(ALL_SY_WEEKDAY_DATES);
export const SY_FRIDAY_DATE_SET = new Set(ALL_SY_FRIDAY_DATES);

export const PROFILE_CATEGORY_COLORS: Record<ProfileNote["category"], string> = {
  general: "#6b7280",
  behavioral: "#7c3aed",
  academic: "#2563eb",
  social: "#059669",
  health: "#dc2626",
};

// ─── Calendar picker helpers ──────────────────────────────────────────────────

export const DOW_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

export function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function isCalendarDaySelectable(ymd: string, target: CalendarTarget): boolean {
  if (target === "aftercare" || target === "school_year") {
    return SY_WEEKDAY_DATE_SET.has(ymd);
  }
  if (target === "field_friday") return SY_FRIDAY_DATE_SET.has(ymd);
  return false;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMonthLabel(monthIndex: number): string {
  return SCHOOL_YEAR_MONTHS.find((m) => m.index === monthIndex)?.label ?? `Month ${monthIndex}`;
}

export function findNearestDate(dates: string[], today: string, fallback: string): string {
  if (dates.includes(today)) return today;
  const upcoming = dates.find((d) => d >= today);
  return upcoming ?? dates[dates.length - 1] ?? fallback;
}

export function shiftInDateList(dates: string[], dateStr: string, delta: 1 | -1): string {
  let idx = dates.indexOf(dateStr);
  if (idx === -1) {
    const nearest = dates.find((d) => d >= dateStr) ?? dates[0];
    idx = dates.indexOf(nearest);
  }
  const next = idx + delta;
  if (next < 0) return dates[0];
  if (next >= dates.length) return dates[dates.length - 1];
  return dates[next];
}

export function formatDayHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function shortName(name: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// ─── School year date helpers ─────────────────────────────────────────────────

export function getInitialSchoolYearDate(): string {
  const today = toYMD(new Date());
  return findNearestDate(ALL_SY_WEEKDAY_DATES, today, toYMD(SCHOOL_YEAR_START));
}

export function shiftSchoolYearWeekday(dateStr: string, delta: 1 | -1): string {
  return shiftInDateList(ALL_SY_WEEKDAY_DATES, dateStr, delta);
}

// ─── Extended Learning date helpers ───────────────────────────────────────────

export function getInitialAftercareDate(): string {
  const today = toYMD(new Date());
  return findNearestDate(ALL_SY_WEEKDAY_DATES, today, toYMD(SCHOOL_YEAR_START));
}

export function shiftAftercareWeekday(dateStr: string, delta: 1 | -1): string {
  return shiftInDateList(ALL_SY_WEEKDAY_DATES, dateStr, delta);
}

export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Avatar color palette ─────────────────────────────────────────────────────

export const AVATAR_PALETTE = [
  "#c2714f", // terracotta
  "#8b6f47", // warm brown
  "#a07850", // caramel
  "#7a9e7e", // sage
  "#c4846b", // dusty rose
  "#b08d57", // golden tan
  "#5E7C68", // forest sage
  "#c27c47", // amber clay
];

export function avatarColor(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

// ─── Friday Enrichment date helpers ───────────────────────────────────────────

export function getInitialFriday(): string {
  const today = toYMD(new Date());
  return findNearestDate(
    ALL_SY_FRIDAY_DATES,
    today,
    ALL_SY_FRIDAY_DATES[0] ?? toYMD(SCHOOL_YEAR_START),
  );
}

export function shiftFriday(dateStr: string, delta: 1 | -1): string {
  return shiftInDateList(ALL_SY_FRIDAY_DATES, dateStr, delta);
}

// ─── Enrollment helpers ───────────────────────────────────────────────────────

export type AppEnrollmentRow = {
  student_id: string;
  admin_tags: string[] | null;
  has_allergies: string | null;
  program: string | null;
  drop_in_program?: string | null;
  preferred_name: string | null;
  child_legal_name: string | null;
};

export function isSchoolYearApp(a: {
  program: string | null;
  drop_in_program?: string | null;
}): boolean {
  return (
    a.program === "school_year_26_27" ||
    a.program === "both" ||
    (a.program === "homeschool_drop_in" &&
      (a.drop_in_program === "school_year_26_27" ||
        a.drop_in_program === "both"))
  );
}

// ─── Data fetching ────────────────────────────────────────────────────────────

export async function fetchSchoolYearDayData(
  date: string,
): Promise<SchoolYearStudentRow[]> {
  const [studentsRes, appsRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, child_grade, profile_image_url")
      .eq("is_deleted", false)
      .order("child_legal_name", { ascending: true }),
    supabase
      .schema("parent_app")
      .from("applications")
      .select(
        "student_id, admin_tags, has_allergies, program, drop_in_program, preferred_name, child_legal_name",
      )
      .eq("status", "enrolled"),
  ]);
  assertOk(studentsRes, appsRes);

  const appsData = (appsRes.data ?? []) as AppEnrollmentRow[];
  const displayNameMap = buildDisplayNameMap(appsData);
  const enrolledIds = new Set(
    appsData
      .filter(
        (a) =>
          isSchoolYearApp(a) &&
          !(a.admin_tags ?? []).includes("Don't Include"),
      )
      .map((a) => a.student_id),
  );
  const allergyMapDay = new Map(
    appsData.map((a) => [a.student_id, a.has_allergies]),
  );
  const programMapDay = new Map(appsData.map((a) => [a.student_id, a.program]));

  type StudentRow = {
    id: string;
    child_legal_name: string | null;
    child_grade: string | null;
    profile_image_url: string | null;
  };

  const students = ((studentsRes.data ?? []) as StudentRow[]).filter((s) =>
    enrolledIds.has(s.id),
  );

  if (!students.length) return [];
  const studentIds = students.map((s) => s.id);

  const [recordsRes, txnsRes] = await Promise.all([
    supabase
      .schema("attendance")
      .from("school_year_records")
      .select(
        "id, date, student_id, recorded_by, notes, paid_for_day, marked_absent, excluded_from_roster, checked_in, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by",
      )
      .eq("date", date)
      .in("student_id", studentIds),
    supabase
      .schema("billing")
      .from("stripe_transactions")
      .select("student_id, payment_type, metadata")
      .in("payment_type", ["school_year_tuition", "homeschool_dropin"])
      .eq("status", "completed")
      .eq("is_deleted", false)
      .in("student_id", studentIds),
  ]);
  assertOk(recordsRes, txnsRes);

  const paidIds = new Set<string>();
  for (const txn of (txnsRes.data ?? []) as TxnRow[]) {
    if (isSchoolYearWeekdayPaid(txn, date)) {
      paidIds.add(txn.student_id);
    }
  }

  const recordMap = new Map(
    ((recordsRes.data ?? []) as SchoolYearRecord[]).map((r) => [
      r.student_id,
      r,
    ]),
  );

  return students
    .filter((s) => {
      const record = recordMap.get(s.id);
      if (record?.excluded_from_roster) return false;
      return paidIds.has(s.id) || record != null;
    })
    .map((s) => ({
      student_id: s.id,
      name:
        displayNameMap.get(s.id) ??
        getStudentDisplayName(null, s.child_legal_name),
      grade: s.child_grade,
      profile_image_url: s.profile_image_url,
      record: recordMap.get(s.id) ?? null,
      hasEnrollment: paidIds.has(s.id),
      has_allergies: allergyMapDay.get(s.id) ?? null,
      program: programMapDay.get(s.id) ?? null,
    }))
    .sort((a, b) => {
      const priority = (s: SchoolYearStudentRow) =>
        s.record?.picked_up_by_name
          ? 0
          : s.record?.checked_in && !s.record.marked_absent
            ? 1
            : s.hasEnrollment
              ? 2
              : 3;
      const pa = priority(a),
        pb = priority(b);
      if (pa !== pb) return pa - pb;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
}

export async function fetchAftercareData(
  date: string
): Promise<AftercareStudentRow[]> {
  const [studentsRes, appsRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, child_grade, profile_image_url")
      .eq("is_deleted", false)
      .order("child_legal_name", { ascending: true }),
    supabase
      .schema("parent_app")
      .from("applications")
      .select("student_id, admin_tags, has_allergies, program, preferred_name, child_legal_name")
      .eq("status", "enrolled"),
  ]);
  assertOk(studentsRes, appsRes);

  const appsDataAc = (appsRes.data ?? []) as {
    student_id: string;
    admin_tags: string[] | null;
    has_allergies: string | null;
    program: string | null;
    preferred_name: string | null;
    child_legal_name: string | null;
  }[];
  const displayNameMap = buildDisplayNameMap(appsDataAc);
  const enrolledIds = new Set(
    appsDataAc
      .filter((a) => !(a.admin_tags ?? []).includes("Don't Include"))
      .map((a) => a.student_id)
  );
  const allergyMapAc = new Map(appsDataAc.map((a) => [a.student_id, a.has_allergies]));
  const programMapAc = new Map(appsDataAc.map((a) => [a.student_id, a.program]));

  type StudentRaw = {
    id: string;
    child_legal_name: string | null;
    child_grade: string | null;
    profile_image_url: string | null;
  };

  const students = ((studentsRes.data ?? []) as StudentRaw[]).filter((s) =>
    enrolledIds.has(s.id)
  );

  if (!students.length) return [];
  const studentIds = students.map((s) => s.id);

  const [recordsRes, txnsRes] = await Promise.all([
    supabase
      .schema("attendance")
      .from("aftercare_records")
      .select(
        "id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by, recorded_by, notes, paid_for_day"
      )
      .eq("date", date)
      .in("student_id", studentIds),
    supabase
      .schema("billing")
      .from("stripe_transactions")
      .select("student_id, payment_type, metadata")
      .eq("payment_type", "aftercare_tuition")
      .eq("status", "completed")
      .eq("is_deleted", false)
      .in("student_id", studentIds),
  ]);
  assertOk(recordsRes, txnsRes);

  const paidIds = new Set<string>();
  for (const txn of (txnsRes.data ?? []) as TxnRow[]) {
    if (isSchoolYearAftercarePaid(txn, date)) {
      paidIds.add(txn.student_id);
    }
  }

  const recordMap = new Map(
    ((recordsRes.data ?? []) as AftercareRecord[]).map((r) => [
      r.student_id,
      r,
    ])
  );

  return students
    .map((s) => ({
      student_id: s.id,
      name:
        displayNameMap.get(s.id) ??
        getStudentDisplayName(null, s.child_legal_name),
      grade: s.child_grade,
      profile_image_url: s.profile_image_url,
      record: recordMap.get(s.id) ?? null,
      hasEnrollment: paidIds.has(s.id),
      has_allergies: allergyMapAc.get(s.id) ?? null,
      program: programMapAc.get(s.id) ?? null,
    }))
    .sort((a, b) => {
      const priority = (s: AftercareStudentRow) =>
        s.record?.picked_up_by_name ? 0
        : s.record !== null         ? 1
        : s.hasEnrollment           ? 2
        :                             3;
      const pa = priority(a), pb = priority(b);
      if (pa !== pb) return pa - pb;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
}

export async function fetchFieldFridayData(
  date: string
): Promise<FieldFridayStudentRow[]> {
  const [studentsRes, appsRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, child_grade, profile_image_url")
      .eq("is_deleted", false)
      .order("child_legal_name", { ascending: true }),
    supabase
      .schema("parent_app")
      .from("applications")
      .select("student_id, admin_tags, has_allergies, program, preferred_name, child_legal_name")
      .eq("status", "enrolled"),
  ]);
  assertOk(studentsRes, appsRes);

  const appsDataFf = (appsRes.data ?? []) as {
    student_id: string;
    admin_tags: string[] | null;
    has_allergies: string | null;
    program: string | null;
    preferred_name: string | null;
    child_legal_name: string | null;
  }[];
  const displayNameMap = buildDisplayNameMap(appsDataFf);
  const enrolledIds = new Set(
    appsDataFf
      .filter((a) => !(a.admin_tags ?? []).includes("Don't Include"))
      .map((a) => a.student_id)
  );
  const allergyMapFf = new Map(appsDataFf.map((a) => [a.student_id, a.has_allergies]));
  const programMapFf = new Map(appsDataFf.map((a) => [a.student_id, a.program]));

  type StudentRaw = {
    id: string;
    child_legal_name: string | null;
    child_grade: string | null;
    profile_image_url: string | null;
  };

  const students = ((studentsRes.data ?? []) as StudentRaw[]).filter((s) =>
    enrolledIds.has(s.id)
  );

  if (!students.length) return [];
  const studentIds = students.map((s) => s.id);

  const [recordsRes, txnsRes] = await Promise.all([
    supabase
      .schema("attendance")
      .from("school_year_field_friday_records")
      .select("id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by, recorded_by, notes, paid_for_day, marked_absent, excluded_from_roster, checked_in")
      .eq("date", date)
      .in("student_id", studentIds),
    supabase
      .schema("billing")
      .from("stripe_transactions")
      .select("student_id, payment_type, metadata")
      .eq("payment_type", "fun_friday_tuition")
      .eq("status", "completed")
      .eq("is_deleted", false)
      .in("student_id", studentIds),
  ]);
  assertOk(recordsRes, txnsRes);

  const paidIds = new Set<string>();
  for (const txn of (txnsRes.data ?? []) as TxnRow[]) {
    if (isSchoolYearFieldFridayPaid(txn, date)) {
      paidIds.add(txn.student_id);
    }
  }

  const recordMap = new Map(
    ((recordsRes.data ?? []) as FieldFridayRecord[]).map((r) => [
      r.student_id,
      r,
    ])
  );

  return students
    .filter((s) => {
      const record = recordMap.get(s.id);
      if (record?.excluded_from_roster) return false;
      return paidIds.has(s.id) || record != null;
    })
    .map((s) => ({
      student_id: s.id,
      name:
        displayNameMap.get(s.id) ??
        getStudentDisplayName(null, s.child_legal_name),
      grade: s.child_grade,
      profile_image_url: s.profile_image_url,
      record: recordMap.get(s.id) ?? null,
      hasEnrollment: paidIds.has(s.id),
      has_allergies: allergyMapFf.get(s.id) ?? null,
      program: programMapFf.get(s.id) ?? null,
    }))
    .sort((a, b) => {
      const priority = (s: FieldFridayStudentRow) =>
        s.record?.picked_up_by_name ? 0
        : s.record?.checked_in && !s.record.marked_absent ? 1
        : s.hasEnrollment           ? 2
        :                             3;
      const pa = priority(a), pb = priority(b);
      if (pa !== pb) return pa - pb;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
}

export async function fetchMonthHeadcounts(monthIndex: number): Promise<DayHeadcount[]> {
  const dates = getSchoolYearMonthDates(monthIndex);

  const [studentsRes, appsRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, profile_image_url")
      .eq("is_deleted", false)
      .order("child_legal_name", { ascending: true }),
    supabase
      .schema("parent_app")
      .from("applications")
      .select("student_id, admin_tags, preferred_name, child_legal_name")
      .eq("status", "enrolled"),
  ]);
  assertOk(studentsRes, appsRes);

  const appsData = (appsRes.data ?? []) as {
    student_id: string;
    admin_tags: string[] | null;
    preferred_name: string | null;
    child_legal_name: string | null;
  }[];
  const displayNameMap = buildDisplayNameMap(appsData);

  const enrolledIds = new Set(
    appsData
      .filter((a) => !(a.admin_tags ?? []).includes("Don't Include"))
      .map((a) => a.student_id),
  );

  type SRaw = {
    id: string;
    child_legal_name: string | null;
    profile_image_url: string | null;
  };

  const students = ((studentsRes.data ?? []) as SRaw[]).filter((s) =>
    enrolledIds.has(s.id),
  );

  const empty = dates.map((date) => ({
    date,
    school_year: null,
    aftercare: null,
    field_friday: null,
  }));

  if (!students.length) return empty;

  const studentIds = students.map((s) => s.id);

  const txnsRes = await supabase
    .schema("billing")
    .from("stripe_transactions")
    .select("student_id, payment_type, metadata")
    .in("payment_type", [
      "school_year_tuition",
      "homeschool_dropin",
      "aftercare_tuition",
      "fun_friday_tuition",
    ])
    .eq("status", "completed")
    .eq("is_deleted", false)
    .in("student_id", studentIds);
  assertOk(txnsRes);

  const txns = (txnsRes.data ?? []) as TxnRow[];

  const toHeadcount = (subset: SRaw[]): ProgramHeadcount => {
    const sorted = [...subset].sort(
      (a, b) => (b.profile_image_url ? 1 : 0) - (a.profile_image_url ? 1 : 0),
    );
    return {
      count: subset.length,
      students: sorted.slice(0, 6).map((s) => ({
        student_id: s.id,
        name:
          displayNameMap.get(s.id) ??
          getStudentDisplayName(null, s.child_legal_name),
        profile_image_url: s.profile_image_url,
      })),
    };
  };

  return dates.map((date) => {
    const [y, m, d] = date.split("-").map(Number);
    const isFriday = new Date(y, m - 1, d).getDay() === 5;

    if (isFriday) {
      const fri = students.filter((s) =>
        txns.some(
          (t) =>
            t.student_id === s.id && isSchoolYearFieldFridayPaid(t, date),
        ),
      );
      return {
        date,
        school_year: null,
        aftercare: null,
        field_friday: toHeadcount(fri),
      };
    }

    const schoolYearStudents = students.filter((s) =>
      txns.some(
        (t) => t.student_id === s.id && isSchoolYearWeekdayPaid(t, date),
      ),
    );
    const aftercareStudents = students.filter((s) =>
      txns.some(
        (t) => t.student_id === s.id && isSchoolYearAftercarePaid(t, date),
      ),
    );

    return {
      date,
      school_year: toHeadcount(schoolYearStudents),
      aftercare: toHeadcount(aftercareStudents),
      field_friday: null,
    };
  });
}

// ─── Record selects (used by the writes, same columns as the loaders) ─────────

export const SY_RECORD_SELECT =
  "id, date, student_id, recorded_by, notes, paid_for_day, marked_absent, excluded_from_roster, checked_in, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by";
export const AFTERCARE_RECORD_SELECT =
  "id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by, recorded_by, notes, paid_for_day";
export const FF_RECORD_SELECT =
  "id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by, recorded_by, notes, paid_for_day, marked_absent, excluded_from_roster, checked_in";

// ─── Student profile (sheet) ──────────────────────────────────────────────────

export type StudentProfileData = {
  student: ProfileStudentDetail | null;
  displayName: string | null;
  contacts: ProfileContacts | null;
  notes: ProfileNote[];
  schedule: ProfileSchedule | null;
};

export async function fetchStudentProfile(studentId: string): Promise<StudentProfileData> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [studentRes, notesRes, appRes, txRes] = await Promise.all([
    supabase.schema("admin").from("students").select("*").eq("id", studentId).single(),
    user
      ? supabase
          .schema("teachers")
          .from("teacher_notes")
          .select("id, note_text, category, is_shared, created_at")
          .eq("student_id", studentId)
          .eq("teacher_id", user.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as ProfileNote[], error: null }),
    // Newest application (a student with several applications used to fail here).
    supabase
      .schema("parent_app")
      .from("applications")
      .select("program, preferred_name, child_legal_name")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .schema("billing")
      .from("stripe_transactions")
      .select("payment_type, metadata")
      .eq("student_id", studentId)
      .in("payment_type", ["school_year_tuition", "homeschool_dropin"])
      .eq("status", "completed")
      .eq("is_deleted", false),
  ]);
  assertOk(studentRes, notesRes, appRes, txRes);

  const sd = studentRes.data as ProfileStudentDetail | null;
  const appData = appRes.data as {
    program: string;
    preferred_name: string | null;
    child_legal_name: string | null;
  } | null;
  const displayName = getStudentDisplayName(appData?.preferred_name, sd?.child_legal_name);
  const notes = (notesRes.data ?? []) as ProfileNote[];

  const appProgram = appData?.program ?? null;
  const isFull = appProgram === "school_year_26_27" || appProgram === "both";
  const isHomeschool = appProgram === "homeschool_drop_in";
  const txs = (txRes.data ?? []) as { payment_type: string; metadata: Record<string, string> | null }[];

  let schedule: ProfileSchedule | null = null;
  if (isFull) {
    const paidMonths = new Set<number>();
    for (const tx of txs) {
      if (tx.payment_type !== "school_year_tuition") continue;
      (tx.metadata?.selected_months ?? "")
        .split(",")
        .map(Number)
        .filter(Boolean)
        .forEach((m) => paidMonths.add(m));
    }
    schedule = {
      programType: "school_year_full",
      paidMonths: Array.from(paidMonths).sort((a, b) => a - b),
      homeschoolSelections: [],
    };
  } else if (isHomeschool) {
    const selections: Array<{ month: number; days: string[] }> = [];
    for (const tx of txs) {
      if (tx.payment_type !== "homeschool_dropin") continue;
      if (tx.metadata?.program !== "school_year_26_27") continue;
      try {
        const parsed = JSON.parse((tx.metadata?.week_selections as string) ?? "[]") as Array<{
          week: number;
          days: string[];
        }>;
        selections.push(...parsed.map((s) => ({ month: s.week, days: s.days })));
      } catch {}
    }
    const merged = new Map<number, Set<string>>();
    for (const s of selections) {
      if (!merged.has(s.month)) merged.set(s.month, new Set());
      s.days.forEach((d) => merged.get(s.month)!.add(d));
    }
    schedule = {
      programType: "homeschool",
      paidMonths: [],
      homeschoolSelections: Array.from(merged.entries())
        .sort(([a], [b]) => a - b)
        .map(([month, days]) => ({ month, days: Array.from(days) })),
    };
  }

  let contacts: ProfileContacts | null = null;
  if (sd?.parent_id) {
    const [healthRes, parentRes] = await Promise.all([
      supabase
        .schema("parent_app")
        .from("student_health_info")
        .select(
          "in_state_contact_name,in_state_contact_relation,in_state_contact_phone,out_of_state_contact_name,out_of_state_contact_relation,out_of_state_contact_phone",
        )
        .eq("student_id", studentId)
        .limit(1)
        .maybeSingle(),
      supabase
        .schema("admin")
        .from("users")
        .select(
          "full_name,email,g1_cell_phone,g1_work_phone,g2_full_name,g2_email,g2_cell_phone,g2_work_phone,g2_relationship",
        )
        .eq("id", sd.parent_id)
        .maybeSingle(),
    ]);
    assertOk(healthRes, parentRes);
    const h = healthRes.data;
    const p = parentRes.data;
    contacts = {
      g1_full_name: p?.full_name ?? null,
      g1_relationship: null,
      g1_cell_phone: p?.g1_cell_phone ?? null,
      g1_work_phone: p?.g1_work_phone ?? null,
      g1_email: p?.email ?? null,
      g2_full_name: p?.g2_full_name ?? null,
      g2_relationship: p?.g2_relationship ?? null,
      g2_cell_phone: p?.g2_cell_phone ?? null,
      g2_work_phone: p?.g2_work_phone ?? null,
      g2_email: p?.g2_email ?? null,
      in_state_contact_name: h?.in_state_contact_name ?? null,
      in_state_contact_relation: h?.in_state_contact_relation ?? null,
      in_state_contact_phone: h?.in_state_contact_phone ?? null,
      out_of_state_contact_name: h?.out_of_state_contact_name ?? null,
      out_of_state_contact_relation: h?.out_of_state_contact_relation ?? null,
      out_of_state_contact_phone: h?.out_of_state_contact_phone ?? null,
    };
  }

  return { student: sd, displayName, contacts, notes, schedule };
}

/** Staff who checked a student in / recorded the pickup (details sheet). */
export async function fetchStaffUsers(ids: (string | null | undefined)[]): Promise<StaffUser[]> {
  const unique = [...new Set(ids.filter(Boolean) as string[])];
  if (unique.length === 0) return [];
  const res = await supabase.schema("admin").from("users").select("id, full_name, profile_image_url").in("id", unique);
  assertOk(res);
  return (res.data ?? []) as StaffUser[];
}

export { getCurrentSchoolYearMonthIndex, SCHOOL_YEAR_AFTERCARE_MONTHS, SCHOOL_YEAR_MONTHS };
