// Parent Children screen data: students, teachers, selected child + tab, and
// the per-tab hooks. Handlers return { ok, error?, canceled? }; no UI here.
import { useAuth } from "@/contexts/AuthContext";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useStudentAttendance } from "@/features/attendance/useStudentAttendance";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHILD_TABS, STUDENT_SELECT, type ChildTab, type Result, type Student, type TeacherAssignment } from "./types";
import { useChildLearning } from "./useChildLearning";
import { useChildPickup } from "./useChildPickup";
import { useChildProfile } from "./useChildProfile";

export function useChildren() {
  const router = useRouter();
  const { tab: tabParam, studentId: studentIdParam } = useLocalSearchParams<{
    tab?: string;
    studentId?: string;
  }>();
  const { effectiveParentId, isReadOnlyPreview } = useAuth();
  const userId = effectiveParentId;

  const [students, setStudents] = useState<Student[]>([]);
  const [teachersByStudent, setTeachersByStudent] = useState<Record<string, TeacherAssignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<ChildTab>("teacher");
  const [messagingTeacherId, setMessagingTeacherId] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const appliedStudentParam = useRef<string | undefined>(undefined);

  // Deep link: ?tab=teacher|attendance|learning|pickup|profile
  useEffect(() => {
    if (tabParam && CHILD_TABS.some((t) => t.key === tabParam)) setActiveTab(tabParam as ChildTab);
  }, [tabParam]);

  const loadStudents = useCallback(async (): Promise<Result> => {
    if (!effectiveParentId) {
      setLoading(false);
      return { ok: true };
    }
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .schema("admin")
        .from("students")
        .select(STUDENT_SELECT)
        .eq("parent_id", effectiveParentId)
        .eq("is_deleted", false);

      if (studentsError || !studentsData) {
        if (studentsError) notifyError("parent-children-fetch", studentsError);
        if (!hasLoaded.current) setError(studentsError?.message ?? "Failed to load children.");
        return { ok: false, error: studentsError?.message };
      }

      // Teacher assignments for all students
      const studentIds = studentsData.map((s) => s.id);
      const { data: assignmentRows } = await supabase
        .schema("teachers")
        .from("teacher_students")
        .select("id, teacher_id, student_id, program, classroom")
        .in("student_id", studentIds)
        .eq("is_deleted", false);

      // Resolve teacher names from admin.users
      const teacherMap: Record<string, TeacherAssignment[]> = {};
      if (assignmentRows && assignmentRows.length > 0) {
        const teacherIds = [...new Set(assignmentRows.map((r) => r.teacher_id))];
        const { data: teacherUsers } = await supabase
          .schema("admin")
          .from("users")
          .select("id, full_name")
          .in("id", teacherIds);
        const nameById: Record<string, string> = {};
        for (const u of teacherUsers ?? []) nameById[u.id] = u.full_name;
        for (const row of assignmentRows) {
          const assignment: TeacherAssignment = { ...row, teacher_name: nameById[row.teacher_id] ?? null };
          if (!teacherMap[row.student_id]) teacherMap[row.student_id] = [];
          teacherMap[row.student_id].push(assignment);
        }
      }

      const list = studentsData as Student[];
      setStudents(list);
      setTeachersByStudent(teacherMap);
      setError(null);

      // Only jump to a child when a new ?studentId= arrives (not on every focus).
      if (studentIdParam && studentIdParam !== appliedStudentParam.current) {
        const idx = list.findIndex((s) => s.id === studentIdParam);
        if (idx >= 0) setActiveIndex(idx);
        appliedStudentParam.current = studentIdParam;
      } else {
        setActiveIndex((i) => (i < list.length ? i : 0));
      }
      hasLoaded.current = true;
      return { ok: true };
    } catch (e) {
      notifyError("parent-children-fetch", e);
      if (!hasLoaded.current) setError(e instanceof Error ? e.message : "Failed to load children.");
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [effectiveParentId, studentIdParam]);

  const student: Student | null = students[activeIndex] ?? null;

  const updateStudent = useCallback((id: string, fields: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...fields } : s)));
  }, []);

  const attendance = useStudentAttendance(
    activeTab === "attendance" && student ? student.id : null,
    "parent-children-attendance",
  );
  const learning = useChildLearning(student?.id ?? null, userId, student?.child_legal_name ?? "", activeTab === "learning");
  const pickup = useChildPickup(student?.id ?? null, userId);
  const profile = useChildProfile(student, updateStudent);

  const reloadAll = useCallback(async (): Promise<Result> => {
    const r = await loadStudents();
    const tabResult =
      activeTab === "attendance"
        ? await attendance.reload()
        : activeTab === "learning"
          ? await learning.reload()
          : activeTab === "pickup"
            ? await pickup.reload()
            : { ok: true };
    return { ok: r.ok && tabResult.ok };
  }, [loadStudents, activeTab, attendance, learning, pickup]);

  // First focus shows skeletons; later focuses refresh quietly.
  const reloadRef = useRef(reloadAll);
  useEffect(() => {
    reloadRef.current = reloadAll;
  }, [reloadAll]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoaded.current) void loadStudents();
      else void reloadRef.current();
    }, [loadStudents]),
  );

  const retryLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    return loadStudents();
  }, [loadStudents]);

  const selectChild = useCallback((i: number) => setActiveIndex(i), []);
  const selectTab = useCallback((t: ChildTab) => setActiveTab(t), []);

  /** Same RPC + route as before; now reports failure instead of failing silently. */
  const messageTeacher = useCallback(
    async (teacherId: string, teacherName: string | null): Promise<Result> => {
      if (!student || messagingTeacherId) return { ok: false, canceled: true };
      setMessagingTeacherId(teacherId);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { ok: false, error: "Not signed in" };
        const { data: conversationId, error: err } = await supabase.rpc(
          "find_or_create_household_teacher_conversation",
          { p_student_id: student.id, p_teacher_id: teacherId, p_caller_id: user.id },
        );
        if (err) {
          notifyError("parent-children-message-teacher", err);
          return { ok: false, error: err.message };
        }
        if (!conversationId) return { ok: false };
        router.push({
          pathname: "/(tabs)/messages/[id]",
          params: {
            id: conversationId,
            otherUserName: teacherName ? `${teacherName}` : "Group",
            otherUserAvatar: "",
            otherUserId: teacherId,
          },
        });
        return { ok: true };
      } catch (e) {
        notifyError("parent-children-message-teacher", e);
        return { ok: false };
      } finally {
        setMessagingTeacherId(null);
      }
    },
    [student, messagingTeacherId, router],
  );

  const openTeacher = useCallback(
    (t: TeacherAssignment) => {
      router.push({
        pathname: "/(tabs)/teacher/[teacherId]" as never,
        params: {
          teacherId: t.teacher_id,
          teacherName: t.teacher_name ?? "",
          classroom: t.classroom ?? "",
          program: t.program ?? "",
        },
      });
    },
    [router],
  );

  return {
    router,
    userId,
    isReadOnlyPreview,
    students,
    student,
    teachers: student ? (teachersByStudent[student.id] ?? []) : [],
    loading,
    error,
    activeIndex,
    activeTab,
    selectChild,
    selectTab,
    reloadAll,
    retryLoad,
    messagingTeacherId,
    messageTeacher,
    openTeacher,
    attendance,
    learning,
    pickup,
    profile,
  };
}

export type Children = ReturnType<typeof useChildren>;
