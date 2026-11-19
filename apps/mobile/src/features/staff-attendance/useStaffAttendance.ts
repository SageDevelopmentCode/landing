// Staff Attendance data + writes. Loaders (attendanceData.ts) keep the original
// roster rules, sorting and Month Plan counts. Differences (approved fixes):
//   • School Year / Friday rows use the same Unmarked / Present / Absent /
//     Picked Up status as staff Home, and check-ins go through the shared
//     attendanceWrites (Friday check-ins now write checked_in)
//   • pickup no longer overwrites who checked the child in
//   • per-row lock (two quick taps on different rows both save; double taps
//     on one row are ignored)
//   • late responses never patch another day's list
//   • every load / write returns { ok } so the UI can give feedback
//   • the active tab refreshes quietly on focus and on pull-to-refresh
import {
  deleteAttendanceRecord,
  fetchPickupPersons,
  writePickup,
  writeSchoolYearPresent,
  type AttendanceTable,
} from "@/features/staff-home/attendanceWrites";
import type { PickupPerson, StudentDayStatus } from "@/features/staff-home/staffHomeUtils";
import { notifyDiscord, notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AFTERCARE_RECORD_SELECT,
  ALL_SY_FRIDAY_DATES,
  ALL_SY_WEEKDAY_DATES,
  FF_RECORD_SELECT,
  SY_RECORD_SELECT,
  fetchAftercareData,
  fetchFieldFridayData,
  fetchMonthHeadcounts,
  fetchSchoolYearDayData,
  fetchStaffUsers,
  fetchStudentProfile,
  getCurrentSchoolYearMonthIndex,
  getInitialAftercareDate,
  getInitialFriday,
  getInitialSchoolYearDate,
  shiftFriday,
  shiftInDateList,
  toYMD,
  type AftercareStudentRow,
  type CalendarTarget,
  type DayHeadcount,
  type FieldFridayStudentRow,
  type ProgramKey,
  type SchoolYearStudentRow,
  type StaffUser,
  type StudentProfileData,
} from "./attendanceData";

export type RosterProgram = Exclude<ProgramKey, "month_plan">;
export type RosterRow = SchoolYearStudentRow | AftercareStudentRow | FieldFridayStudentRow;
export type WriteResult = { ok: boolean; skipped?: boolean };
export type LoadResult = { ok: boolean };

type AnyRecord = NonNullable<RosterRow["record"]> & {
  marked_absent?: boolean;
  checked_in?: boolean;
  excluded_from_roster?: boolean;
};

const OK: WriteResult = { ok: true };
const SKIP: WriteResult = { ok: false, skipped: true };
const FAIL: WriteResult = { ok: false };

const TABLE: Record<RosterProgram, AttendanceTable> = {
  school_year: "school_year_records",
  aftercare: "aftercare_records",
  field_friday: "school_year_field_friday_records",
};
const SELECT: Record<RosterProgram, string> = {
  school_year: SY_RECORD_SELECT,
  aftercare: AFTERCARE_RECORD_SELECT,
  field_friday: FF_RECORD_SELECT,
};

/** Same status rules as staff Home. Aftercare has no absent / check-in flag. */
export function rowStatus(program: RosterProgram, row: RosterRow): StudentDayStatus {
  const r = row.record as AnyRecord | null;
  if (!r) return "unmarked";
  if (program === "aftercare") return r.picked_up_by_name ? "picked_up" : "present";
  if (r.marked_absent) return "absent";
  if (!r.checked_in) return "unmarked";
  if (r.picked_up_by_name) return "picked_up";
  return "present";
}

export function isCheckedIn(program: RosterProgram, row: RosterRow) {
  const s = rowStatus(program, row);
  return s === "present" || s === "picked_up";
}

