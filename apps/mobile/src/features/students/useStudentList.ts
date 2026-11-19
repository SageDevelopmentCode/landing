// Staff Students list data: My Students (the teacher's own assignments) and
// All Students (every teacher's assignments, grouped by teacher). Query logic,
// exclusions, sorting and program filters are carried over from the original
// app/(staff)/students/index.tsx. Differences:
//   • focus reloads quietly (no skeleton flash, scroll position kept)
//   • every query's error is checked and reported as { ok: false }
//   • a client-side name search
import { notifyError } from "@/lib/discord";
import { getTeacherColors, groupStudentsByTeacher } from "@/lib/group-by-teacher";
import { SCHOOL_YEAR_MONTHS } from "@/lib/school-year";
import { getCurrentSchoolYearMonthIndex } from "@/lib/school-year-attendance";
import { getStudentDisplayName } from "@/lib/student-display-name";
import { buildStudentMonthEnrollment } from "@/lib/student-month-enrollment";
import {
  isHomeschoolDropInTeacherAssignment,
  isSchoolYearTeacherAssignment,
} from "@/lib/student-teacher-assignments";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";

export type StudentRow = {
  id: string;
  student_id: string;
  name: string | null;
  grade: string | null;
  program: string;
  classroom: string | null;
  profile_image_url: string | null;
  has_allergies: string | null;
  isHomeschoolDropIn: boolean;
  dropInProgram: string | null;
  applicationProgram: string | null;
  isPaidForMonth: boolean;
  homeschoolDays: string[];
  teacherName: string | null;
};

export type StudentProgram = "school_year_26_27" | "homeschool_drop_in";
export type StudentView = "my" | "all";
export type LoadResult = { ok: boolean };

export const STUDENT_PROGRAMS: { key: StudentProgram; label: string; icon: "school-outline" | "walk-outline" }[] = [
  { key: "school_year_26_27", label: "School Year", icon: "school-outline" },
  { key: "homeschool_drop_in", label: "Drop-In", icon: "walk-outline" },
];

export const DAY_KEYS = ["mon", "tue", "wed", "thu"] as const;
export const DAY_LABELS: Record<string, string> = { mon: "M", tue: "T", wed: "W", thu: "Th" };

const DONT_INCLUDE_TAG = "Don't Include";
const HIDDEN_ALL_STUDENTS_TEACHERS = new Set(["Paige Wood"]);

type Assignment = {
  id: string;
  student_id: string;
  program: string;
  classroom: string | null;
  teacher_name?: string | null;
};

export function isStudentEnrolledForMonth(item: StudentRow): boolean {
  if (item.isHomeschoolDropIn) return item.homeschoolDays.length > 0 || item.isPaidForMonth;
  return item.isPaidForMonth;
}

export function needsAttention(item: StudentRow): boolean {
  return !item.isPaidForMonth || !isStudentEnrolledForMonth(item);
}

