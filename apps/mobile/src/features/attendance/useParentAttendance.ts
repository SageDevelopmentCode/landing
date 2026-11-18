// Data for the parent Attendance screen: the family's children + the selected
// child's history. Uses effectiveParentId so admin "view as parent" shows the
// previewed family (the old screen used the signed-in user's id).
import { useAuth } from "@/contexts/AuthContext";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useStudentAttendance, type Result } from "./useStudentAttendance";

export type AttendanceStudent = {
  id: string;
  child_legal_name: string;
  profile_image_url: string | null;
};

export function useParentAttendance() {
  const router = useRouter();
  const { effectiveParentId } = useAuth();
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStudents = useCallback(async (): Promise<Result> => {
    if (!effectiveParentId) {
      setLoading(false);
      return { ok: true };
    }
    try {
      const { data, error: err } = await supabase
        .schema("admin")
        .from("students")
        .select("id, child_legal_name, profile_image_url")
        .eq("parent_id", effectiveParentId)
        .eq("is_deleted", false);
      if (err) throw err;
      const list = (data ?? []) as AttendanceStudent[];
      setStudents(list);
      setSelectedId((prev) => (prev && list.some((s) => s.id === prev) ? prev : (list[0]?.id ?? null)));
      setError(false);
      return { ok: true };
    } catch (e) {
      notifyError("parent-attendance-load", e);
      setError(true);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [effectiveParentId]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const att = useStudentAttendance(selectedId, "parent-attendance-records");

  const reload = useCallback(async (): Promise<Result> => {
    const [a, b] = await Promise.all([loadStudents(), att.reload()]);
    return { ok: a.ok && b.ok };
  }, [loadStudents, att]);

  const retryLoad = useCallback(async () => {
    setLoading(true);
    return loadStudents();
  }, [loadStudents]);

  const selected = students.find((s) => s.id === selectedId) ?? null;

  return {
    router,
    students,
    selected,
    selectedId,
    setSelectedId,
    loading,
    error,
    att,
    reload,
    retryLoad,
  };
}

export type ParentAttendance = ReturnType<typeof useParentAttendance>;