export function useStaffAttendance() {
  const today = toYMD(new Date());

  // ── Program + dates ─────────────────────────────────────────────────────────
  const [activeProgram, setActiveProgram] = useState<ProgramKey>("month_plan");
  const [dates, setDates] = useState<Record<RosterProgram, string>>(() => ({
    school_year: getInitialSchoolYearDate(),
    aftercare: getInitialAftercareDate(),
    field_friday: getInitialFriday(),
  }));
  const datesRef = useRef(dates);
  useEffect(() => {
    datesRef.current = dates;
  }, [dates]);
  const [planMonthIndex, setPlanMonthIndex] = useState(() => getCurrentSchoolYearMonthIndex());

  // ── Rosters ─────────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<Record<RosterProgram, RosterRow[]>>({
    school_year: [],
    aftercare: [],
    field_friday: [],
  });
  const [loading, setLoading] = useState<Record<RosterProgram, boolean>>({
    school_year: true,
    aftercare: true,
    field_friday: true,
  });
  const [errors, setErrors] = useState<Record<RosterProgram, boolean>>({
    school_year: false,
    aftercare: false,
    field_friday: false,
  });
  // Which date each roster currently holds (writes only patch a matching list).
  const loadedDate = useRef<Record<RosterProgram, string | null>>({
    school_year: null,
    aftercare: null,
    field_friday: null,
  });
  const reqIds = useRef<Record<string, number>>({});

  const [search, setSearchState] = useState<Record<RosterProgram, string>>({
    school_year: "",
    aftercare: "",
    field_friday: "",
  });

  // ── Month plan ─────────────────────────────────────────────────────────────
  const [headcounts, setHeadcounts] = useState<DayHeadcount[]>([]);
  const [headcountsLoading, setHeadcountsLoading] = useState(true);
  const [headcountsError, setHeadcountsError] = useState(false);

  // ── Per-row lock ───────────────────────────────────────────────────────────
  const [pending, setPending] = useState<Record<string, true>>({});
  const pendingRef = useRef<Record<string, true>>({});
  const setPendingKey = useCallback((key: string, on: boolean) => {
    const next = { ...pendingRef.current };
    if (on) next[key] = true;
    else delete next[key];
    pendingRef.current = next;
    setPending(next);
  }, []);
  const lockKey = (program: RosterProgram, studentId: string) => `${program}:${studentId}`;

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadRoster = useCallback(async (program: RosterProgram, quiet: boolean): Promise<LoadResult> => {
    const date = datesRef.current[program];
    const id = (reqIds.current[program] = (reqIds.current[program] ?? 0) + 1);
    if (!quiet || loadedDate.current[program] !== date) {
      setLoading((l) => ({ ...l, [program]: true }));
    }
    try {
      const fetcher =
        program === "school_year"
          ? fetchSchoolYearDayData
          : program === "aftercare"
            ? fetchAftercareData
            : fetchFieldFridayData;
      const data = (await fetcher(date)) as RosterRow[];
      if (id !== reqIds.current[program]) return { ok: true };
      setRows((r) => ({ ...r, [program]: data }));
      loadedDate.current[program] = date;
      setErrors((e) => ({ ...e, [program]: false }));
      return { ok: true };
    } catch (err) {
      notifyError(
        program === "school_year"
          ? "staff-attendance-day-fetch"
          : program === "aftercare"
            ? "staff-attendance-aftercare-fetch"
            : "staff-attendance-field-friday-fetch",
        err,
      );
      if (id !== reqIds.current[program]) return { ok: false };
      // A quiet refresh of the same day keeps what's on screen.
      if (!quiet || loadedDate.current[program] !== date) {
        setRows((r) => ({ ...r, [program]: [] }));
        loadedDate.current[program] = date;
        setErrors((e) => ({ ...e, [program]: true }));
      }
      return { ok: false };
    } finally {
      if (id === reqIds.current[program]) setLoading((l) => ({ ...l, [program]: false }));
    }
  }, []);

  const planMonthRef = useRef(planMonthIndex);
  useEffect(() => {
    planMonthRef.current = planMonthIndex;
  }, [planMonthIndex]);
  const headcountMonth = useRef<number | null>(null);
  const loadHeadcounts = useCallback(async (quiet: boolean): Promise<LoadResult> => {
    const month = planMonthRef.current;
    const id = (reqIds.current.month_plan = (reqIds.current.month_plan ?? 0) + 1);
    if (!quiet || headcountMonth.current !== month) setHeadcountsLoading(true);
    try {
      const data = await fetchMonthHeadcounts(month);
      if (id !== reqIds.current.month_plan) return { ok: true };
      setHeadcounts(data);
      headcountMonth.current = month;
      setHeadcountsError(false);
      return { ok: true };
    } catch (err) {
      notifyError("staff-attendance-headcounts", err);
      if (id !== reqIds.current.month_plan) return { ok: false };
      if (!quiet || headcountMonth.current !== month) {
        setHeadcounts([]);
        headcountMonth.current = month;
        setHeadcountsError(true);
      }
      return { ok: false };
    } finally {
      if (id === reqIds.current.month_plan) setHeadcountsLoading(false);
    }
  }, []);

  const loadActive = useCallback(
    (quiet: boolean): Promise<LoadResult> =>
      activeProgram === "month_plan" ? loadHeadcounts(quiet) : loadRoster(activeProgram, quiet),
    [activeProgram, loadHeadcounts, loadRoster],
  );

  // Tab / date / month change → load that view (skeleton when the day changes).
  const activeDate = activeProgram === "month_plan" ? null : dates[activeProgram];
  useEffect(() => {
    void loadActive(true);
  }, [loadActive, activeDate, planMonthIndex]);

  // Returning to the tab (e.g. after recording attendance on Home) → quiet refresh.
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      void loadActive(true);
    }, [loadActive]),
  );

  const reload = useCallback(() => loadActive(true), [loadActive]);
  const retry = useCallback(() => loadActive(false), [loadActive]);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const setDate = useCallback((program: RosterProgram, date: string) => {
    setDates((d) => (d[program] === date ? d : { ...d, [program]: date }));
  }, []);
  const shiftDate = useCallback((program: RosterProgram, delta: 1 | -1) => {
    setDates((d) => ({
      ...d,
      [program]:
        program === "field_friday"
          ? shiftFriday(d[program], delta)
          : shiftInDateList(ALL_SY_WEEKDAY_DATES, d[program], delta),
    }));
  }, []);
  const goToToday = useCallback((program: RosterProgram) => {
    setDate(
      program,
      program === "field_friday"
        ? getInitialFriday()
        : program === "aftercare"
          ? getInitialAftercareDate()
          : getInitialSchoolYearDate(),
    );
  }, [setDate]);
  const homeDate = (program: RosterProgram) =>
    program === "field_friday" ? getInitialFriday() : getInitialSchoolYearDate();
  const canShift = (program: RosterProgram, delta: 1 | -1) => {
    const list = program === "field_friday" ? ALL_SY_FRIDAY_DATES : ALL_SY_WEEKDAY_DATES;
    const idx = list.indexOf(dates[program]);
    return delta < 0 ? idx !== 0 : idx !== list.length - 1;
  };

  /** Month Plan block → jump to that program on that day. */
  const openDay = useCallback((program: RosterProgram, date: string) => {
    setDate(program, date);
    setActiveProgram(program);
  }, [setDate]);

  const setSearch = useCallback((program: RosterProgram, q: string) => {
    setSearchState((s) => ({ ...s, [program]: q }));
  }, []);

  // ── Derived per program ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const out = {} as Record<RosterProgram, { total: number; checkedIn: number; unmarked: number; absent: number }>;
    (Object.keys(rows) as RosterProgram[]).forEach((p) => {
      let checkedIn = 0;
      let unmarked = 0;
      let absent = 0;
      for (const r of rows[p]) {
        const s = rowStatus(p, r);
        if (s === "present" || s === "picked_up") checkedIn++;
        else if (s === "absent") absent++;
        else unmarked++;
      }
      out[p] = { total: rows[p].length, checkedIn, unmarked, absent };
    });
    return out;
  }, [rows]);

  const filtered = useMemo(() => {
    const out = {} as Record<RosterProgram, RosterRow[]>;
    (Object.keys(rows) as RosterProgram[]).forEach((p) => {
      const q = search[p].trim().toLowerCase();
      out[p] = q ? rows[p].filter((r) => (r.name ?? "").toLowerCase().includes(q)) : rows[p];
    });
    return out;
  }, [rows, search]);

  const findRow = useCallback(
    (program: RosterProgram, studentId: string) => rows[program].find((r) => r.student_id === studentId) ?? null,
    [rows],
  );

  // Patch a row only if the list still shows the date the write was for.
  const patchRow = useCallback(
    (program: RosterProgram, date: string, studentId: string, record: RosterRow["record"]) => {
      if (loadedDate.current[program] !== date) return;
      setRows((all) => ({
        ...all,
        [program]: all[program].map((r) => (r.student_id === studentId ? ({ ...r, record } as RosterRow) : r)),
      }));
    },
    [],
  );

  // ── Writes ───────────────────────────────────────────────────────────────────
  async function getUserId(): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  }

  /**
   * School Year / Friday: checked in → remove the record; absent or unmarked →
   * mark present (staff Home semantics). Aftercare: record → remove, else add.
   */
  async function togglePresent(program: RosterProgram, row: RosterRow): Promise<WriteResult> {
    const key = lockKey(program, row.student_id);
    if (pendingRef.current[key]) return SKIP;
    const date = datesRef.current[program];
    if (loadedDate.current[program] !== date) return SKIP;
    setPendingKey(key, true);
    const existing = row.record as AnyRecord | null;
    const table = TABLE[program];
    const checkedIn = isCheckedIn(program, row);
    const ctx =
      program === "school_year"
        ? "staff-attendance-toggle"
        : program === "aftercare"
          ? "staff-attendance-aftercare-toggle"
          : "staff-attendance-field-friday-toggle";
    const types =
      program === "school_year"
        ? { on: "school_year_attendance_marked", off: "school_year_attendance_removed" }
        : program === "aftercare"
          ? { on: "aftercare_checked_in", off: "aftercare_checked_out" }
          : { on: "school_year_field_friday_checked_in", off: "school_year_field_friday_checked_out" };

    try {
      const uid = await getUserId();
      if (!uid) return FAIL;

      if (existing && checkedIn) {
        patchRow(program, date, row.student_id, null);
        const { error } = await deleteAttendanceRecord(table, existing.id);
        if (error) {
          notifyError(ctx, error);
          patchRow(program, date, row.student_id, existing as RosterRow["record"]);
          return FAIL;
        }
        notifyDiscord({ type: types.off, data: { studentName: row.name, date } });
        return OK;
      }

      const { data, error } =
        program === "aftercare"
          ? await supabase
              .schema("attendance")
              .from("aftercare_records")
              .upsert(
                { student_id: row.student_id, date, recorded_by: uid, paid_for_day: row.hasEnrollment },
                { onConflict: "student_id,date" },
              )
              .select(SELECT.aftercare)
              .single()
          : await writeSchoolYearPresent(table as "school_year_records", {
              studentId: row.student_id,
              date,
              userId: uid,
              paidForDay: row.hasEnrollment,
              existing,
              select: SELECT[program],
            });
      if (error || !data) {
        notifyError(ctx, error);
        return FAIL;
      }
      patchRow(program, date, row.student_id, data as RosterRow["record"]);
      notifyDiscord({ type: types.on, data: { studentName: row.name, date } });
      return OK;
    } catch (e) {
      notifyError(ctx, e);
      return FAIL;
    } finally {
      setPendingKey(key, false);
    }
  }

  // ── Pickup sheet ──────────────────────────────────────────────────────────────
  const pickupSheetRef = useRef<BottomSheetModal>(null);
  const [pickup, setPickup] = useState<{
    program: RosterProgram;
    studentId: string;
    date: string;
  } | null>(null);
  const [pickupPersons, setPickupPersons] = useState<PickupPerson[]>([]);
  const [pickupPersonsLoading, setPickupPersonsLoading] = useState(false);
  const [selectedPickupPerson, setSelectedPickupPerson] = useState<PickupPerson | null>(null);
  const [pickupSaving, setPickupSaving] = useState(false);
  const pickupReq = useRef(0);

  async function openPickup(program: RosterProgram, row: RosterRow): Promise<LoadResult> {
    if (!isCheckedIn(program, row) || row.record?.picked_up_by_name) return { ok: true };
    const id = ++pickupReq.current;
    setPickup({ program, studentId: row.student_id, date: datesRef.current[program] });
    setPickupPersons([]);
    setSelectedPickupPerson(null);
    setPickupPersonsLoading(true);
    pickupSheetRef.current?.present();
    const res = await fetchPickupPersons(row.student_id);
    if (id !== pickupReq.current) return { ok: true };
    setPickupPersons(res.persons);
    if (res.persons.length === 1) setSelectedPickupPerson(res.persons[0]);
    setPickupPersonsLoading(false);
    if (!res.ok) notifyError("staff-attendance-pickup-persons", res.error);
    return { ok: res.ok };
  }

  const pickupRow = pickup ? findRow(pickup.program, pickup.studentId) : null;

  async function confirmPickup(): Promise<WriteResult> {
    const p = pickup;
    const person = selectedPickupPerson;
    if (!p || !person || pickupSaving) return SKIP;
    const row = findRow(p.program, p.studentId);
    if (!row?.record || loadedDate.current[p.program] !== p.date) return FAIL;
    setPickupSaving(true);
    try {
      const uid = await getUserId();
      if (!uid) return FAIL;
      const { data, error } = await writePickup(TABLE[p.program], {
        studentId: row.student_id,
        date: p.date,
        userId: uid,
        paidForDay: row.hasEnrollment,
        existing: row.record,
        person,
        select: SELECT[p.program],
      });
      if (error || !data) {
        notifyError("staff-attendance-pickup", error);
        return FAIL;
      }
      patchRow(p.program, p.date, row.student_id, data as RosterRow["record"]);
      const type =
        p.program === "school_year"
          ? "school_year_pickup_recorded"
          : p.program === "aftercare"
            ? "aftercare_pickup_recorded"
            : "school_year_field_friday_pickup_recorded";
      notifyDiscord({
        type,
        data:
          p.program === "school_year"
            ? { studentName: row.name, date: p.date, pickedUpBy: person.name }
            : { studentName: row.name, date: p.date, pickedUpBy: person.name, relationship: person.relationship },
      });
      pickupSheetRef.current?.dismiss();
      return OK;
    } catch (e) {
      notifyError("staff-attendance-pickup", e);
      return FAIL;
    } finally {
      setPickupSaving(false);
    }
  }

  function resetPickup() {
    pickupReq.current++;
    setPickup(null);
    setPickupPersons([]);
    setSelectedPickupPerson(null);
    setPickupPersonsLoading(false);
    setPickupSaving(false);
  }

  // ── Pickup details sheet ───────────────────────────────────────────────────────
  const detailsSheetRef = useRef<BottomSheetModal>(null);
  const [details, setDetails] = useState<{ program: RosterProgram; row: RosterRow } | null>(null);
  const [detailsStaff, setDetailsStaff] = useState<{ checkedInBy: StaffUser | null; pickedUpBy: StaffUser | null }>({
    checkedInBy: null,
    pickedUpBy: null,
  });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const detailsReq = useRef(0);

  async function openPickupDetails(program: RosterProgram, row: RosterRow): Promise<LoadResult> {
    const rec = row.record;
    if (!rec?.picked_up_by_name) return { ok: true };
    const id = ++detailsReq.current;
    setDetails({ program, row });
    setDetailsStaff({ checkedInBy: null, pickedUpBy: null });
    setDetailsLoading(true);
    detailsSheetRef.current?.present();
    try {
      const users = await fetchStaffUsers([rec.recorded_by, rec.pickup_recorded_by]);
      if (id !== detailsReq.current) return { ok: true };
      setDetailsStaff({
        checkedInBy: users.find((u) => u.id === rec.recorded_by) ?? null,
        pickedUpBy: users.find((u) => u.id === rec.pickup_recorded_by) ?? null,
      });
      return { ok: true };
    } catch (e) {
      notifyError("staff-attendance-pickup-details", e);
      return { ok: false };
    } finally {
      if (id === detailsReq.current) setDetailsLoading(false);
    }
  }

  function resetDetails() {
    detailsReq.current++;
    setDetails(null);
    setDetailsStaff({ checkedInBy: null, pickedUpBy: null });
    setDetailsLoading(false);
  }

  // ── Student action sheet ────────────────────────────────────────────────────────
  const actionSheetRef = useRef<BottomSheetModal>(null);
  const [action, setAction] = useState<{ program: RosterProgram; studentId: string } | null>(null);
  const actionRow = action ? findRow(action.program, action.studentId) : null;
  function openActions(program: RosterProgram, row: RosterRow) {
    setAction({ program, studentId: row.student_id });
    actionSheetRef.current?.present();
  }

  // ── Student profile sheet ───────────────────────────────────────────────────────
  const profileSheetRef = useRef<BottomSheetModal>(null);
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [profileFallback, setProfileFallback] = useState<{ name: string | null; photo: string | null; grade: string | null } | null>(null);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const profileReq = useRef(0);

  const loadProfile = useCallback(async (studentId: string): Promise<LoadResult> => {
    const id = ++profileReq.current;
    setProfileLoading(true);
    setProfileError(false);
    try {
      const data = await fetchStudentProfile(studentId);
      if (id !== profileReq.current) return { ok: true };
      setProfile(data);
      return { ok: true };
    } catch (e) {
      notifyError("staff-attendance-profile", e);
      if (id === profileReq.current) setProfileError(true);
      return { ok: false };
    } finally {
      if (id === profileReq.current) setProfileLoading(false);
    }
  }, []);

  function openProfile(row: RosterRow) {
    actionSheetRef.current?.dismiss();
    setProfile(null);
    setProfileStudentId(row.student_id);
    setProfileFallback({ name: row.name, photo: row.profile_image_url, grade: row.grade });
    profileSheetRef.current?.present();
    return loadProfile(row.student_id);
  }

  function resetProfile() {
    profileReq.current++;
    setProfile(null);
    setProfileStudentId(null);
    setProfileFallback(null);
    setProfileLoading(false);
    setProfileError(false);
  }

  // ── Calendar + month picker ─────────────────────────────────────────────────────
  const calendarSheetRef = useRef<BottomSheetModal>(null);
  const monthSheetRef = useRef<BottomSheetModal>(null);
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  function openCalendar(program: RosterProgram) {
    const [y, m] = dates[program].split("-").map(Number);
    setCalendarMonth(new Date(y, m - 1, 1));
    setCalendarTarget(program);
    calendarSheetRef.current?.present();
  }
  function pickCalendarDate(ymd: string) {
    if (calendarTarget) setDate(calendarTarget, ymd);
    calendarSheetRef.current?.dismiss();
  }

  return {
    today,
    activeProgram,
    setActiveProgram,
    dates,
    shiftDate,
    canShift,
    goToToday,
    homeDate,
    openDay,
    planMonthIndex,
    setPlanMonthIndex,
    // Rosters
    rows,
    filtered,
    loading,
    errors,
    stats,
    search,
    setSearch,
    pending,
    lockKey,
    findRow,
    // Month plan
    headcounts,
    headcountsLoading,
    headcountsError,
    // Loading
    reload,
    retry,
    // Writes
    togglePresent,
    // Pickup
    pickupSheetRef,
    pickup,
    pickupRow,
    pickupPersons,
    pickupPersonsLoading,
    selectedPickupPerson,
    setSelectedPickupPerson,
    pickupSaving,
    openPickup,
    confirmPickup,
    resetPickup,
    // Pickup details
    detailsSheetRef,
    details,
    detailsStaff,
    detailsLoading,
    openPickupDetails,
    resetDetails,
    // Actions
    actionSheetRef,
    action,
    actionRow,
    openActions,
    setAction,
    // Profile
    profileSheetRef,
    profile,
    profileFallback,
    profileStudentId,
    profileLoading,
    profileError,
    loadProfile,
    openProfile,
    resetProfile,
    // Calendar
    calendarSheetRef,
    monthSheetRef,
    calendarTarget,
    setCalendarTarget,
    calendarMonth,
    setCalendarMonth,
    openCalendar,
    pickCalendarDate,
  };
}

export type StaffAttendance = ReturnType<typeof useStaffAttendance>;
