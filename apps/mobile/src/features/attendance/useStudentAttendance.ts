// One child's attendance history (all programs) — shared by the Attendance
// screen and the Children → Attendance tab. Data only: no toasts here.
import { notifyError } from "@/lib/discord";
import {
  fetchParentStudentAttendanceRecords,
  filterAttendanceRecords,
  getAttendanceStatus,
  type AttendanceFilter,
  type UnifiedAttendanceRecord,
  type UserMap,
} from "@/lib/parent-student-attendance";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Result = { ok: boolean; error?: string };

export type AttendanceMonth = { key: string; title: string; records: UnifiedAttendanceRecord[] };

function monthTitle(ymd: string): string {
  const [y, m] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function useStudentAttendance(studentId: string | null, logKey = "parent-attendance-records") {
  const [records, setRecords] = useState<UnifiedAttendanceRecord[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [selected, setSelected] = useState<UnifiedAttendanceRecord | null>(null);
  const detailSheetRef = useRef<BottomSheetModal>(null);
  // Guards against a slow response for a previous child landing after a switch.
  const reqId = useRef(0);

  const load = useCallback(
    async (quiet: boolean): Promise<Result> => {
      if (!studentId) {
        setRecords([]);
        setUserMap({});
        setLoading(false);
        return { ok: true };
      }
      const id = ++reqId.current;
      if (!quiet) setLoading(true);
      try {
        const res = await fetchParentStudentAttendanceRecords(studentId);
        if (id !== reqId.current) return { ok: true };
        setRecords(res.records);
        setUserMap(res.userMap);
        setError(false);
        setLoadedId(studentId);
        return { ok: true };
      } catch (e) {
        notifyError(logKey, e);
        if (id !== reqId.current) return { ok: false };
        if (!quiet) {
          setRecords([]);
          setUserMap({});
        }
        setError(true);
        setLoadedId(studentId);
        return { ok: false, error: e instanceof Error ? e.message : undefined };
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [studentId, logKey],
  );

  useEffect(() => {
    setFilter("all");
    void load(false);
  }, [load]);

  const reload = useCallback(() => load(true), [load]);
  const retry = useCallback(() => load(false), [load]);

  const filtered = useMemo(() => filterAttendanceRecords(records, filter), [records, filter]);

  const filterCounts = useMemo(
    () => ({
      all: records.length,
      school_year: filterAttendanceRecords(records, "school_year").length,
      summer: filterAttendanceRecords(records, "summer").length,
      aftercare: filterAttendanceRecords(records, "aftercare").length,
      field_friday: filterAttendanceRecords(records, "field_friday").length,
    }),
    [records],
  );

  const summary = useMemo(() => {
    let attended = 0;
    let pickedUp = 0;
    let absent = 0;
    for (const r of filtered) {
      const s = getAttendanceStatus(r);
      if (s === "absent") absent++;
      else if (s === "picked_up") pickedUp++;
      else attended++;
    }
    return { attended, pickedUp, absent };
  }, [filtered]);

  const months = useMemo<AttendanceMonth[]>(() => {
    const out: AttendanceMonth[] = [];
    for (const r of filtered) {
      const key = r.date.slice(0, 7);
      const last = out[out.length - 1];
      if (last && last.key === key) last.records.push(r);
      else out.push({ key, title: monthTitle(r.date), records: [r] });
    }
    return out;
  }, [filtered]);

  const openRecord = useCallback((r: UnifiedAttendanceRecord) => {
    setSelected(r);
    detailSheetRef.current?.present();
  }, []);

  return {
    studentId,
    records,
    userMap,
    // Also "loading" for the frame between a child switch and the fetch starting.
    loading: studentId ? loading || loadedId !== studentId : false,
    error,
    filter,
    setFilter,
    filtered,
    filterCounts,
    summary,
    months,
    selected,
    setSelected,
    detailSheetRef,
    openRecord,
    reload,
    retry,
  };
}

export type StudentAttendance = ReturnType<typeof useStudentAttendance>;