export function formatStudentMeta(grade: string | null, classroom: string | null): string | null {
  const parts: string[] = [];
  if (grade) parts.push(grade);
  if (classroom) parts.push(classroom.includes("_") ? classroom.split("_").join(" - ") : classroom);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function filterByProgram(rows: StudentRow[], program: StudentProgram): StudentRow[] {
  if (program === "homeschool_drop_in") {
    return rows.filter((s) => isHomeschoolDropInTeacherAssignment(s.program, s.dropInProgram));
  }
  return rows.filter((s) => isSchoolYearTeacherAssignment(s.program, s.dropInProgram));
}

function matchesSearch(row: StudentRow, q: string) {
  return !q || (row.name ?? "").toLowerCase().includes(q);
}

/** Profiles + applications + billing for a set of assignments → rows. */
async function buildRows(assignments: Assignment[], errorKey: string): Promise<StudentRow[] | null> {
  const studentIds = [...new Set(assignments.map((a) => a.student_id))];
  if (studentIds.length === 0) return [];

  const monthIndex = getCurrentSchoolYearMonthIndex();
  const [profilesRes, appsRes, txnRes] = await Promise.all([
    supabase
      .schema("admin")
      .from("students")
      .select("id, child_legal_name, child_grade, profile_image_url")
      .in("id", studentIds)
      .eq("is_deleted", false),
    supabase
      .schema("parent_app")
      .from("applications")
      .select("student_id, has_allergies, program, drop_in_program, preferred_name, child_legal_name, admin_tags")
      .in("student_id", studentIds),
    supabase
      .schema("billing")
      .from("stripe_transactions")
      .select("student_id, payment_type, metadata")
      .in("student_id", studentIds)
      .in("payment_type", ["school_year_tuition", "homeschool_dropin", "homeschool", "supply_fee"])
      .eq("status", "completed")
      .eq("is_deleted", false),
  ]);
  const err = profilesRes.error ?? appsRes.error ?? txnRes.error;
  if (err) {
    notifyError(errorKey, err);
    return null;
  }

  const applications = appsRes.data ?? [];
  const enrollmentMap = buildStudentMonthEnrollment(txnRes.data ?? [], monthIndex);
  const excluded = new Set(
    applications.filter((a) => (a.admin_tags ?? []).includes(DONT_INCLUDE_TAG)).map((a) => a.student_id),
  );
  const appById = new Map(applications.map((a) => [a.student_id, a]));
  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

  return assignments
    .filter((a) => !excluded.has(a.student_id))
    .map((a) => {
      const app = appById.get(a.student_id);
      const profile = profileById.get(a.student_id);
      const enrollment = enrollmentMap.get(a.student_id);
      return {
        id: a.id,
        student_id: a.student_id,
        name: (app ? getStudentDisplayName(app.preferred_name, app.child_legal_name) : null) ?? profile?.child_legal_name ?? null,
        grade: profile?.child_grade ?? null,
        program: a.program,
        classroom: a.classroom,
        profile_image_url: profile?.profile_image_url ?? null,
        has_allergies: app?.has_allergies ?? null,
        isHomeschoolDropIn: app?.program === "homeschool_drop_in",
        dropInProgram: app?.drop_in_program ?? null,
        applicationProgram: app?.program ?? null,
        isPaidForMonth: enrollment?.isPaidForMonth ?? false,
        homeschoolDays: enrollment?.homeschoolDays ?? [],
        teacherName: a.teacher_name ?? null,
      };
    });
}

export function useStudentList() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);
  const [allLoading, setAllLoading] = useState(true);
  const [allError, setAllError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<StudentView>("my");
  const [activeProgram, setActiveProgram] = useState<StudentProgram>("school_year_26_27");
  const [activeAllProgram, setActiveAllProgram] = useState<StudentProgram>("school_year_26_27");
  const [search, setSearch] = useState("");

  const monthIndex = getCurrentSchoolYearMonthIndex();
  const monthShort = SCHOOL_YEAR_MONTHS.find((m) => m.index === monthIndex)?.short ?? "Month";

  const loadedOnce = useRef({ my: false, all: false });
  const reqId = useRef(0);

  const loadMine = useCallback(async (quiet: boolean, id: number): Promise<LoadResult> => {
    if (!quiet) setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (id === reqId.current) setError("Not authenticated.");
        return { ok: false };
      }
      const { data: assignments, error: assignErr } = await supabase
        .schema("teachers")
        .from("teacher_students")
        .select("id, student_id, program, classroom")
        .eq("teacher_id", user.id)
        .eq("is_deleted", false);
      if (assignErr || !assignments) {
        if (assignErr) notifyError("staff-students-fetch", assignErr);
        if (id === reqId.current && !(quiet && loadedOnce.current.my)) {
          setError(assignErr?.message ?? "Failed to load students.");
        }
        return { ok: false };
      }
      const rows = await buildRows(assignments, "staff-students-fetch");
      if (id !== reqId.current) return { ok: true };
      if (!rows) {
        if (!(quiet && loadedOnce.current.my)) setError("Failed to load students.");
        return { ok: false };
      }
      setStudents(rows);
      setError(null);
      loadedOnce.current.my = true;
      return { ok: true };
    } catch (e) {
      notifyError("staff-students-fetch", e);
      if (id === reqId.current && !(quiet && loadedOnce.current.my)) setError("Failed to load students.");
      return { ok: false };
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  const loadAll = useCallback(async (quiet: boolean, id: number): Promise<LoadResult> => {
    if (!quiet) setAllLoading(true);
    try {
      const { data, error: rpcErr } = await supabase.rpc("get_all_teacher_assignments");
      if (rpcErr || !data) {
        if (rpcErr) notifyError("staff-students-fetch-all", rpcErr);
        if (id === reqId.current && !(quiet && loadedOnce.current.all)) {
          setAllError(rpcErr?.message ?? "Failed to load all students.");
        }
        return { ok: false };
      }
      const assignments: Assignment[] = (
        data as {
          assignment_id: string;
          student_id: string;
          program: string;
          classroom: string | null;
          teacher_name: string | null;
        }[]
      ).map((a) => ({
        id: a.assignment_id,
        student_id: a.student_id,
        program: a.program,
        classroom: a.classroom,
        teacher_name: a.teacher_name,
      }));
      const rows = await buildRows(assignments, "staff-students-fetch-all");
      if (id !== reqId.current) return { ok: true };
      if (!rows) {
        if (!(quiet && loadedOnce.current.all)) setAllError("Failed to load all students.");
        return { ok: false };
      }
      setAllStudents(rows);
      setAllError(null);
      loadedOnce.current.all = true;
      return { ok: true };
    } catch (e) {
      notifyError("staff-students-fetch-all", e);
      if (id === reqId.current && !(quiet && loadedOnce.current.all)) setAllError("Failed to load all students.");
      return { ok: false };
    } finally {
      if (id === reqId.current) setAllLoading(false);
    }
  }, []);

  const load = useCallback(
    async (quiet: boolean): Promise<LoadResult> => {
      const id = ++reqId.current;
      const [a, b] = await Promise.all([loadMine(quiet, id), loadAll(quiet, id)]);
      return { ok: a.ok && b.ok };
    },
    [loadAll, loadMine],
  );

  // Every focus: the first time shows skeletons, later ones refresh quietly.
  useFocusEffect(
    useCallback(() => {
      void load(loadedOnce.current.my || loadedOnce.current.all);
    }, [load]),
  );

  const reload = useCallback(() => load(true), [load]);
  const retry = useCallback(() => load(false), [load]);

  const q = search.trim().toLowerCase();

  const myStudents = useMemo(
    () =>
      filterByProgram(students, activeProgram)
        .sort((a, b) => {
          const da = needsAttention(a);
          const db = needsAttention(b);
          if (da !== db) return da ? 1 : -1;
          return (a.name ?? "").localeCompare(b.name ?? "");
        }),
    [students, activeProgram],
  );
  const myVisible = useMemo(() => myStudents.filter((s) => matchesSearch(s, q)), [myStudents, q]);

  const allInProgram = useMemo(
    () =>
      filterByProgram(allStudents, activeAllProgram).filter(
        (s) => !HIDDEN_ALL_STUDENTS_TEACHERS.has(s.teacherName ?? ""),
      ),
    [allStudents, activeAllProgram],
  );
  const teacherSections = useMemo(
    () =>
      groupStudentsByTeacher(
        allInProgram.filter((s) => matchesSearch(s, q)),
        (s) => (needsAttention(s) ? 1 : 0),
      ).map((sec) => ({ ...sec, colors: getTeacherColors(sec.teacherName) })),
    [allInProgram, q],
  );

  const isMy = activeView === "my";
  const program = isMy ? activeProgram : activeAllProgram;
  const setProgram = isMy ? setActiveProgram : setActiveAllProgram;
  const count = isMy ? myStudents.length : allInProgram.length;
  const visibleCount = isMy ? myVisible.length : teacherSections.reduce((n, s) => n + s.students.length, 0);

  const openStudent = useCallback(
    (row: StudentRow, fromAll: boolean) => {
      router.push({
        pathname: "/(staff)/students/[studentId]",
        params: {
          studentId: row.student_id,
          studentName: row.name ?? "",
          program: row.program,
          classroom: row.classroom ?? "",
          ...(fromAll ? { allStudentsView: "1" } : {}),
        },
      } as any);
    },
    [router],
  );

  return {
    monthShort,
    activeView,
    setActiveView,
    program,
    setProgram,
    search,
    setSearch,
    isSearching: q.length > 0,
    count,
    visibleCount,
    // My Students
    loading,
    error,
    myStudents: myVisible,
    // All Students
    allLoading,
    allError,
    teacherSections,
    reload,
    retry,
    openStudent,
  };
}

export type StudentList = ReturnType<typeof useStudentList>;
