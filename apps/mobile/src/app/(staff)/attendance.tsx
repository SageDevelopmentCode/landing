import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { supabase } from "@/lib/supabase";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { SkeletonBox } from "@/components/ui/SkeletonBox";

// ─── Types ────────────────────────────────────────────────────────────────────

type SummerRecord = {
  id: string;
  date: string;
  student_id: string;
  recorded_by: string;
  notes: string | null;
  paid_for_day: boolean;
  pickup_time: string | null;
  picked_up_by_name: string | null;
  picked_up_by_relationship: string | null;
  pickup_recorded_by: string | null;
};

type PickupPerson = {
  name: string;
  relationship: string;
};

type StaffUser = {
  id: string;
  full_name: string | null;
  profile_image_url: string | null;
};

type SummerStudentRow = {
  student_id: string;
  name: string | null;
  grade: string | null;
  profile_image_url: string | null;
  record: SummerRecord | null;
  hasEnrollment: boolean;
  has_allergies: string | null;
  program: string | null;
};

type TxnRow = {
  student_id: string;
  payment_type: string;
  metadata: Record<string, unknown> | null;
};

type AftercareRecord = {
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

type AftercareStudentRow = {
  student_id: string;
  name: string | null;
  grade: string | null;
  profile_image_url: string | null;
  record: AftercareRecord | null;
  hasEnrollment: boolean;
  has_allergies: string | null;
  program: string | null;
};

type FieldFridayRecord = {
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

type FieldFridayStudentRow = {
  student_id: string;
  name: string | null;
  grade: string | null;
  profile_image_url: string | null;
  record: FieldFridayRecord | null;
  hasEnrollment: boolean;
  has_allergies: string | null;
  program: string | null;
};

type HeadcountStudent = {
  student_id: string;
  name: string | null;
  profile_image_url: string | null;
};

type ProgramHeadcount = {
  count: number;
  students: HeadcountStudent[];
};

type DayHeadcount = {
  date: string;
  summer: ProgramHeadcount | null;
  aftercare: ProgramHeadcount | null;
  field_friday: ProgramHeadcount | null;
};

type ProfileStudentDetail = {
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

type ProfileContacts = {
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

type ProfileNote = {
  id: string;
  note_text: string;
  category: "general" | "behavioral" | "academic" | "social" | "health";
  is_shared: boolean;
  created_at: string;
};

type ProfileTab = "info" | "contacts" | "notes" | "weeks";

type ProfileSchedule = {
  programType: "summer_full" | "homeschool" | null;
  paidWeeks: number[];
  homeschoolSelections: Array<{ week: number; days: string[] }>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SUMMER_START = new Date(2026, 4, 25);
const TOTAL_WEEKS = 12;
const AMBER = "#d97706";
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

const PROGRAMS = [
  { key: "week_plan",    label: "Week Plan",        icon: "calendar-outline", color: "#3b82f6" },
  { key: "summer_26",   label: "Summer 2026",       icon: "sunny-outline",    color: "#d97706" },
  { key: "aftercare",   label: "Aftercare",         icon: "home-outline",     color: "#7c3aed" },
  { key: "field_friday",label: "Field Fun Fridays", icon: "leaf-outline",     color: "#0891b2" },
] as const;
type ProgramKey = (typeof PROGRAMS)[number]["key"];
type CalendarTarget = "aftercare" | "field_friday" | "summer";

const PROFILE_CATEGORY_COLORS: Record<ProfileNote["category"], string> = {
  general: "#6b7280",
  behavioral: "#7c3aed",
  academic: "#2563eb",
  social: "#059669",
  health: "#dc2626",
};

// ─── Calendar picker helpers ──────────────────────────────────────────────────

const DOW_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isCalendarDaySelectable(ymd: string, target: CalendarTarget): boolean {
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  if (target === "aftercare") return dow !== 0 && dow !== 6;
  if (target === "field_friday") return dow === 5;
  if (target === "summer") return dow !== 0 && dow !== 6;
  return true;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCurrentWeekNum(): number {
  const diff = Date.now() - SUMMER_START.getTime();
  if (diff < 0) return 1;
  return Math.min(TOTAL_WEEKS, Math.floor(diff / MS_PER_WEEK) + 1);
}

function getWeekDates(weekNum: number): string[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(SUMMER_START);
    d.setDate(d.getDate() + (weekNum - 1) * 7 + i);
    return toYMD(d);
  });
}

function getWeekNumForDate(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const diff = new Date(y, m - 1, d).getTime() - SUMMER_START.getTime();
  if (diff < 0) return 1;
  return Math.floor(diff / MS_PER_WEEK) + 1;
}

function getDayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
    new Date(y, m - 1, d).getDay()
  ];
}

function getWeekLabel(weekNum: number): string {
  const dates = getWeekDates(weekNum);
  const fmt = (ds: string) => {
    const [y, m, d] = ds.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  return `Week ${weekNum} · ${fmt(dates[0])}–${fmt(dates[4])}`;
}

function formatDayHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function shortName(name: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// ─── Summer date helpers ──────────────────────────────────────────────────────

function getInitialSummerDate(): string {
  const d = new Date();
  if (d < SUMMER_START) return toYMD(SUMMER_START);
  const dow = d.getDay();
  if (dow === 0) d.setDate(d.getDate() - 2);
  if (dow === 6) d.setDate(d.getDate() - 1);
  return toYMD(d);
}

// ─── Aftercare date helpers ───────────────────────────────────────────────────

function getInitialAftercareDate(): string {
  const d = new Date();
  const dow = d.getDay();
  if (dow === 0) d.setDate(d.getDate() - 2);
  if (dow === 6) d.setDate(d.getDate() - 1);
  return toYMD(d);
}

function shiftWeekday(dateStr: string, delta: 1 | -1): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  do {
    dt.setDate(dt.getDate() + delta);
  } while (dt.getDay() === 0 || dt.getDay() === 6);
  return toYMD(dt);
}

function formatAftercareDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Avatar color palette ─────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  "#c2714f", // terracotta
  "#8b6f47", // warm brown
  "#a07850", // caramel
  "#7a9e7e", // sage
  "#c4846b", // dusty rose
  "#b08d57", // golden tan
  "#5E7C68", // forest sage
  "#c27c47", // amber clay
];

function avatarColor(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

// ─── Field Fun Fridays date helpers ──────────────────────────────────────────

function getInitialFriday(): string {
  const d = new Date();
  const dow = d.getDay();
  if (dow === 5) return toYMD(d);
  if (dow === 6) { d.setDate(d.getDate() + 6); return toYMD(d); }
  d.setDate(d.getDate() + (5 - dow));
  return toYMD(d);
}

function shiftFriday(dateStr: string, delta: 1 | -1): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta * 7);
  return toYMD(dt);
}

// ─── Pickup time helpers ──────────────────────────────────────────────────────

const MONTH_NAMES_SHORT = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;

// ─── Payment parsers ──────────────────────────────────────────────────────────

function isStudentPaidForDate(
  txn: TxnRow,
  date: string,
  weekNum: number,
  dayOfWeek: string
): boolean {
  const meta = txn.metadata ?? {};
  if (txn.payment_type === "summer_tuition") {
    if (meta.plan_type === "full") return true;
    if (
      (meta.plan_type === "weekly" || meta.plan_type === "custom") &&
      typeof meta.weeks === "string"
    ) {
      return meta.weeks.split(",").map(Number).includes(weekNum);
    }
  } else if (txn.payment_type === "homeschool_dropin") {
    if (
      meta.program === "summer_26" &&
      typeof meta.week_selections === "string"
    ) {
      try {
        const sels = JSON.parse(meta.week_selections) as Array<{
          week: number;
          days: string[];
        }>;
        return sels.some(
          (s) => s.week === weekNum && s.days.includes(dayOfWeek)
        );
      } catch {
        return false;
      }
    }
    if (typeof meta.selected_days === "string") {
      return meta.selected_days.split(",").includes(date);
    }
  }
  return false;
}

function isStudentPaidForAftercare(txn: TxnRow, date: string): boolean {
  if (txn.payment_type !== "aftercare_tuition") return false;
  const meta = txn.metadata ?? {};
  if (
    typeof meta.selected_days === "string" &&
    meta.selected_days.split(",").includes(date)
  )
    return true;
  if (typeof meta.selected_months === "string") {
    const monthName = MONTH_NAMES_SHORT[parseInt(date.split("-")[1], 10) - 1];
    if (meta.selected_months.split(",").includes(monthName)) return true;
  }
  return false;
}

function isStudentPaidForFriday(txn: TxnRow, date: string): boolean {
  if (txn.payment_type !== "fun_friday_tuition") return false;
  const meta = txn.metadata ?? {};
  if (
    typeof meta.selected_fridays === "string" &&
    meta.selected_fridays.split(",").includes(date)
  )
    return true;
  if (typeof meta.selected_months === "string") {
    const monthName = MONTH_NAMES_SHORT[parseInt(date.split("-")[1], 10) - 1];
    if (meta.selected_months.split(",").includes(monthName)) return true;
  }
  return false;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchDayData(date: string): Promise<SummerStudentRow[]> {
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
      .select("student_id, admin_tags, has_allergies, program")
      .eq("status", "enrolled"),
  ]);

  const appsData = (appsRes.data ?? []) as { student_id: string; admin_tags: string[] | null; has_allergies: string | null; program: string | null }[];
  const enrolledIds = new Set(
    appsData
      .filter((a) => !(a.admin_tags ?? []).includes("Don't Include"))
      .map((a) => a.student_id)
  );
  const allergyMapDay = new Map(appsData.map((a) => [a.student_id, a.has_allergies]));
  const programMapDay = new Map(appsData.map((a) => [a.student_id, a.program]));

  type StudentRow = {
    id: string;
    child_legal_name: string | null;
    child_grade: string | null;
    profile_image_url: string | null;
  };

  const students = ((studentsRes.data ?? []) as StudentRow[]).filter((s) =>
    enrolledIds.has(s.id)
  );

  if (!students.length) return [];
  const studentIds = students.map((s) => s.id);

  const weekNum = getWeekNumForDate(date);
  const dayOfWeek = getDayOfWeek(date);

  const [recordsRes, txnsRes] = await Promise.all([
    supabase
      .schema("attendance")
      .from("summer_records")
      .select("id, date, student_id, recorded_by, notes, paid_for_day, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by")
      .eq("date", date)
      .in("student_id", studentIds),
    supabase
      .schema("billing")
      .from("stripe_transactions")
      .select("student_id, payment_type, metadata")
      .in("payment_type", ["summer_tuition", "homeschool_dropin"])
      .eq("status", "completed")
      .eq("is_deleted", false)
      .in("student_id", studentIds),
  ]);

  const paidIds = new Set<string>();
  for (const txn of (txnsRes.data ?? []) as TxnRow[]) {
    if (isStudentPaidForDate(txn, date, weekNum, dayOfWeek)) {
      paidIds.add(txn.student_id);
    }
  }

  const recordMap = new Map(
    ((recordsRes.data ?? []) as SummerRecord[]).map((r) => [r.student_id, r])
  );

  return students
    .map((s) => ({
      student_id: s.id,
      name: s.child_legal_name,
      grade: s.child_grade,
      profile_image_url: s.profile_image_url,
      record: recordMap.get(s.id) ?? null,
      hasEnrollment: paidIds.has(s.id),
      has_allergies: allergyMapDay.get(s.id) ?? null,
      program: programMapDay.get(s.id) ?? null,
    }))
    .sort((a, b) => {
      const priority = (s: SummerStudentRow) =>
        s.record !== null ? 0 : s.hasEnrollment ? 1 : 2;
      const pa = priority(a), pb = priority(b);
      if (pa !== pb) return pa - pb;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
}

async function fetchAftercareData(
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
      .select("student_id, admin_tags, has_allergies, program")
      .eq("status", "enrolled"),
  ]);

  const appsDataAc = (appsRes.data ?? []) as { student_id: string; admin_tags: string[] | null; has_allergies: string | null; program: string | null }[];
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

  const paidIds = new Set<string>();
  for (const txn of (txnsRes.data ?? []) as TxnRow[]) {
    if (isStudentPaidForAftercare(txn, date)) {
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
      name: s.child_legal_name,
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

async function fetchFieldFridayData(
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
      .select("student_id, admin_tags, has_allergies, program")
      .eq("status", "enrolled"),
  ]);

  const appsDataFf = (appsRes.data ?? []) as { student_id: string; admin_tags: string[] | null; has_allergies: string | null; program: string | null }[];
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
      .from("field_friday_records")
      .select("id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by, recorded_by, notes, paid_for_day")
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

  const paidIds = new Set<string>();
  for (const txn of (txnsRes.data ?? []) as TxnRow[]) {
    if (isStudentPaidForFriday(txn, date)) {
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
    .map((s) => ({
      student_id: s.id,
      name: s.child_legal_name,
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
        : s.record !== null         ? 1
        : s.hasEnrollment           ? 2
        :                             3;
      const pa = priority(a), pb = priority(b);
      if (pa !== pb) return pa - pb;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
}

async function fetchWeekHeadcounts(weekNum: number): Promise<DayHeadcount[]> {
  const dates = getWeekDates(weekNum);

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
      .select("student_id, admin_tags")
      .eq("status", "enrolled"),
  ]);

  const enrolledIds = new Set(
    ((appsRes.data ?? []) as { student_id: string; admin_tags: string[] | null }[])
      .filter((a) => !(a.admin_tags ?? []).includes("Don't Include"))
      .map((a) => a.student_id)
  );

  type SRaw = {
    id: string;
    child_legal_name: string | null;
    profile_image_url: string | null;
  };

  const students = ((studentsRes.data ?? []) as SRaw[]).filter((s) =>
    enrolledIds.has(s.id)
  );

  const empty = dates.map((date) => ({
    date,
    summer: null,
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
      "summer_tuition",
      "homeschool_dropin",
      "aftercare_tuition",
      "fun_friday_tuition",
    ])
    .eq("status", "completed")
    .eq("is_deleted", false)
    .in("student_id", studentIds);

  const txns = (txnsRes.data ?? []) as TxnRow[];

  const toHeadcount = (subset: SRaw[]): ProgramHeadcount => {
    const sorted = [...subset].sort(
      (a, b) => (b.profile_image_url ? 1 : 0) - (a.profile_image_url ? 1 : 0)
    );
    return {
      count: subset.length,
      students: sorted.slice(0, 6).map((s) => ({
        student_id: s.id,
        name: s.child_legal_name,
        profile_image_url: s.profile_image_url,
      })),
    };
  };

  return dates.map((date) => {
    const [y, m, d] = date.split("-").map(Number);
    const isFriday = new Date(y, m - 1, d).getDay() === 5;
    const dowStr = getDayOfWeek(date);

    if (isFriday) {
      const fri = students.filter((s) =>
        txns.some((t) => t.student_id === s.id && isStudentPaidForFriday(t, date))
      );
      return { date, summer: null, aftercare: null, field_friday: toHeadcount(fri) };
    }

    const summerStudents = students.filter((s) =>
      txns.some((t) => t.student_id === s.id && isStudentPaidForDate(t, date, weekNum, dowStr))
    );
    const aftercareStudents = students.filter((s) =>
      txns.some((t) => t.student_id === s.id && isStudentPaidForAftercare(t, date))
    );

    return {
      date,
      summer: toHeadcount(summerStudents),
      aftercare: toHeadcount(aftercareStudents),
      field_friday: null,
    };
  });
}

// ─── ProfileContactCard ───────────────────────────────────────────────────────

function ProfileContactCard({
  title,
  name,
  relationship,
  cellPhone,
  workPhone,
  email,
}: {
  title: string;
  name: string | null;
  relationship: string | null;
  cellPhone: string | null;
  workPhone: string | null;
  email: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCell() {
    if (!cellPhone) return;
    await Clipboard.setStringAsync(cellPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <View style={pcStyles.card}>
      <Text style={pcStyles.cardTitle}>{title}</Text>
      {name ? (
        <>
          <View style={pcStyles.nameRow}>
            <Text style={pcStyles.name}>{name}</Text>
            {cellPhone ? (
              <Pressable onPress={copyCell} style={pcStyles.copyBtn}>
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={15}
                  color={copied ? Brand.sage700 : "#9ca3af"}
                />
              </Pressable>
            ) : null}
          </View>
          {relationship ? <Text style={pcStyles.meta}>{relationship}</Text> : null}
          {cellPhone ? <Text style={pcStyles.meta}>Cell: {cellPhone}</Text> : null}
          {workPhone ? <Text style={pcStyles.meta}>Work: {workPhone}</Text> : null}
          {email ? <Text style={pcStyles.meta}>{email}</Text> : null}
        </>
      ) : (
        <Text style={pcStyles.meta}>No information on file.</Text>
      )}
    </View>
  );
}

const pcStyles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  cardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
    flex: 1,
  },
  copyBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  meta: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffAttendanceScreen() {
  // ── Program tab
  const [activeProgram, setActiveProgram] = useState<ProgramKey>("week_plan");

  // ── Summer state
  const [summerDate, setSummerDate] = useState(getInitialSummerDate);
  const [summerStudents, setSummerStudents] = useState<SummerStudentRow[]>([]);
  const [loadingSummer, setLoadingSummer] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // ── Aftercare state
  const [aftercareDate, setAftercareDate] = useState(getInitialAftercareDate);
  const [aftercareStudents, setAftercareStudents] = useState<
    AftercareStudentRow[]
  >([]);
  const [loadingAftercare, setLoadingAftercare] = useState(false);
  const [aftercareSavingIds, setAftercareSavingIds] = useState<Set<string>>(
    new Set()
  );
  const [aftercareSearch, setAftercareSearch] = useState("");

  // ── Field Fun Fridays state
  const [fieldFridayDate, setFieldFridayDate] = useState(getInitialFriday);
  const [fieldFridayStudents, setFieldFridayStudents] = useState<
    FieldFridayStudentRow[]
  >([]);
  const [loadingFieldFriday, setLoadingFieldFriday] = useState(false);
  const [fieldFridaySavingIds, setFieldFridaySavingIds] = useState<Set<string>>(
    new Set()
  );
  const [fieldFridaySearch, setFieldFridaySearch] = useState("");

  // ── Week plan state
  const [planWeekNum, setPlanWeekNum] = useState(getCurrentWeekNum);
  const [weekHeadcounts, setWeekHeadcounts] = useState<DayHeadcount[]>([]);
  const [loadingHeadcounts, setLoadingHeadcounts] = useState(false);

  // ── Aftercare pickup sheets
  const aftercarePickupSheetRef = useRef<BottomSheetModal>(null);
  const aftercarePickupDetailsSheetRef = useRef<BottomSheetModal>(null);
  const [aftercarePickupStudentId, setAftercarePickupStudentId] = useState<string | null>(null);
  const [aftercarePickupPersons, setAftercarePickupPersons] = useState<PickupPerson[]>([]);
  const [aftercarePickupPersonsLoading, setAftercarePickupPersonsLoading] = useState(false);
  const [selectedAftercarePickupPerson, setSelectedAftercarePickupPerson] = useState<PickupPerson | null>(null);
  const [aftercarePickupSaving, setAftercarePickupSaving] = useState(false);
  const [aftercarePickupDetailsStudent, setAftercarePickupDetailsStudent] = useState<AftercareStudentRow | null>(null);

  // ── Field Fun Fridays pickup sheets
  const fieldFridayPickupSheetRef = useRef<BottomSheetModal>(null);
  const fieldFridayPickupDetailsSheetRef = useRef<BottomSheetModal>(null);
  const [fieldFridayPickupStudentId, setFieldFridayPickupStudentId] = useState<string | null>(null);
  const [fieldFridayPickupPersons, setFieldFridayPickupPersons] = useState<PickupPerson[]>([]);
  const [fieldFridayPickupPersonsLoading, setFieldFridayPickupPersonsLoading] = useState(false);
  const [selectedFieldFridayPickupPerson, setSelectedFieldFridayPickupPerson] = useState<PickupPerson | null>(null);
  const [fieldFridayPickupSaving, setFieldFridayPickupSaving] = useState(false);
  const [fieldFridayPickupDetailsStudent, setFieldFridayPickupDetailsStudent] = useState<FieldFridayStudentRow | null>(null);

  // ── Summer pickup sheet
  const summerPickupSheetRef = useRef<BottomSheetModal>(null);
  const [summerPickupStudentId, setSummerPickupStudentId] = useState<string | null>(null);
  const [summerPickupPersons, setSummerPickupPersons] = useState<PickupPerson[]>([]);
  const [summerPickupPersonsLoading, setSummerPickupPersonsLoading] = useState(false);
  const [selectedSummerPickupPerson, setSelectedSummerPickupPerson] = useState<PickupPerson | null>(null);
  const [summerPickupSaving, setSummerPickupSaving] = useState(false);

  // ── Summer pickup details sheet
  const summerPickupDetailsSheetRef = useRef<BottomSheetModal>(null);
  const [summerPickupDetailsStudent, setSummerPickupDetailsStudent] = useState<SummerStudentRow | null>(null);

  // ── Shared pickup details staff state
  const [detailsStaffUsers, setDetailsStaffUsers] = useState<{
    checkedInBy: StaffUser | null;
    pickedUpBy: StaffUser | null;
  } | null>(null);
  const [loadingDetailsStaff, setLoadingDetailsStaff] = useState(false);

  // ── Week picker sheet
  const weekPickerSheetRef = useRef<BottomSheetModal>(null);

  // ── Calendar picker sheet
  const calendarSheetRef = useRef<BottomSheetModal>(null);
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // ── Student profile sheet
  const studentProfileSheetRef = useRef<BottomSheetModal>(null);
  const [profileStudent, setProfileStudent] = useState<ProfileStudentDetail | null>(null);
  const [profileContacts, setProfileContacts] = useState<ProfileContacts | null>(null);
  const [profileNotes, setProfileNotes] = useState<ProfileNote[]>([]);
  const [profileSchedule, setProfileSchedule] = useState<ProfileSchedule | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("info");

  const today = toYMD(new Date());

  // ── Summer data load
  useEffect(() => {
    if (activeProgram !== "summer_26") return;
    let cancelled = false;
    setLoadingSummer(true);
    fetchDayData(summerDate).then((rows) => {
      if (!cancelled) {
        setSummerStudents(rows);
        setLoadingSummer(false);
      }
    }).catch((e) => { notifyError("staff-attendance-day-fetch", e); if (!cancelled) setLoadingSummer(false); });
    return () => {
      cancelled = true;
    };
  }, [summerDate, activeProgram]);

  // ── Aftercare data load
  useEffect(() => {
    if (activeProgram !== "aftercare") return;
    let cancelled = false;
    setLoadingAftercare(true);
    fetchAftercareData(aftercareDate).then((rows) => {
      if (!cancelled) {
        setAftercareStudents(rows);
        setLoadingAftercare(false);
      }
    }).catch((e) => { notifyError("staff-attendance-aftercare-fetch", e); if (!cancelled) setLoadingAftercare(false); });
    return () => {
      cancelled = true;
    };
  }, [aftercareDate, activeProgram]);

  // ── Week plan data load
  useEffect(() => {
    if (activeProgram !== "week_plan") return;
    let cancelled = false;
    setLoadingHeadcounts(true);
    fetchWeekHeadcounts(planWeekNum).then((data) => {
      if (!cancelled) {
        setWeekHeadcounts(data);
        setLoadingHeadcounts(false);
      }
    }).catch((e) => { notifyError("staff-attendance-headcounts", e); if (!cancelled) setLoadingHeadcounts(false); });
    return () => {
      cancelled = true;
    };
  }, [planWeekNum, activeProgram]);

  // ── Field Fun Fridays data load
  useEffect(() => {
    if (activeProgram !== "field_friday") return;
    let cancelled = false;
    setLoadingFieldFriday(true);
    fetchFieldFridayData(fieldFridayDate).then((rows) => {
      if (!cancelled) {
        setFieldFridayStudents(rows);
        setLoadingFieldFriday(false);
      }
    }).catch((e) => { notifyError("staff-attendance-field-friday-fetch", e); if (!cancelled) setLoadingFieldFriday(false); });
    return () => {
      cancelled = true;
    };
  }, [fieldFridayDate, activeProgram]);

  // ── Summer attendance toggle ────────────────────────────────────────────────

  async function toggleAttendance(student: SummerStudentRow) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavingIds((prev) => new Set(prev).add(student.student_id));

    const patch = (transform: (s: SummerStudentRow) => SummerStudentRow) =>
      setSummerStudents((prev) =>
        prev.map((s) =>
          s.student_id !== student.student_id ? s : transform(s)
        )
      );

    if (student.record) {
      patch((s) => ({ ...s, record: null }));

      const { error } = await supabase
        .schema("attendance")
        .from("summer_records")
        .delete()
        .eq("id", student.record.id);

      if (error) {
        notifyError("staff-attendance-toggle", error);
        patch((s) => ({ ...s, record: student.record }));
      } else {
        notifyDiscord({
          type: "summer_attendance_removed",
          data: { studentName: student.name, date: summerDate },
        });
      }
    } else {
      const tempRecord: SummerRecord = {
        id: "temp",
        date: summerDate,
        student_id: student.student_id,
        recorded_by: user.id,
        notes: null,
        paid_for_day: student.hasEnrollment,
        pickup_time: null,
        picked_up_by_name: null,
        picked_up_by_relationship: null,
        pickup_recorded_by: null,
      };
      patch((s) => ({ ...s, record: tempRecord }));

      const { data, error } = await supabase
        .schema("attendance")
        .from("summer_records")
        .upsert(
          {
            student_id: student.student_id,
            date: summerDate,
            recorded_by: user.id,
            paid_for_day: student.hasEnrollment,
          },
          { onConflict: "student_id,date" }
        )
        .select("id, date, student_id, recorded_by, notes, paid_for_day, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by")
        .single();

      if (error || !data) {
        patch((s) => ({ ...s, record: null }));
      } else {
        patch((s) => ({ ...s, record: data as SummerRecord }));
        notifyDiscord({
          type: "summer_attendance_marked",
          data: { studentName: student.name, date: summerDate },
        });
      }
    }

    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(student.student_id);
      return next;
    });
  }

  // ── Aftercare attendance toggle ─────────────────────────────────────────────

  async function toggleAftercareAttendance(student: AftercareStudentRow) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAftercareSavingIds((prev) => new Set(prev).add(student.student_id));

    const patch = (
      transform: (s: AftercareStudentRow) => AftercareStudentRow
    ) =>
      setAftercareStudents((prev) =>
        prev.map((s) =>
          s.student_id !== student.student_id ? s : transform(s)
        )
      );

    if (student.record) {
      patch((s) => ({ ...s, record: null }));

      const { error } = await supabase
        .schema("attendance")
        .from("aftercare_records")
        .delete()
        .eq("id", student.record.id);

      if (error) {
        notifyError("staff-attendance-aftercare-toggle", error);
        patch((s) => ({ ...s, record: student.record }));
      } else {
        notifyDiscord({
          type: "aftercare_checked_out",
          data: { studentName: student.name, date: aftercareDate },
        });
      }
    } else {
      const tempRecord: AftercareRecord = {
        id: "temp",
        date: aftercareDate,
        student_id: student.student_id,
        pickup_time: null,
        picked_up_by_name: null,
        picked_up_by_relationship: null,
        pickup_recorded_by: null,
        recorded_by: user.id,
        notes: null,
        paid_for_day: student.hasEnrollment,
      };
      patch((s) => ({ ...s, record: tempRecord }));

      const { data, error } = await supabase
        .schema("attendance")
        .from("aftercare_records")
        .upsert(
          {
            student_id: student.student_id,
            date: aftercareDate,
            recorded_by: user.id,
            paid_for_day: student.hasEnrollment,
          },
          { onConflict: "student_id,date" }
        )
        .select(
          "id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by, recorded_by, notes, paid_for_day"
        )
        .single();

      if (error || !data) {
        patch((s) => ({ ...s, record: null }));
      } else {
        patch((s) => ({ ...s, record: data as AftercareRecord }));
        notifyDiscord({
          type: "aftercare_checked_in",
          data: { studentName: student.name, date: aftercareDate },
        });
      }
    }

    setAftercareSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(student.student_id);
      return next;
    });
  }

  // ── Field Fun Fridays attendance toggle ────────────────────────────────────

  async function toggleFieldFridayAttendance(student: FieldFridayStudentRow) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFieldFridaySavingIds((prev) => new Set(prev).add(student.student_id));

    const patch = (
      transform: (s: FieldFridayStudentRow) => FieldFridayStudentRow
    ) =>
      setFieldFridayStudents((prev) =>
        prev.map((s) =>
          s.student_id !== student.student_id ? s : transform(s)
        )
      );

    if (student.record) {
      patch((s) => ({ ...s, record: null }));

      const { error } = await supabase
        .schema("attendance")
        .from("field_friday_records")
        .delete()
        .eq("id", student.record.id);

      if (error) {
        notifyError("staff-attendance-field-friday-toggle", error);
        patch((s) => ({ ...s, record: student.record }));
      } else {
        notifyDiscord({
          type: "field_friday_checked_out",
          data: { studentName: student.name, date: fieldFridayDate },
        });
      }
    } else {
      const tempRecord: FieldFridayRecord = {
        id: "temp",
        date: fieldFridayDate,
        student_id: student.student_id,
        pickup_time: null,
        picked_up_by_name: null,
        picked_up_by_relationship: null,
        pickup_recorded_by: null,
        recorded_by: user.id,
        notes: null,
        paid_for_day: student.hasEnrollment,
      };
      patch((s) => ({ ...s, record: tempRecord }));

      const { data, error } = await supabase
        .schema("attendance")
        .from("field_friday_records")
        .upsert(
          {
            student_id: student.student_id,
            date: fieldFridayDate,
            recorded_by: user.id,
            paid_for_day: student.hasEnrollment,
          },
          { onConflict: "student_id,date" }
        )
        .select("id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by, recorded_by, notes, paid_for_day")
        .single();

      if (error || !data) {
        patch((s) => ({ ...s, record: null }));
      } else {
        patch((s) => ({ ...s, record: data as FieldFridayRecord }));
        notifyDiscord({
          type: "field_friday_checked_in",
          data: { studentName: student.name, date: fieldFridayDate },
        });
      }
    }

    setFieldFridaySavingIds((prev) => {
      const next = new Set(prev);
      next.delete(student.student_id);
      return next;
    });
  }

  // ── Aftercare pickup ─────────────────────────────────────────────────────────

  async function openAftercarePickup(student: AftercareStudentRow) {
    if (!student.record) return;
    setAftercarePickupStudentId(student.student_id);
    setSelectedAftercarePickupPerson(null);
    setAftercarePickupPersonsLoading(true);
    aftercarePickupSheetRef.current?.present();

    const [appsRes, authRes] = await Promise.all([
      supabase
        .schema("parent_app")
        .from("applications")
        .select("g1_full_name, g1_relationship, g2_full_name, g2_relationship")
        .eq("student_id", student.student_id)
        .eq("status", "enrolled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .schema("parent_app")
        .from("student_authorized_pickup_persons")
        .select("full_name, relationship, sort_order")
        .eq("student_id", student.student_id)
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
    for (const p of ((authRes.data ?? []) as { full_name: string; relationship: string }[])) {
      add(p.full_name, p.relationship);
    }

    setAftercarePickupPersons(persons);
    if (persons.length === 1) setSelectedAftercarePickupPerson(persons[0]);
    setAftercarePickupPersonsLoading(false);
  }

  async function confirmAftercarePickup(student: AftercareStudentRow) {
    if (!student.record || !selectedAftercarePickupPerson) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setAftercarePickupSaving(true);

    const { data, error } = await supabase
      .schema("attendance")
      .from("aftercare_records")
      .upsert(
        {
          student_id: student.student_id,
          date: aftercareDate,
          recorded_by: user.id,
          paid_for_day: student.hasEnrollment,
          picked_up_by_name: selectedAftercarePickupPerson.name,
          picked_up_by_relationship: selectedAftercarePickupPerson.relationship,
          pickup_recorded_by: user.id,
        },
        { onConflict: "student_id,date" }
      )
      .select("id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by, recorded_by, notes, paid_for_day")
      .single();

    if (!error && data) {
      setAftercareStudents((prev) =>
        prev.map((s) =>
          s.student_id !== student.student_id ? s : { ...s, record: data as AftercareRecord }
        )
      );
      notifyDiscord({
        type: "aftercare_pickup_recorded",
        data: {
          studentName: student.name,
          date: aftercareDate,
          pickedUpBy: selectedAftercarePickupPerson.name,
          relationship: selectedAftercarePickupPerson.relationship,
        },
      });
    }

    setAftercarePickupSaving(false);
    aftercarePickupSheetRef.current?.dismiss();
  }

  async function openAftercarePickupDetails(student: AftercareStudentRow) {
    setAftercarePickupDetailsStudent(student);
    setDetailsStaffUsers(null);
    setLoadingDetailsStaff(true);
    aftercarePickupDetailsSheetRef.current?.present();

    const record = student.record;
    if (record) {
      const ids = [...new Set([record.recorded_by, record.pickup_recorded_by].filter(Boolean) as string[])];
      const { data } = await supabase.schema("admin").from("users")
        .select("id, full_name, profile_image_url").in("id", ids);
      const map = new Map(((data ?? []) as StaffUser[]).map((u) => [u.id, u]));
      setDetailsStaffUsers({
        checkedInBy: record.recorded_by ? (map.get(record.recorded_by) ?? null) : null,
        pickedUpBy: record.pickup_recorded_by ? (map.get(record.pickup_recorded_by) ?? null) : null,
      });
    }
    setLoadingDetailsStaff(false);
  }

  // ── Field Fun Fridays pickup ──────────────────────────────────────────────────

  async function openFieldFridayPickup(student: FieldFridayStudentRow) {
    if (!student.record) return;
    setFieldFridayPickupStudentId(student.student_id);
    setSelectedFieldFridayPickupPerson(null);
    setFieldFridayPickupPersonsLoading(true);
    fieldFridayPickupSheetRef.current?.present();

    const [appsRes, authRes] = await Promise.all([
      supabase
        .schema("parent_app")
        .from("applications")
        .select("g1_full_name, g1_relationship, g2_full_name, g2_relationship")
        .eq("student_id", student.student_id)
        .eq("status", "enrolled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .schema("parent_app")
        .from("student_authorized_pickup_persons")
        .select("full_name, relationship, sort_order")
        .eq("student_id", student.student_id)
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
    for (const p of ((authRes.data ?? []) as { full_name: string; relationship: string }[])) {
      add(p.full_name, p.relationship);
    }

    setFieldFridayPickupPersons(persons);
    if (persons.length === 1) setSelectedFieldFridayPickupPerson(persons[0]);
    setFieldFridayPickupPersonsLoading(false);
  }

  async function confirmFieldFridayPickup(student: FieldFridayStudentRow) {
    if (!student.record || !selectedFieldFridayPickupPerson) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setFieldFridayPickupSaving(true);

    const { data, error } = await supabase
      .schema("attendance")
      .from("field_friday_records")
      .upsert(
        {
          student_id: student.student_id,
          date: fieldFridayDate,
          recorded_by: user.id,
          paid_for_day: student.hasEnrollment,
          picked_up_by_name: selectedFieldFridayPickupPerson.name,
          picked_up_by_relationship: selectedFieldFridayPickupPerson.relationship,
          pickup_recorded_by: user.id,
        },
        { onConflict: "student_id,date" }
      )
      .select("id, date, student_id, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by, recorded_by, notes, paid_for_day")
      .single();

    if (!error && data) {
      setFieldFridayStudents((prev) =>
        prev.map((s) =>
          s.student_id !== student.student_id ? s : { ...s, record: data as FieldFridayRecord }
        )
      );
      notifyDiscord({
        type: "field_friday_pickup_recorded",
        data: {
          studentName: student.name,
          date: fieldFridayDate,
          pickedUpBy: selectedFieldFridayPickupPerson.name,
          relationship: selectedFieldFridayPickupPerson.relationship,
        },
      });
    }

    setFieldFridayPickupSaving(false);
    fieldFridayPickupSheetRef.current?.dismiss();
  }

  async function openFieldFridayPickupDetails(student: FieldFridayStudentRow) {
    setFieldFridayPickupDetailsStudent(student);
    setDetailsStaffUsers(null);
    setLoadingDetailsStaff(true);
    fieldFridayPickupDetailsSheetRef.current?.present();

    const record = student.record;
    if (record) {
      const ids = [...new Set([record.recorded_by, record.pickup_recorded_by].filter(Boolean) as string[])];
      const { data } = await supabase.schema("admin").from("users")
        .select("id, full_name, profile_image_url").in("id", ids);
      const map = new Map(((data ?? []) as StaffUser[]).map((u) => [u.id, u]));
      setDetailsStaffUsers({
        checkedInBy: record.recorded_by ? (map.get(record.recorded_by) ?? null) : null,
        pickedUpBy: record.pickup_recorded_by ? (map.get(record.pickup_recorded_by) ?? null) : null,
      });
    }
    setLoadingDetailsStaff(false);
  }

  // ── Summer pickup ────────────────────────────────────────────────────────────

  async function openSummerPickup(student: SummerStudentRow) {
    if (!student.record) return;
    setSummerPickupStudentId(student.student_id);
    setSelectedSummerPickupPerson(null);
    setSummerPickupPersonsLoading(true);
    summerPickupSheetRef.current?.present();

    const [appsRes, authRes] = await Promise.all([
      supabase
        .schema("parent_app")
        .from("applications")
        .select("g1_full_name, g1_relationship, g2_full_name, g2_relationship")
        .eq("student_id", student.student_id)
        .eq("status", "enrolled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .schema("parent_app")
        .from("student_authorized_pickup_persons")
        .select("full_name, relationship, sort_order")
        .eq("student_id", student.student_id)
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
    for (const p of ((authRes.data ?? []) as { full_name: string; relationship: string }[])) {
      add(p.full_name, p.relationship);
    }

    setSummerPickupPersons(persons);
    if (persons.length === 1) setSelectedSummerPickupPerson(persons[0]);
    setSummerPickupPersonsLoading(false);
  }

  async function confirmSummerPickup(student: SummerStudentRow) {
    if (!student.record || !selectedSummerPickupPerson) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSummerPickupSaving(true);

    const { data, error } = await supabase
      .schema("attendance")
      .from("summer_records")
      .upsert(
        {
          student_id: student.student_id,
          date: summerDate,
          recorded_by: user.id,
          paid_for_day: student.hasEnrollment,
          picked_up_by_name: selectedSummerPickupPerson.name,
          picked_up_by_relationship: selectedSummerPickupPerson.relationship,
          pickup_recorded_by: user.id,
        },
        { onConflict: "student_id,date" }
      )
      .select("id, date, student_id, recorded_by, notes, paid_for_day, pickup_time, picked_up_by_name, picked_up_by_relationship, pickup_recorded_by")
      .single();

    if (!error && data) {
      setSummerStudents((prev) =>
        prev.map((s) =>
          s.student_id !== student.student_id ? s : { ...s, record: data as SummerRecord }
        )
      );
      notifyDiscord({
        type: "summer_pickup_recorded",
        data: {
          studentName: student.name,
          date: summerDate,
          pickedUpBy: selectedSummerPickupPerson.name,
        },
      });
    }

    setSummerPickupSaving(false);
    summerPickupSheetRef.current?.dismiss();
  }

  async function openSummerPickupDetails(student: SummerStudentRow) {
    setSummerPickupDetailsStudent(student);
    setDetailsStaffUsers(null);
    setLoadingDetailsStaff(true);
    summerPickupDetailsSheetRef.current?.present();

    const record = student.record;
    if (record) {
      const ids = [...new Set([record.recorded_by, record.pickup_recorded_by].filter(Boolean) as string[])];
      const { data } = await supabase.schema("admin").from("users")
        .select("id, full_name, profile_image_url").in("id", ids);
      const map = new Map(((data ?? []) as StaffUser[]).map((u) => [u.id, u]));
      setDetailsStaffUsers({
        checkedInBy: record.recorded_by ? (map.get(record.recorded_by) ?? null) : null,
        pickedUpBy: record.pickup_recorded_by ? (map.get(record.pickup_recorded_by) ?? null) : null,
      });
    }
    setLoadingDetailsStaff(false);
  }

  // ── Student profile ─────────────────────────────────────────────────────────

  async function openStudentProfile(studentId: string) {
    setProfileStudent(null);
    setProfileContacts(null);
    setProfileNotes([]);
    setProfileSchedule(null);
    setProfileTab("info");
    setLoadingProfile(true);
    studentProfileSheetRef.current?.present();

    const { data: { user } } = await supabase.auth.getUser();

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
      supabase
        .schema("parent_app")
        .from("applications")
        .select("program")
        .eq("student_id", studentId)
        .single(),
      supabase
        .schema("billing")
        .from("stripe_transactions")
        .select("payment_type, metadata")
        .eq("student_id", studentId)
        .in("payment_type", ["summer_tuition", "homeschool_dropin"])
        .eq("status", "completed")
        .eq("is_deleted", false),
    ]);

    const sd = studentRes.data as ProfileStudentDetail | null;
    setProfileStudent(sd ?? null);
    setProfileNotes((notesRes.data ?? []) as ProfileNote[]);

    const appProgram = (appRes.data as { program: string } | null)?.program ?? null;
    const isFull = appProgram === "summer_26" || appProgram === "both";
    const isHomeschool = appProgram === "homeschool_drop_in";
    const txs = (txRes.data ?? []) as { payment_type: string; metadata: Record<string, string> | null }[];

    if (isFull) {
      const paidWeeks = new Set<number>();
      for (const tx of txs) {
        if (tx.payment_type !== "summer_tuition") continue;
        const meta = tx.metadata ?? {};
        if (meta.plan_type === "full") {
          for (let w = 1; w <= 12; w++) paidWeeks.add(w);
        } else {
          (meta.weeks ?? "").split(",").map(Number).filter(Boolean).forEach((w) => paidWeeks.add(w));
        }
      }
      setProfileSchedule({ programType: "summer_full", paidWeeks: Array.from(paidWeeks).sort((a, b) => a - b), homeschoolSelections: [] });
    } else if (isHomeschool) {
      const selections: Array<{ week: number; days: string[] }> = [];
      for (const tx of txs) {
        if (tx.payment_type !== "homeschool_dropin") continue;
        try {
          const parsed = JSON.parse((tx.metadata?.week_selections as string) ?? "[]");
          selections.push(...parsed);
        } catch {}
      }
      const merged = new Map<number, Set<string>>();
      for (const s of selections) {
        if (!merged.has(s.week)) merged.set(s.week, new Set());
        s.days.forEach((d) => merged.get(s.week)!.add(d));
      }
      const sorted = Array.from(merged.entries())
        .sort(([a], [b]) => a - b)
        .map(([week, days]) => ({ week, days: Array.from(days) }));
      setProfileSchedule({ programType: "homeschool", paidWeeks: [], homeschoolSelections: sorted });
    } else {
      setProfileSchedule(null);
    }

    if (sd?.parent_id) {
      const [healthRes, parentRes] = await Promise.all([
        supabase
          .schema("parent_app")
          .from("student_health_info")
          .select(
            "in_state_contact_name,in_state_contact_relation,in_state_contact_phone,out_of_state_contact_name,out_of_state_contact_relation,out_of_state_contact_phone"
          )
          .eq("student_id", studentId)
          .single(),
        supabase
          .schema("admin")
          .from("users")
          .select(
            "full_name,email,g1_cell_phone,g1_work_phone,g2_full_name,g2_email,g2_cell_phone,g2_work_phone,g2_relationship"
          )
          .eq("id", sd.parent_id)
          .single(),
      ]);
      const h = healthRes.data;
      const p = parentRes.data;
      setProfileContacts({
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
      });
    }

    setLoadingProfile(false);
  }

  // ── Calendar picker ─────────────────────────────────────────────────────────

  function handleCalendarDaySelect(ymd: string) {
    if (!calendarTarget) return;
    if (calendarTarget === "aftercare") setAftercareDate(ymd);
    else if (calendarTarget === "field_friday") setFieldFridayDate(ymd);
    else if (calendarTarget === "summer") setSummerDate(ymd);
    calendarSheetRef.current?.dismiss();
  }

  function renderCalendarSheet() {
    if (!calendarTarget) return null;

    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const cells = buildMonthCells(year, month);

    const selectedYMDs = new Set<string>();
    if (calendarTarget === "aftercare") selectedYMDs.add(aftercareDate);
    else if (calendarTarget === "field_friday") selectedYMDs.add(fieldFridayDate);
    else if (calendarTarget === "summer") selectedYMDs.add(summerDate);

    const monthLabel = calendarMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return (
      <>
        <View style={styles.calendarMonthNav}>
          <Pressable
            style={({ pressed }) => [styles.calendarNavBtn, pressed && { opacity: 0.6 }]}
            onPress={() =>
              setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
            }
          >
            <Ionicons name="chevron-back" size={20} color="#1f2937" />
          </Pressable>
          <Text style={styles.calendarMonthLabel}>{monthLabel}</Text>
          <Pressable
            style={({ pressed }) => [styles.calendarNavBtn, pressed && { opacity: 0.6 }]}
            onPress={() =>
              setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
            }
          >
            <Ionicons name="chevron-forward" size={20} color="#1f2937" />
          </Pressable>
        </View>

        <View style={styles.calendarDowRow}>
          {DOW_SHORT.map((d, i) => (
            <Text key={i} style={styles.calendarDowLabel}>{d}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {cells.map((day, idx) => {
            if (day === null) {
              return <View key={`e${idx}`} style={styles.calendarCell} />;
            }
            const ymd = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const selectable = isCalendarDaySelectable(ymd, calendarTarget);
            const isToday = ymd === today;
            const isSel = selectedYMDs.has(ymd);

            return (
              <Pressable
                key={ymd}
                style={styles.calendarCell}
                onPress={() => handleCalendarDaySelect(ymd)}
                disabled={!selectable}
              >
                <View
                  style={[
                    styles.calendarDayNum,
                    isToday && !isSel && styles.calendarDayNumToday,
                    isSel && styles.calendarDayNumSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarDayTxt,
                      !selectable && styles.calendarDayTxtDisabled,
                      isToday && !isSel && styles.calendarDayTxtToday,
                      isSel && styles.calendarDayTxtSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </>
    );
  }

  // ── Student profile sheet ───────────────────────────────────────────────────

  function renderStudentProfileSheet() {
    const name = profileStudent?.child_legal_name ?? "Student";
    const grade = profileStudent?.child_grade ?? null;
    const profileImageUrl = profileStudent?.profile_image_url ?? null;

    function infoRow(label: string, value: string | null) {
      return (
        <View key={label} style={styles.profileInfoRow}>
          <Text style={styles.profileInfoLabel}>{label}</Text>
          <Text style={styles.profileInfoValue}>{value || "—"}</Text>
        </View>
      );
    }

    function sectionCard(title: string, rows: ReturnType<typeof infoRow>[]) {
      return (
        <View key={title} style={styles.profileSectionCard}>
          <Text style={styles.profileSectionTitle}>{title}</Text>
          {rows}
        </View>
      );
    }

    const dob =
      profileStudent?.dob_month && profileStudent?.dob_day && profileStudent?.dob_year
        ? `${profileStudent.dob_month}/${profileStudent.dob_day}/${profileStudent.dob_year}`
        : null;

    return (
      <>
        {/* Header */}
        <View style={styles.profileSheetHeader}>
          <View style={styles.profileSheetAvatar}>
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.profileSheetAvatarImg}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.profileSheetAvatarText}>
                {name ? getInitials(name) : "?"}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileSheetName} numberOfLines={1}>{name}</Text>
            {grade ? <Text style={styles.profileSheetGrade}>{grade}</Text> : null}
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.profileSheetTabBar}>
          {(["info", "contacts", "notes", "weeks"] as ProfileTab[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.profileSheetTab, profileTab === tab && styles.profileSheetTabActive]}
              onPress={() => setProfileTab(tab)}
            >
              <Text
                style={[
                  styles.profileSheetTabText,
                  profileTab === tab && styles.profileSheetTabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        {loadingProfile ? (
          <View style={{ padding: 16, gap: 12 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonBox key={i} width={i % 2 === 0 ? "70%" : "50%"} height={14} borderRadius={4} />
            ))}
          </View>
        ) : profileTab === "info" && profileStudent ? (
          <View style={{ gap: 12, padding: 16, paddingBottom: 32 }}>
            {sectionCard("Demographics", [
              infoRow("Legal Name", profileStudent.child_legal_name),
              infoRow("Grade", profileStudent.child_grade),
              infoRow("Date of Birth", dob),
            ])}
            {sectionCard("Learning Profile", [
              infoRow("Learning Style", profileStudent.learning_style),
              infoRow("Special Interests", profileStudent.special_interests),
              infoRow("Strengths & Interests", profileStudent.strengths_interests),
              infoRow("Current Challenges", profileStudent.current_challenges),
            ])}
            {sectionCard("Regulation", [
              infoRow("Dysregulation Response", profileStudent.dysregulation_response),
              infoRow("Regulation Strategies", profileStudent.regulation_strategies),
              infoRow("Activities to Avoid", profileStudent.activities_to_avoid),
            ])}
            {sectionCard("Health Flags", [
              infoRow(
                "Allergies",
                profileStudent.has_allergies === "yes"
                  ? profileStudent.allergies_description
                  : profileStudent.has_allergies === "no"
                    ? "None"
                    : null
              ),
              infoRow(
                "Medical Conditions",
                profileStudent.has_medical_conditions === "yes"
                  ? profileStudent.medical_conditions_description
                  : profileStudent.has_medical_conditions === "no"
                    ? "None"
                    : null
              ),
              infoRow("Emergency Medications", profileStudent.emergency_medications),
              infoRow("Needs Aide", profileStudent.needs_aide),
            ])}
          </View>
        ) : profileTab === "contacts" ? (
          profileContacts ? (
            <View style={{ gap: 10, padding: 16, paddingBottom: 32 }}>
              <ProfileContactCard key="g1" title="Guardian 1" name={profileContacts.g1_full_name} relationship={profileContacts.g1_relationship} cellPhone={profileContacts.g1_cell_phone} workPhone={profileContacts.g1_work_phone} email={profileContacts.g1_email} />
              <ProfileContactCard key="g2" title="Guardian 2" name={profileContacts.g2_full_name} relationship={profileContacts.g2_relationship} cellPhone={profileContacts.g2_cell_phone} workPhone={profileContacts.g2_work_phone} email={profileContacts.g2_email} />
              <ProfileContactCard key="is" title="In-State Emergency" name={profileContacts.in_state_contact_name} relationship={profileContacts.in_state_contact_relation} cellPhone={profileContacts.in_state_contact_phone} workPhone={null} email={null} />
              <ProfileContactCard key="oos" title="Out-of-State Emergency" name={profileContacts.out_of_state_contact_name} relationship={profileContacts.out_of_state_contact_relation} cellPhone={profileContacts.out_of_state_contact_phone} workPhone={null} email={null} />
            </View>
          ) : (
            <View style={{ padding: 16 }}>
              <View style={styles.profileEmptyCard}>
                <Text style={styles.profileEmptyText}>No contact data available.</Text>
              </View>
            </View>
          )
        ) : profileTab === "notes" ? (
          profileNotes.length === 0 ? (
            <View style={{ padding: 16 }}>
              <View style={styles.profileEmptyCard}>
                <Text style={styles.profileEmptyText}>No notes yet.</Text>
              </View>
            </View>
          ) : (
            <View style={{ gap: 10, padding: 16, paddingBottom: 32 }}>
              {profileNotes.map((note) => (
                <View key={note.id} style={styles.profileNoteCard}>
                  <View style={styles.profileNoteHeader}>
                    <View
                      style={[
                        styles.profileNoteCategoryBadge,
                        { backgroundColor: PROFILE_CATEGORY_COLORS[note.category] + "18" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.profileNoteCategoryText,
                          { color: PROFILE_CATEGORY_COLORS[note.category] },
                        ]}
                      >
                        {note.category}
                      </Text>
                    </View>
                    <Text style={styles.profileNoteDate}>
                      {new Date(note.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <Text style={styles.profileNoteText}>{note.note_text}</Text>
                </View>
              ))}
            </View>
          )
        ) : profileTab === "weeks" ? (
          renderWeeksTab()
        ) : null}
      </>
    );

    function renderWeeksTab() {
      if (!profileSchedule) {
        return (
          <View style={{ padding: 16 }}>
            <View style={styles.profileEmptyCard}>
              <Text style={styles.profileEmptyText}>No summer schedule on file.</Text>
            </View>
          </View>
        );
      }

      const currentWeek = getCurrentWeekNum();
      const now = Date.now();

      if (profileSchedule.programType === "summer_full") {
        return (
          <View style={{ gap: 0, paddingBottom: 32 }}>
            {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((wNum) => {
              const dates = getWeekDates(wNum);
              const weekStart = new Date(SUMMER_START);
              weekStart.setDate(weekStart.getDate() + (wNum - 1) * 7);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 6);
              const isPast = weekEnd.getTime() < now;
              const isCurrent = wNum === currentWeek;
              const isAttending = profileSchedule.paidWeeks.includes(wNum);

              const fmt = (ds: string) => {
                const [y, m, d] = ds.split("-").map(Number);
                return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              };

              return (
                <View
                  key={wNum}
                  style={[
                    styles.weeksRow,
                    isCurrent && styles.weeksRowCurrent,
                    isPast && { opacity: 0.45 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.weeksRowLabel}>Week {wNum}</Text>
                    <Text style={styles.weeksRowDates}>{fmt(dates[0])} – {fmt(dates[4])}</Text>
                  </View>
                  <View style={[styles.weeksBadge, isAttending ? styles.weeksBadgeGreen : styles.weeksBadgeGray]}>
                    <Text style={[styles.weeksBadgeText, isAttending ? styles.weeksBadgeTextGreen : styles.weeksBadgeTextGray]}>
                      {isAttending ? "Attending" : "Not Enrolled"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        );
      }

      if (profileSchedule.programType === "homeschool") {
        if (profileSchedule.homeschoolSelections.length === 0) {
          return (
            <View style={{ padding: 16 }}>
              <View style={styles.profileEmptyCard}>
                <Text style={styles.profileEmptyText}>No drop-in days on file.</Text>
              </View>
            </View>
          );
        }

        const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"] as const;
        const DAY_LABELS: Record<string, string> = { mon: "M", tue: "T", wed: "W", thu: "Th", fri: "F" };

        return (
          <View style={{ gap: 0, paddingBottom: 32 }}>
            {profileSchedule.homeschoolSelections.map(({ week, days }) => {
              const dates = getWeekDates(week);
              const weekStart = new Date(SUMMER_START);
              weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 6);
              const isPast = weekEnd.getTime() < now;
              const isCurrent = week === currentWeek;
              const enrolledSet = new Set(days);

              const fmt = (ds: string) => {
                const [y, m, d] = ds.split("-").map(Number);
                return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              };

              return (
                <View
                  key={week}
                  style={[
                    styles.weeksRow,
                    isCurrent && styles.weeksRowCurrent,
                    isPast && { opacity: 0.45 },
                  ]}
                >
                  <View style={{ flex: 1, gap: 6 }}>
                    <View>
                      <Text style={styles.weeksRowLabel}>Week {week}</Text>
                      <Text style={styles.weeksRowDates}>{fmt(dates[0])} – {fmt(dates[4])}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {DAY_KEYS.map((dk) => {
                        const active = enrolledSet.has(dk);
                        return (
                          <View
                            key={dk}
                            style={[styles.weeksDayPill, active && styles.weeksDayPillActive]}
                          >
                            <Text style={[styles.weeksDayPillText, active && styles.weeksDayPillTextActive]}>
                              {DAY_LABELS[dk]}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        );
      }

      return null;
    }
  }

  // ── Field Fun Fridays view ──────────────────────────────────────────────────

  function renderFieldFridayView() {
    const isThisFriday = fieldFridayDate === getInitialFriday();
    const presentCount = fieldFridayStudents.filter(
      (s) => s.record !== null
    ).length;
    const filtered = fieldFridaySearch
      ? fieldFridayStudents.filter((s) =>
          (s.name ?? "").toLowerCase().includes(fieldFridaySearch.toLowerCase())
        )
      : fieldFridayStudents;

    return (
      <View style={{ flex: 1 }}>
        {/* Date navigation */}
        <View style={styles.aftercareDateNav}>
          <Pressable
            style={styles.aftercareDateNavBtn}
            onPress={() => setFieldFridayDate((d) => shiftFriday(d, -1))}
          >
            <Ionicons name="chevron-back" size={20} color="#1f2937" />
          </Pressable>

          <View style={styles.aftercareDateRow}>
            <Pressable
              onPress={() => {
                const [y, m, d] = fieldFridayDate.split("-").map(Number);
                setCalendarMonth(new Date(y, m - 1, d));
                setCalendarTarget("field_friday");
                calendarSheetRef.current?.present();
              }}
            >
              <Text style={[styles.aftercareDateLabel, styles.dateNavTappable]}>
                {formatAftercareDateLabel(fieldFridayDate)}
              </Text>
            </Pressable>
            {isThisFriday && (
              <View style={[styles.todayBadge, { backgroundColor: Brand.sage700 }]}>
                <Text style={styles.todayBadgeText}>This Friday</Text>
              </View>
            )}
          </View>

          <Pressable
            style={styles.aftercareDateNavBtn}
            onPress={() => setFieldFridayDate((d) => shiftFriday(d, 1))}
          >
            <Ionicons name="chevron-forward" size={20} color="#1f2937" />
          </Pressable>
        </View>

        {/* Present count */}
        {!loadingFieldFriday && fieldFridayStudents.length > 0 && (
          <Text style={styles.aftercarePresentCount}>
            {presentCount} of {fieldFridayStudents.length} present
          </Text>
        )}

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons
            name="search-outline"
            size={16}
            color="#9ca3af"
            style={{ marginLeft: 12 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students…"
            placeholderTextColor="#9ca3af"
            value={fieldFridaySearch}
            onChangeText={setFieldFridaySearch}
            autoCorrect={false}
          />
          {fieldFridaySearch ? (
            <Pressable
              onPress={() => setFieldFridaySearch("")}
              style={{ padding: 8 }}
            >
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loadingFieldFriday ? (
            [0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.aftercareSkeleton}>
                <View style={styles.aftercareSkeletonTop}>
                  <SkeletonBox width={36} height={36} borderRadius={18} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <SkeletonBox width="60%" height={14} borderRadius={4} />
                    <SkeletonBox width="40%" height={11} borderRadius={4} />
                  </View>
                  <SkeletonBox width={44} height={44} borderRadius={10} />
                </View>
              </View>
            ))
          ) : filtered.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                { textAlign: "center", marginTop: 32 },
              ]}
            >
              {fieldFridaySearch
                ? "No students match your search"
                : "No enrolled students"}
            </Text>
          ) : (
            filtered.map((student) => {
              const isSaving = fieldFridaySavingIds.has(student.student_id);
              const isPresent = student.record !== null;
              const hasPickup = !!student.record?.picked_up_by_name;
              const FRIDAY_COLOR = "#0891b2";
              return (
                <View key={student.student_id} style={styles.aftercareCard}>
                  <View style={styles.aftercareCardTop}>

                    {/* Left: car icon (picked up only) + avatar + info */}
                    <View style={styles.aftercareCardLeft}>
                      {hasPickup && (
                        <Ionicons name="car-outline" size={14} color={FRIDAY_COLOR} />
                      )}
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1, flexDirection: "row", alignItems: "center", gap: 12 }]}
                        onPress={() => openStudentProfile(student.student_id)}
                      >
                        <View style={{ position: "relative" }}>
                          <View style={styles.cardAvatar}>
                            {student.profile_image_url ? (
                              <Image
                                source={{ uri: student.profile_image_url }}
                                style={styles.cardAvatarImg}
                                contentFit="cover"
                              />
                            ) : (
                              <Text style={styles.cardAvatarText}>
                                {student.name ? getInitials(student.name) : "?"}
                              </Text>
                            )}
                          </View>
                          {student.has_allergies === "yes" && (
                            <View style={styles.attendanceAllergyBadge}>
                              <Ionicons name="medical" size={8} color="#fff" />
                            </View>
                          )}
                        </View>
                        <View style={styles.aftercareCardInfo}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={[styles.cardName, { flexShrink: 1 }]} numberOfLines={1}>
                              {shortName(student.name)}
                            </Text>
                            {student.program === "homeschool_drop_in" && (
                              <Ionicons name="home" size={13} color="#059669" />
                            )}
                          </View>
                          <View style={styles.cardMetaRow}>
                            {student.grade ? (
                              <Text style={styles.cardGrade}>{student.grade}</Text>
                            ) : null}
                            <View
                              style={[
                                styles.cardBadge,
                                student.hasEnrollment ? styles.paidBadge : styles.unpaidBadge,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.cardBadgeText,
                                  { color: student.hasEnrollment ? "#15803d" : "#9ca3af" },
                                ]}
                              >
                                {student.hasEnrollment ? "Paid" : "Unpaid"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    </View>

                    {/* Right: pickup badge or record button + checkbox */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {hasPickup ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.summerPickupBadge,
                            { backgroundColor: FRIDAY_COLOR + "18" },
                            pressed && { opacity: 0.7 },
                          ]}
                          onPress={() => openFieldFridayPickupDetails(student)}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={[styles.summerPickupBadgeText, { color: FRIDAY_COLOR }]}>
                              {student.record!.picked_up_by_name}
                            </Text>
                            <Ionicons name="chevron-forward" size={11} color={FRIDAY_COLOR} />
                          </View>
                        </Pressable>
                      ) : isPresent ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.summerRecordPickupBtn,
                            { borderColor: FRIDAY_COLOR },
                            pressed && { opacity: 0.7 },
                          ]}
                          onPress={() => openFieldFridayPickup(student)}
                        >
                          <Text style={[styles.summerRecordPickupBtnText, { color: FRIDAY_COLOR }]}>
                            Record Pickup
                          </Text>
                        </Pressable>
                      ) : null}

                      <Pressable
                        style={({ pressed }) => [
                          styles.checkboxArea,
                          isPresent && { backgroundColor: FRIDAY_COLOR, borderColor: FRIDAY_COLOR },
                          (pressed || isSaving) && { opacity: 0.7 },
                          hasPickup && { opacity: 0.4 },
                        ]}
                        onPress={() => toggleFieldFridayAttendance(student)}
                        disabled={isSaving || hasPickup}
                      >
                        {isSaving ? (
                          <ActivityIndicator
                            size="small"
                            color={isPresent ? "#ffffff" : FRIDAY_COLOR}
                          />
                        ) : isPresent ? (
                          <Ionicons name="checkmark" size={22} color="#ffffff" />
                        ) : (
                          <View style={styles.checkboxEmpty} />
                        )}
                      </Pressable>
                    </View>

                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Aftercare view ──────────────────────────────────────────────────────────

  function renderAftercareView() {
    const isToday = aftercareDate === today;
    const presentCount = aftercareStudents.filter(
      (s) => s.record !== null
    ).length;
    const filtered = aftercareSearch
      ? aftercareStudents.filter((s) =>
          (s.name ?? "").toLowerCase().includes(aftercareSearch.toLowerCase())
        )
      : aftercareStudents;

    return (
      <View style={{ flex: 1 }}>
        {/* Date navigation */}
        <View style={styles.aftercareDateNav}>
          <Pressable
            style={styles.aftercareDateNavBtn}
            onPress={() => setAftercareDate((d) => shiftWeekday(d, -1))}
          >
            <Ionicons name="chevron-back" size={20} color="#1f2937" />
          </Pressable>

          <View style={styles.aftercareDateRow}>
            <Pressable
              onPress={() => {
                const [y, m, d] = aftercareDate.split("-").map(Number);
                setCalendarMonth(new Date(y, m - 1, d));
                setCalendarTarget("aftercare");
                calendarSheetRef.current?.present();
              }}
            >
              <Text style={[styles.aftercareDateLabel, styles.dateNavTappable]}>
                {formatAftercareDateLabel(aftercareDate)}
              </Text>
            </Pressable>
            {isToday && (
              <View style={[styles.todayBadge, { backgroundColor: Brand.sage700 }]}>
                <Text style={styles.todayBadgeText}>Today</Text>
              </View>
            )}
          </View>

          <Pressable
            style={styles.aftercareDateNavBtn}
            onPress={() => setAftercareDate((d) => shiftWeekday(d, 1))}
          >
            <Ionicons name="chevron-forward" size={20} color="#1f2937" />
          </Pressable>
        </View>

        {/* Present count */}
        {!loadingAftercare && aftercareStudents.length > 0 && (
          <Text style={styles.aftercarePresentCount}>
            {presentCount} of {aftercareStudents.length} present
          </Text>
        )}

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons
            name="search-outline"
            size={16}
            color="#9ca3af"
            style={{ marginLeft: 12 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students…"
            placeholderTextColor="#9ca3af"
            value={aftercareSearch}
            onChangeText={setAftercareSearch}
            autoCorrect={false}
          />
          {aftercareSearch ? (
            <Pressable
              onPress={() => setAftercareSearch("")}
              style={{ padding: 8 }}
            >
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loadingAftercare ? (
            [0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.aftercareSkeleton}>
                <View style={styles.aftercareSkeletonTop}>
                  <SkeletonBox width={36} height={36} borderRadius={18} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <SkeletonBox width="60%" height={14} borderRadius={4} />
                    <SkeletonBox width="40%" height={11} borderRadius={4} />
                  </View>
                  <SkeletonBox width={44} height={44} borderRadius={10} />
                </View>
              </View>
            ))
          ) : filtered.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                { textAlign: "center", marginTop: 32 },
              ]}
            >
              {aftercareSearch
                ? "No students match your search"
                : "No enrolled students"}
            </Text>
          ) : (
            filtered.map((student) => {
              const isSaving = aftercareSavingIds.has(student.student_id);
              const isPresent = student.record !== null;
              const hasPickup = !!student.record?.picked_up_by_name;
              return (
                <View key={student.student_id} style={styles.aftercareCard}>
                  <View style={styles.aftercareCardTop}>

                    {/* Left: car icon (picked up only) + avatar + info */}
                    <View style={styles.aftercareCardLeft}>
                      {hasPickup && (
                        <Ionicons name="car-outline" size={14} color={"#7c3aed"} />
                      )}
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1, flexDirection: "row", alignItems: "center", gap: 12 }]}
                        onPress={() => openStudentProfile(student.student_id)}
                      >
                        <View style={{ position: "relative" }}>
                          <View style={styles.cardAvatar}>
                            {student.profile_image_url ? (
                              <Image
                                source={{ uri: student.profile_image_url }}
                                style={styles.cardAvatarImg}
                                contentFit="cover"
                              />
                            ) : (
                              <Text style={styles.cardAvatarText}>
                                {student.name ? getInitials(student.name) : "?"}
                              </Text>
                            )}
                          </View>
                          {student.has_allergies === "yes" && (
                            <View style={styles.attendanceAllergyBadge}>
                              <Ionicons name="medical" size={8} color="#fff" />
                            </View>
                          )}
                        </View>
                        <View style={styles.aftercareCardInfo}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={[styles.cardName, { flexShrink: 1 }]} numberOfLines={1}>
                              {shortName(student.name)}
                            </Text>
                            {student.program === "homeschool_drop_in" && (
                              <Ionicons name="home" size={13} color="#059669" />
                            )}
                          </View>
                          <View style={styles.cardMetaRow}>
                            {student.grade ? (
                              <Text style={styles.cardGrade}>{student.grade}</Text>
                            ) : null}
                            <View
                              style={[
                                styles.cardBadge,
                                student.hasEnrollment ? styles.paidBadge : styles.unpaidBadge,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.cardBadgeText,
                                  { color: student.hasEnrollment ? "#15803d" : "#9ca3af" },
                                ]}
                              >
                                {student.hasEnrollment ? "Paid" : "Unpaid"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    </View>

                    {/* Right: pickup badge or record button + checkbox */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {hasPickup ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.summerPickupBadge,
                            { backgroundColor: "#7c3aed18" },
                            pressed && { opacity: 0.7 },
                          ]}
                          onPress={() => openAftercarePickupDetails(student)}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={[styles.summerPickupBadgeText, { color: "#7c3aed" }]}>
                              {student.record!.picked_up_by_name}
                            </Text>
                            <Ionicons name="chevron-forward" size={11} color={"#7c3aed"} />
                          </View>
                        </Pressable>
                      ) : isPresent ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.summerRecordPickupBtn,
                            { borderColor: "#7c3aed" },
                            pressed && { opacity: 0.7 },
                          ]}
                          onPress={() => openAftercarePickup(student)}
                        >
                          <Text style={[styles.summerRecordPickupBtnText, { color: "#7c3aed" }]}>
                            Record Pickup
                          </Text>
                        </Pressable>
                      ) : null}

                      <Pressable
                        style={({ pressed }) => [
                          styles.checkboxArea,
                          isPresent && { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
                          (pressed || isSaving) && { opacity: 0.7 },
                          hasPickup && { opacity: 0.4 },
                        ]}
                        onPress={() => toggleAftercareAttendance(student)}
                        disabled={isSaving || hasPickup}
                      >
                        {isSaving ? (
                          <ActivityIndicator
                            size="small"
                            color={isPresent ? "#ffffff" : "#7c3aed"}
                          />
                        ) : isPresent ? (
                          <Ionicons name="checkmark" size={22} color="#ffffff" />
                        ) : (
                          <View style={styles.checkboxEmpty} />
                        )}
                      </Pressable>
                    </View>

                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Week plan view ──────────────────────────────────────────────────────────

  function renderAvatarStack(students: HeadcountStudent[], total: number) {
    const MAX = 3;
    const shown = students.slice(0, MAX);
    const overflow = total - shown.length;
    return (
      <View style={styles.planAvatarRow}>
        {shown.map((s, idx) => (
          <View
            key={s.student_id}
            style={[
              styles.planAvatar,
              !s.profile_image_url && { backgroundColor: avatarColor(s.student_id) },
              { marginLeft: idx === 0 ? 0 : -10 },
            ]}
          >
            {s.profile_image_url ? (
              <Image
                source={{ uri: s.profile_image_url }}
                style={styles.planAvatarImg}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.planAvatarText}>
                {s.name ? getInitials(s.name) : "?"}
              </Text>
            )}
          </View>
        ))}
        {overflow > 0 && (
          <View style={[styles.planAvatar, styles.planOverflowPill, { marginLeft: -10 }]}>
            <Text style={styles.planOverflowText}>+{overflow}</Text>
          </View>
        )}
      </View>
    );
  }

  function renderWeekPlanView() {
    return (
      <View style={{ flex: 1 }}>
        {/* Week navigation */}
        <View style={styles.weekNavRow}>
          <Pressable
            style={styles.weekNavBtn}
            onPress={() => setPlanWeekNum((n) => Math.max(1, n - 1))}
            disabled={planWeekNum === 1}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={planWeekNum === 1 ? "#d1d5db" : "#1f2937"}
            />
          </Pressable>
          <Pressable
            onPress={() => weekPickerSheetRef.current?.present()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.weekLabel, styles.dateNavTappable]}>
              {getWeekLabel(planWeekNum)}
            </Text>
          </Pressable>
          <Pressable
            style={styles.weekNavBtn}
            onPress={() => setPlanWeekNum((n) => Math.min(TOTAL_WEEKS, n + 1))}
            disabled={planWeekNum === TOTAL_WEEKS}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={planWeekNum === TOTAL_WEEKS ? "#d1d5db" : "#1f2937"}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loadingHeadcounts ? (
            [0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.planDaySection}>
                <View style={styles.planDaySectionHeader}>
                  <SkeletonBox width="35%" height={14} borderRadius={4} />
                </View>
                <View style={styles.planBlocksRow}>
                  <View style={[styles.planBlock, styles.planBlockSummer]}>
                    <SkeletonBox width="40%" height={12} borderRadius={4} />
                    <SkeletonBox width={66} height={32} borderRadius={16} />
                  </View>
                  <View style={[styles.planBlock, styles.planBlockAftercare]}>
                    <SkeletonBox width="40%" height={12} borderRadius={4} />
                    <SkeletonBox width={44} height={32} borderRadius={16} />
                  </View>
                </View>
              </View>
            ))
          ) : (
            weekHeadcounts.map((day) => {
              const isToday = day.date === today;
              const [y, m, d] = day.date.split("-").map(Number);
              const isFriday = new Date(y, m - 1, d).getDay() === 5;

              return (
                <View key={day.date} style={styles.planDaySection}>
                  <View style={styles.planDaySectionHeader}>
                    <Text style={styles.planDayName}>
                      {formatDayHeader(day.date)}
                    </Text>
                    {isToday && (
                      <View style={[styles.todayBadge, { backgroundColor: AMBER }]}>
                        <Text style={styles.todayBadgeText}>Today</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.planBlocksRow}>
                    {isFriday && day.field_friday ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.planBlock,
                          styles.planBlockFriday,
                          pressed && { opacity: 0.75 },
                        ]}
                        onPress={() => {
                          setFieldFridayDate(day.date);
                          setActiveProgram("field_friday");
                        }}
                      >
                        <View style={styles.planBlockTextGroup}>
                          <Text style={[styles.planBlockLabel, { color: Brand.sage700 }]}>
                            Field Fun Fridays
                          </Text>
                          <Text style={styles.planBlockEnrolled}>
                            {day.field_friday.count} enrolled
                          </Text>
                        </View>
                        {renderAvatarStack(day.field_friday.students, day.field_friday.count)}
                      </Pressable>
                    ) : (
                      <>
                        {day.summer && (
                          <Pressable
                            style={({ pressed }) => [
                              styles.planBlock,
                              styles.planBlockSummer,
                              pressed && { opacity: 0.75 },
                            ]}
                            onPress={() => {
                              setSummerDate(day.date);
                              setActiveProgram("summer_26");
                            }}
                          >
                            <View style={styles.planBlockTextGroup}>
                              <Text style={[styles.planBlockLabel, { color: AMBER }]}>
                                Summer 2026
                              </Text>
                              <Text style={styles.planBlockEnrolled}>
                                {day.summer.count} enrolled
                              </Text>
                            </View>
                            {renderAvatarStack(day.summer.students, day.summer.count)}
                          </Pressable>
                        )}
                        {day.aftercare && (
                          <Pressable
                            style={({ pressed }) => [
                              styles.planBlock,
                              styles.planBlockAftercare,
                              pressed && { opacity: 0.75 },
                            ]}
                            onPress={() => {
                              setAftercareDate(day.date);
                              setActiveProgram("aftercare");
                            }}
                          >
                            <View style={styles.planBlockTextGroup}>
                              <Text style={[styles.planBlockLabel, { color: "#374151" }]}>
                                Aftercare
                              </Text>
                              <Text style={styles.planBlockEnrolled}>
                                {day.aftercare.count} enrolled
                              </Text>
                            </View>
                            {renderAvatarStack(day.aftercare.students, day.aftercare.count)}
                          </Pressable>
                        )}
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Pickup details shared render ────────────────────────────────────────────

  function renderPickupDetailsContent(
    studentName: string | null,
    record: { pickup_time: string | null; picked_up_by_name: string | null; picked_up_by_relationship: string | null },
    onClose: () => void,
  ) {
    return (
      <View style={{ gap: 16 }}>
        <Text style={styles.pdStudentName}>{studentName ?? "Student"}</Text>

        <View style={styles.pdRow}>
          <View style={styles.pdRowLeft}>
            <View style={[styles.pdDot, { backgroundColor: Brand.sage700 }]} />
            <View style={{ gap: 2 }}>
              <Text style={styles.pdLabel}>Picked Up</Text>
            </View>
          </View>
          <View style={styles.pdUserBlock}>
            <View style={[styles.pdAvatar32, { backgroundColor: avatarColor(record.picked_up_by_name!) }]}>
              <Text style={styles.pdAvatarText}>{getInitials(record.picked_up_by_name!)}</Text>
            </View>
            <Text style={styles.pdUserName} numberOfLines={1}>
              {record.picked_up_by_name!.split(" ")[0]}
            </Text>
          </View>
        </View>

        {record.picked_up_by_relationship ? (
          <>
            <View style={styles.pdDivider} />
            <View style={styles.pdSimpleRow}>
              <Text style={styles.pdLabel}>Relationship</Text>
              <Text style={styles.pdValue}>{record.picked_up_by_relationship}</Text>
            </View>
          </>
        ) : null}

        <View style={styles.pdDivider} />

        {loadingDetailsStaff ? (
          <View style={{ paddingVertical: 8, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#9ca3af" />
          </View>
        ) : detailsStaffUsers ? (
          <>
            {detailsStaffUsers.checkedInBy && (
              <>
                <View style={styles.pdRow}>
                  <View style={styles.pdRowLeft}>
                    <View style={[styles.pdDot, { backgroundColor: "#9ca3af" }]} />
                    <View style={{ gap: 2 }}>
                      <Text style={styles.pdLabel}>Checked In By</Text>
                      <Text style={styles.pdValue}>{detailsStaffUsers.checkedInBy.full_name ?? "Unknown"}</Text>
                    </View>
                  </View>
                  <View style={styles.pdUserBlock}>
                    {detailsStaffUsers.checkedInBy.profile_image_url ? (
                      <Image source={{ uri: detailsStaffUsers.checkedInBy.profile_image_url }} style={styles.pdAvatarImg32} contentFit="cover" />
                    ) : (
                      <View style={[styles.pdAvatar32, { backgroundColor: avatarColor(detailsStaffUsers.checkedInBy.id) }]}>
                        <Text style={styles.pdAvatarText}>{getInitials(detailsStaffUsers.checkedInBy.full_name ?? "")}</Text>
                      </View>
                    )}
                    <Text style={styles.pdUserName} numberOfLines={1}>
                      {detailsStaffUsers.checkedInBy.full_name?.split(" ")[0] ?? ""}
                    </Text>
                  </View>
                </View>
                <View style={styles.pdDivider} />
              </>
            )}
            {detailsStaffUsers.pickedUpBy && (
              <View style={styles.pdRow}>
                <View style={styles.pdRowLeft}>
                  <View style={[styles.pdDot, { backgroundColor: "#6b7280" }]} />
                  <View style={{ gap: 2 }}>
                    <Text style={styles.pdLabel}>Pickup Recorded By</Text>
                    <Text style={styles.pdValue}>{detailsStaffUsers.pickedUpBy.full_name ?? "Unknown"}</Text>
                  </View>
                </View>
                <View style={styles.pdUserBlock}>
                  {detailsStaffUsers.pickedUpBy.profile_image_url ? (
                    <Image source={{ uri: detailsStaffUsers.pickedUpBy.profile_image_url }} style={styles.pdAvatarImg32} contentFit="cover" />
                  ) : (
                    <View style={[styles.pdAvatar32, { backgroundColor: avatarColor(detailsStaffUsers.pickedUpBy.id) }]}>
                      <Text style={styles.pdAvatarText}>{getInitials(detailsStaffUsers.pickedUpBy.full_name ?? "")}</Text>
                    </View>
                  )}
                  <Text style={styles.pdUserName} numberOfLines={1}>
                    {detailsStaffUsers.pickedUpBy.full_name?.split(" ")[0] ?? ""}
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : null}

        <TouchableOpacity style={styles.pdCloseBtn} onPress={onClose} activeOpacity={0.75}>
          <Text style={styles.pdCloseBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Summer pickup details sheet ──────────────────────────────────────────────

  function renderSummerPickupDetailsSheet() {
    const student = summerPickupDetailsStudent;
    const record = student?.record;
    if (!record?.picked_up_by_name) return null;
    return renderPickupDetailsContent(student!.name, record, () => summerPickupDetailsSheetRef.current?.dismiss());
  }

  // ── Aftercare pickup sheet ────────────────────────────────────────────────────

  function renderAftercarePickupDetailsSheet() {
    const student = aftercarePickupDetailsStudent;
    const record = student?.record;
    if (!record?.picked_up_by_name) return null;
    return renderPickupDetailsContent(student!.name, record, () => aftercarePickupDetailsSheetRef.current?.dismiss());
  }

  function renderAftercarePickupSheet() {
    const student = aftercareStudents.find((s) => s.student_id === aftercarePickupStudentId);
    const canConfirm = !!selectedAftercarePickupPerson && !aftercarePickupSaving;
    const COLOR = "#7c3aed";

    return (
      <>
        <Text style={styles.pickupSheetTitle}>Who picked up?</Text>
        {aftercarePickupPersonsLoading ? (
          <View style={{ padding: 24, alignItems: "center" }}>
            <ActivityIndicator color={COLOR} />
          </View>
        ) : aftercarePickupPersons.length === 0 ? (
          <View style={{ padding: 16 }}>
            <Text style={styles.emptyText}>No authorized pickup persons on file.</Text>
          </View>
        ) : (
          aftercarePickupPersons.map((p) => {
            const isSelected = selectedAftercarePickupPerson?.name === p.name;
            return (
              <TouchableOpacity
                key={p.name}
                style={[
                  styles.pickupSlotRow,
                  isSelected && { backgroundColor: COLOR + "18" },
                ]}
                onPress={() => setSelectedAftercarePickupPerson(p)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.summerPickupRadio,
                    isSelected && { borderColor: COLOR, backgroundColor: COLOR + "18" },
                  ]}
                >
                  {isSelected && <View style={[styles.summerPickupRadioDot, { backgroundColor: COLOR }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickupSlotText, isSelected && { color: COLOR }]}>
                    {p.name}
                  </Text>
                  {p.relationship ? (
                    <Text style={styles.cardGrade}>{p.relationship}</Text>
                  ) : null}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={COLOR} />
                )}
              </TouchableOpacity>
            );
          })
        )}

        <Pressable
          style={[styles.summerPickupConfirmBtn, { backgroundColor: COLOR }, !canConfirm && { opacity: 0.4 }]}
          onPress={() => student && confirmAftercarePickup(student)}
          disabled={!canConfirm}
        >
          {aftercarePickupSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.summerPickupConfirmText}>Confirm Pickup</Text>
          )}
        </Pressable>
      </>
    );
  }

  // ── Field Fun Fridays pickup sheet ────────────────────────────────────────────

  function renderFieldFridayPickupDetailsSheet() {
    const student = fieldFridayPickupDetailsStudent;
    const record = student?.record;
    if (!record?.picked_up_by_name) return null;
    return renderPickupDetailsContent(student!.name, record, () => fieldFridayPickupDetailsSheetRef.current?.dismiss());
  }

  function renderFieldFridayPickupSheet() {
    const student = fieldFridayStudents.find((s) => s.student_id === fieldFridayPickupStudentId);
    const canConfirm = !!selectedFieldFridayPickupPerson && !fieldFridayPickupSaving;
    const COLOR = "#0891b2";

    return (
      <>
        <Text style={styles.pickupSheetTitle}>Who picked up?</Text>
        {fieldFridayPickupPersonsLoading ? (
          <View style={{ padding: 24, alignItems: "center" }}>
            <ActivityIndicator color={COLOR} />
          </View>
        ) : fieldFridayPickupPersons.length === 0 ? (
          <View style={{ padding: 16 }}>
            <Text style={styles.emptyText}>No authorized pickup persons on file.</Text>
          </View>
        ) : (
          fieldFridayPickupPersons.map((p) => {
            const isSelected = selectedFieldFridayPickupPerson?.name === p.name;
            return (
              <TouchableOpacity
                key={p.name}
                style={[
                  styles.pickupSlotRow,
                  isSelected && { backgroundColor: COLOR + "18" },
                ]}
                onPress={() => setSelectedFieldFridayPickupPerson(p)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.summerPickupRadio,
                    isSelected && { borderColor: COLOR, backgroundColor: COLOR + "18" },
                  ]}
                >
                  {isSelected && <View style={[styles.summerPickupRadioDot, { backgroundColor: COLOR }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickupSlotText, isSelected && { color: COLOR }]}>
                    {p.name}
                  </Text>
                  {p.relationship ? (
                    <Text style={styles.cardGrade}>{p.relationship}</Text>
                  ) : null}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={COLOR} />
                )}
              </TouchableOpacity>
            );
          })
        )}

        <Pressable
          style={[styles.summerPickupConfirmBtn, { backgroundColor: COLOR }, !canConfirm && { opacity: 0.4 }]}
          onPress={() => student && confirmFieldFridayPickup(student)}
          disabled={!canConfirm}
        >
          {fieldFridayPickupSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.summerPickupConfirmText}>Confirm Pickup</Text>
          )}
        </Pressable>
      </>
    );
  }

  // ── Summer pickup sheet ──────────────────────────────────────────────────────

  function renderSummerPickupSheet() {
    const student = summerStudents.find((s) => s.student_id === summerPickupStudentId);
    const canConfirm = !!selectedSummerPickupPerson && !summerPickupSaving;

    return (
      <>
        <Text style={styles.pickupSheetTitle}>Who picked up?</Text>
        {summerPickupPersonsLoading ? (
          <View style={{ padding: 24, alignItems: "center" }}>
            <ActivityIndicator color={AMBER} />
          </View>
        ) : summerPickupPersons.length === 0 ? (
          <View style={{ padding: 16 }}>
            <Text style={styles.emptyText}>No authorized pickup persons on file.</Text>
          </View>
        ) : (
          summerPickupPersons.map((p) => {
            const isSelected = selectedSummerPickupPerson?.name === p.name;
            return (
              <TouchableOpacity
                key={p.name}
                style={[
                  styles.pickupSlotRow,
                  isSelected && { backgroundColor: AMBER + "18" },
                ]}
                onPress={() => setSelectedSummerPickupPerson(p)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.summerPickupRadio,
                    isSelected && styles.summerPickupRadioSelected,
                  ]}
                >
                  {isSelected && <View style={styles.summerPickupRadioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.pickupSlotText,
                      isSelected && { color: AMBER },
                    ]}
                  >
                    {p.name}
                  </Text>
                  {p.relationship ? (
                    <Text style={styles.cardGrade}>{p.relationship}</Text>
                  ) : null}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={AMBER} />
                )}
              </TouchableOpacity>
            );
          })
        )}

        <Pressable
          style={[
            styles.summerPickupConfirmBtn,
            !canConfirm && { opacity: 0.4 },
          ]}
          onPress={() => student && confirmSummerPickup(student)}
          disabled={!canConfirm}
        >
          {summerPickupSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.summerPickupConfirmText}>Confirm Pickup</Text>
          )}
        </Pressable>
      </>
    );
  }

  // ── Summer view ─────────────────────────────────────────────────────────────

  function renderSummerView() {
    const isToday = summerDate === today;
    const presentCount = summerStudents.filter((s) => s.record !== null).length;
    const filtered = search
      ? summerStudents.filter((s) =>
          (s.name ?? "").toLowerCase().includes(search.toLowerCase())
        )
      : summerStudents;

    return (
      <View style={{ flex: 1 }}>
        {/* Date navigator */}
        <View style={styles.aftercareDateNav}>
          <Pressable
            style={styles.aftercareDateNavBtn}
            onPress={() => setSummerDate((d) => shiftWeekday(d, -1))}
          >
            <Ionicons name="chevron-back" size={20} color="#1f2937" />
          </Pressable>

          <View style={styles.aftercareDateRow}>
            <Pressable
              onPress={() => {
                const [y, m, d] = summerDate.split("-").map(Number);
                setCalendarMonth(new Date(y, m - 1, d));
                setCalendarTarget("summer");
                calendarSheetRef.current?.present();
              }}
            >
              <Text style={[styles.aftercareDateLabel, styles.dateNavTappable]}>
                {formatAftercareDateLabel(summerDate)}
              </Text>
            </Pressable>
            {isToday && (
              <View style={[styles.todayBadge, { backgroundColor: AMBER }]}>
                <Text style={styles.todayBadgeText}>Today</Text>
              </View>
            )}
          </View>

          <Pressable
            style={styles.aftercareDateNavBtn}
            onPress={() => setSummerDate((d) => shiftWeekday(d, 1))}
          >
            <Ionicons name="chevron-forward" size={20} color="#1f2937" />
          </Pressable>
        </View>

        {/* Present count */}
        {!loadingSummer && summerStudents.length > 0 && (
          <Text style={styles.aftercarePresentCount}>
            {presentCount} of {summerStudents.length} present
          </Text>
        )}

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons
            name="search-outline"
            size={16}
            color="#9ca3af"
            style={{ marginLeft: 12 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students…"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} style={{ padding: 8 }}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loadingSummer ? (
            [0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.aftercareSkeleton}>
                <View style={styles.aftercareSkeletonTop}>
                  <SkeletonBox width={36} height={36} borderRadius={18} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <SkeletonBox width="60%" height={14} borderRadius={4} />
                    <SkeletonBox width="40%" height={11} borderRadius={4} />
                  </View>
                  <SkeletonBox width={44} height={44} borderRadius={10} />
                </View>
              </View>
            ))
          ) : filtered.length === 0 ? (
            <Text
              style={[styles.emptyText, { textAlign: "center", marginTop: 32 }]}
            >
              {search ? "No students match your search" : "No enrolled students"}
            </Text>
          ) : (
            filtered.map((student) => {
              const isSaving = savingIds.has(student.student_id);
              const isPresent = student.record !== null;
              const hasPickup = !!student.record?.picked_up_by_name;
              return (
                <View key={student.student_id} style={styles.aftercareCard}>
                  <View style={styles.aftercareCardTop}>

                    {/* Left: car icon (picked up only) + avatar + info */}
                    <View style={styles.aftercareCardLeft}>
                      {hasPickup && (
                        <Ionicons name="car-outline" size={14} color={AMBER} />
                      )}
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1, flexDirection: "row", alignItems: "center", gap: 12 }]}
                        onPress={() => openStudentProfile(student.student_id)}
                      >
                        <View style={{ position: "relative" }}>
                          <View style={styles.cardAvatar}>
                            {student.profile_image_url ? (
                              <Image
                                source={{ uri: student.profile_image_url }}
                                style={styles.cardAvatarImg}
                                contentFit="cover"
                              />
                            ) : (
                              <Text style={styles.cardAvatarText}>
                                {student.name ? getInitials(student.name) : "?"}
                              </Text>
                            )}
                          </View>
                          {student.has_allergies === "yes" && (
                            <View style={styles.attendanceAllergyBadge}>
                              <Ionicons name="medical" size={8} color="#fff" />
                            </View>
                          )}
                        </View>
                        <View style={styles.aftercareCardInfo}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={[styles.cardName, { flexShrink: 1 }]} numberOfLines={1}>
                              {shortName(student.name)}
                            </Text>
                            {student.program === "homeschool_drop_in" && (
                              <Ionicons name="home" size={13} color="#059669" />
                            )}
                            {isPresent && !student.hasEnrollment && (
                              <Ionicons name="alert-circle" size={18} color="#f97316" />
                            )}
                          </View>
                          <View style={styles.cardMetaRow}>
                            {student.grade ? (
                              <Text style={styles.cardGrade}>{student.grade}</Text>
                            ) : null}
                            <View
                              style={[
                                styles.cardBadge,
                                student.hasEnrollment
                                  ? styles.paidBadge
                                  : styles.unpaidBadge,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.cardBadgeText,
                                  {
                                    color: student.hasEnrollment
                                      ? "#15803d"
                                      : "#9ca3af",
                                  },
                                ]}
                              >
                                {student.hasEnrollment ? "Paid" : "Unpaid"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    </View>

                    {/* Right: pickup badge or record button + checkbox */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {hasPickup ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.summerPickupBadge,
                            pressed && { opacity: 0.7 },
                          ]}
                          onPress={() => openSummerPickupDetails(student)}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={styles.summerPickupBadgeText}>
                              {student.record!.picked_up_by_name}
                            </Text>
                            <Ionicons name="chevron-forward" size={11} color={AMBER} />
                          </View>
                        </Pressable>
                      ) : isPresent ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.summerRecordPickupBtn,
                            pressed && { opacity: 0.7 },
                          ]}
                          onPress={() => openSummerPickup(student)}
                        >
                          <Text style={styles.summerRecordPickupBtnText}>
                            Record Pickup
                          </Text>
                        </Pressable>
                      ) : null}

                      <Pressable
                        style={({ pressed }) => [
                          styles.checkboxArea,
                          isPresent && { backgroundColor: AMBER, borderColor: AMBER },
                          (pressed || isSaving) && { opacity: 0.7 },
                          hasPickup && { opacity: 0.4 },
                        ]}
                        onPress={() => toggleAttendance(student)}
                        disabled={isSaving || hasPickup}
                      >
                        {isSaving ? (
                          <ActivityIndicator
                            size="small"
                            color={isPresent ? "#ffffff" : AMBER}
                          />
                        ) : isPresent ? (
                          <Ionicons name="checkmark" size={22} color="#ffffff" />
                        ) : (
                          <View style={styles.checkboxEmpty} />
                        )}
                      </Pressable>
                    </View>

                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={{ flex: 1 }}>
          {/* Program tab switcher */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.programTabRow}
            style={styles.programTabScroll}
          >
            {PROGRAMS.map((p) => {
              const active = p.key === activeProgram;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setActiveProgram(p.key)}
                  style={[
                    styles.programTab,
                    active && { borderColor: p.color, backgroundColor: p.color + "18" },
                  ]}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={p.icon as "calendar-outline"}
                    size={15}
                    color={active ? p.color : "#9ca3af"}
                  />
                  <Text
                    style={[
                      styles.programTabText,
                      active && { color: p.color, fontFamily: FontFamilies.bodySemiBold },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active program view */}
          {activeProgram === "aftercare"
            ? renderAftercareView()
            : activeProgram === "field_friday"
            ? renderFieldFridayView()
            : activeProgram === "week_plan"
            ? renderWeekPlanView()
            : renderSummerView()}
        </View>
      </SafeAreaView>

      {/* Calendar picker bottom sheet */}
      <BottomSheetModal
        ref={calendarSheetRef}
        snapPoints={["50%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        onDismiss={() => setCalendarTarget(null)}
      >
        <BottomSheetScrollView contentContainerStyle={styles.calendarSheetContent}>
          {renderCalendarSheet()}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Student profile bottom sheet */}
      <BottomSheetModal
        ref={studentProfileSheetRef}
        snapPoints={["75%", "92%"]}
        enablePanDownToClose
        onDismiss={() => {
          setProfileStudent(null);
          setProfileContacts(null);
          setProfileNotes([]);
        }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      >
        <BottomSheetScrollView>
          {renderStudentProfileSheet()}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Week picker bottom sheet */}
      <BottomSheetModal
        ref={weekPickerSheetRef}
        snapPoints={["50%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={styles.pickupSheetContent}>
          <Text style={styles.pickupSheetTitle}>Select Week</Text>
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((n) => {
            const isSelected = n === planWeekNum;
            return (
              <TouchableOpacity
                key={n}
                style={[styles.pickupSlotRow, isSelected && styles.weekPickerSlotSelected]}
                onPress={() => {
                  setPlanWeekNum(n);
                  weekPickerSheetRef.current?.dismiss();
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.pickupSlotText, isSelected && styles.weekPickerSlotTextSelected]}>
                  {getWeekLabel(n)}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#3b82f6" />
                )}
              </TouchableOpacity>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Aftercare pickup — person selection sheet */}
      <BottomSheetModal
        ref={aftercarePickupSheetRef}
        snapPoints={["60%", "80%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
        onDismiss={() => {
          setAftercarePickupStudentId(null);
          setAftercarePickupPersons([]);
          setSelectedAftercarePickupPerson(null);
          setAftercarePickupSaving(false);
        }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.pickupSheetContent}>
          {renderAftercarePickupSheet()}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Aftercare pickup — details sheet */}
      <BottomSheetModal
        ref={aftercarePickupDetailsSheetRef}
        snapPoints={["50%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
        onDismiss={() => { setAftercarePickupDetailsStudent(null); setDetailsStaffUsers(null); }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.pickupSheetContent}>
          {renderAftercarePickupDetailsSheet()}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Field Friday pickup — person selection sheet */}
      <BottomSheetModal
        ref={fieldFridayPickupSheetRef}
        snapPoints={["60%", "80%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
        onDismiss={() => {
          setFieldFridayPickupStudentId(null);
          setFieldFridayPickupPersons([]);
          setSelectedFieldFridayPickupPerson(null);
          setFieldFridayPickupSaving(false);
        }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.pickupSheetContent}>
          {renderFieldFridayPickupSheet()}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Field Friday pickup — details sheet */}
      <BottomSheetModal
        ref={fieldFridayPickupDetailsSheetRef}
        snapPoints={["50%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
        onDismiss={() => { setFieldFridayPickupDetailsStudent(null); setDetailsStaffUsers(null); }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.pickupSheetContent}>
          {renderFieldFridayPickupDetailsSheet()}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Summer pickup — person selection sheet */}
      <BottomSheetModal
        ref={summerPickupSheetRef}
        snapPoints={["60%", "80%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
        onDismiss={() => {
          setSummerPickupStudentId(null);
          setSummerPickupPersons([]);
          setSelectedSummerPickupPerson(null);
          setSummerPickupSaving(false);
        }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.pickupSheetContent}>
          {renderSummerPickupSheet()}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Summer pickup — details sheet */}
      <BottomSheetModal
        ref={summerPickupDetailsSheetRef}
        snapPoints={["50%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
        onDismiss={() => { setSummerPickupDetailsStudent(null); setDetailsStaffUsers(null); }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.pickupSheetContent}>
          {renderSummerPickupDetailsSheet()}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  // ── Program tab switcher
  programTabScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  programTabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  programTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  programTabText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#6b7280",
  },

  // ── Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
  },

  // ── Aftercare date nav
  aftercareDateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 4,
  },
  aftercareDateNavBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  aftercareDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aftercareDateLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  aftercarePresentCount: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },

  // ── Aftercare cards
  aftercareCard: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#f0efed",
  },
  aftercareCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  aftercareCardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 12,
  },
  aftercareCardInfo: {
    flex: 1,
  },
  // ── Aftercare pickup row
  aftercarePickupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  setPickupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(94,124,104,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Brand.sage700,
  },
  setPickupBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: Brand.sage700,
  },
  pickupTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfeff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pickupTimeBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#15803d",
  },
  changePickupBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changePickupText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    textDecorationLine: "underline",
  },

  // ── Aftercare skeleton
  aftercareSkeleton: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#f0efed",
  },
  aftercareSkeletonTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  // ── Pickup sheet
  pickupSheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  pickupSheetTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#1f2937",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  pickupSlotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  pickupSlotRowSelected: {
    backgroundColor: "rgba(94,124,104,0.06)",
    borderRadius: 8,
  },
  pickupSlotText: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#1f2937",
  },
  pickupSlotTextSelected: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
  weekPickerSlotSelected: {
    backgroundColor: "rgba(59,130,246,0.06)",
    borderRadius: 8,
  },
  weekPickerSlotTextSelected: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#3b82f6",
  },

  // ── Week navigation
  weekNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 4,
  },
  weekNavBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  weekLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },

  // ── Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: BottomTabInset + 16,
  },

  // ── Today badge
  todayBadge: {
    backgroundColor: AMBER,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  todayBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#ffffff",
  },

  paidBadge: {
    backgroundColor: "#dcfce7",
  },
  unpaidBadge: {
    backgroundColor: "#f3f4f6",
  },

  // ── Empty state
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
    paddingVertical: 16,
  },

  // ── Student cards (day detail)
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  attendanceAllergyBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  cardAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  cardAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },
  cardName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  cardGrade: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  cardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  cardBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
  },
  // ── Date nav tappable label
  dateNavTappable: {
    textDecorationLine: "underline",
    textDecorationColor: "#9ca3af",
  },

  // ── Calendar picker sheet
  calendarSheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  calendarMonthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  calendarMonthLabel: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDowRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  calendarDowLabel: {
    width: `${100 / 7}%` as unknown as number,
    textAlign: "center",
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#9ca3af",
    paddingBottom: 6,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarCell: {
    width: `${100 / 7}%` as unknown as number,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayNum: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayNumToday: {
    borderWidth: 1.5,
    borderColor: AMBER,
  },
  calendarDayNumSelected: {
    backgroundColor: Brand.sage700,
  },
  calendarDayTxt: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#1f2937",
  },
  calendarDayTxtDisabled: {
    color: "#d1d5db",
  },
  calendarDayTxtToday: {
    fontFamily: FontFamilies.bodySemiBold,
    color: AMBER,
  },
  calendarDayTxtSelected: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#ffffff",
  },

  // ── Week plan view
  planDaySection: {
    marginHorizontal: 16,
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0efed",
  },
  planDaySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  planDayName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  planBlocksRow: {
    flexDirection: "column",
    gap: 8,
  },
  planBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  planBlockSummer: {
    backgroundColor: "#fef0e6",
  },
  planBlockAftercare: {
    backgroundColor: "#eaeeeb",
  },
  planBlockFriday: {
    backgroundColor: "#e8f0ea",
  },
  planBlockTextGroup: {
    flexDirection: "column",
    gap: 2,
  },
  planBlockLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
  },
  planBlockEnrolled: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
  },
  planAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  planAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  planAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  planAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#ffffff",
  },
  planOverflowPill: {
    backgroundColor: "#d1d5db",
  },
  planOverflowText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#374151",
  },

  // ── Student profile sheet
  profileSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  profileSheetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileSheetAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileSheetAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 17,
    color: Brand.sage700,
  },
  profileSheetName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 17,
    color: "#1f2937",
  },
  profileSheetGrade: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  profileSheetTabBar: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  profileSheetTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  profileSheetTabActive: {
    backgroundColor: "rgba(94,124,104,0.1)",
    borderColor: Brand.sage700,
  },
  profileSheetTabText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  profileSheetTabTextActive: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
  profileSectionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
  },
  profileSectionTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  profileInfoRow: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
    gap: 2,
  },
  profileInfoLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  profileInfoValue: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
  },
  profileContactCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  profileContactCardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  profileContactName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  profileContactMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  profileNoteCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  profileNoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileNoteCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  profileNoteCategoryText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
  },
  profileNoteDate: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
    marginLeft: "auto",
  },
  profileNoteText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
    lineHeight: 21,
  },
  profileEmptyCard: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  profileEmptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
  },

  // ── Weeks tab
  weeksRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0efed",
  },
  weeksRowCurrent: {
    borderLeftWidth: 3,
    borderLeftColor: Brand.sage700,
    paddingLeft: 13,
    backgroundColor: "rgba(94,124,104,0.05)",
  },
  weeksRowLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  weeksRowDates: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
  },
  weeksBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  weeksBadgeGreen: {
    backgroundColor: "#d1fae5",
  },
  weeksBadgeGray: {
    backgroundColor: "#f3f4f6",
  },
  weeksBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
  },
  weeksBadgeTextGreen: {
    color: "#065f46",
  },
  weeksBadgeTextGray: {
    color: "#9ca3af",
  },
  weeksDayPill: {
    width: 32,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  weeksDayPillActive: {
    backgroundColor: "#d1fae5",
    borderColor: "#6ee7b7",
  },
  weeksDayPillText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#9ca3af",
  },
  weeksDayPillTextActive: {
    color: "#065f46",
  },

  // ── Checkbox (day detail + aftercare)
  checkboxArea: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  checkboxEmpty: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
  },

  // ── Summer pickup sheet
  summerPickupRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  summerPickupRadioSelected: {
    borderColor: AMBER,
  },
  summerPickupRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AMBER,
  },
  summerPickupConfirmBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    height: 52,
    borderRadius: 12,
    backgroundColor: AMBER,
    alignItems: "center",
    justifyContent: "center",
  },
  summerPickupConfirmText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#ffffff",
  },

  // ── Summer inline pickup badge + button
  summerPickupBadge: {
    backgroundColor: AMBER + "18",
    borderWidth: 1,
    borderColor: AMBER + "40",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  summerPickupBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: AMBER,
  },
  summerRecordPickupBtn: {
    borderWidth: 1.5,
    borderColor: AMBER,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: AMBER + "0D",
  },
  summerRecordPickupBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: AMBER,
  },

  // ── Pickup details (modern redesign)
  pdStudentName: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
    textAlign: "center",
  },
  pdRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  pdRowLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  pdSimpleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  pdDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pdLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
  pdValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },
  pdUserBlock: {
    alignItems: "center" as const,
    gap: 4,
  },
  pdUserName: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#6b7280",
    maxWidth: 60,
    textAlign: "center" as const,
  },
  pdDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  pdAvatar32: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  pdAvatarText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#ffffff",
  },
  pdAvatarImg32: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  pdCloseBtn: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center" as const,
  },
  pdCloseBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#374151",
  },
});
