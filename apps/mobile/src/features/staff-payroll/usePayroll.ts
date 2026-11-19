// Staff Payroll data + writes. Keeps every original ability (rate / name /
// email, 12-period picker, hours × rate = gross, session list, paystub insert,
// duplicate message, Discord notify, submitted detail). Fixes (approved):
//   • pay periods are computed per load, not once at module load
//   • defaults to the last CLOSED period; the in-progress period can't be
//     submitted (RLS has no update/delete on paystubs, so an early submit
//     would lock the teacher out of that period's later hours)
//   • sessions are bounded to the oldest listed period and ordered, so the
//     1,000-row cap can't silently drop hours
//   • hours sum raw (clamped) durations and round once, like the web
//   • a sequence guard drops late responses; focus reloads are quiet
//   • a failed load reports an error instead of "rate not set"
//   • submit has a ref lock + try/finally, so a double tap inserts once
//   • every load / write returns { ok } so the UI can give feedback
import { notifyDiscord, notifyError } from "@/lib/discord";
import { getPastPayPeriods, toDateKey, totalSessionHours } from "@/lib/clock-utils";
import { supabase } from "@/lib/supabase";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  DUPLICATE_MSG,
  isPeriodInProgress,
  type PayPeriod,
  type Paystub,
  type RawSession,
} from "./payrollUtils";

export type LoadResult = { ok: boolean; error?: string };
export type SubmitResult = { ok: boolean; skipped?: boolean; duplicate?: boolean; error?: string };

/** Why the Submit button isn't shown (a hint takes its place; never a disabled button). */
export type SubmitBlock = "in_progress" | "no_rate" | "no_hours" | "submitted" | "error" | null;

/** What the teacher confirmed in the summary sheet. Submit uses exactly this. */
export type SubmitTarget = {
  period: PayPeriod;
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
};

const PERIOD_COUNT = 12;

export function usePayroll() {
  const [periods, setPeriods] = useState<PayPeriod[]>(() => getPastPayPeriods(PERIOD_COUNT));
  const [today, setToday] = useState(() => toDateKey(new Date()));
  // null = "use the default" (the last closed period), so a period roll-over
  // while the app is open moves the default along with it.
  const [selectedStart, setSelectedStart] = useState<string | null>(null);

  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [teacherEmail, setTeacherEmail] = useState<string | null>(null);
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [sessions, setSessions] = useState<RawSession[]>([]);

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);
  const [loadError, setLoadError] = useState(false);
  const reqId = useRef(0);

  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const pickerRef = useRef<BottomSheetModal>(null);
  const detailRef = useRef<BottomSheetModal>(null);
  const confirmRef = useRef<BottomSheetModal>(null);
  const [confirmTarget, setConfirmTarget] = useState<SubmitTarget | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const defaultPeriod = useMemo(() => periods.find((p) => p.end < today) ?? periods[0], [periods, today]);
  const selectedPeriod = useMemo(
    () => (selectedStart ? periods.find((p) => p.start === selectedStart) : undefined) ?? defaultPeriod,
    [periods, selectedStart, defaultPeriod],
  );
  const inProgress = selectedPeriod.end >= today;

  const periodSessions = useMemo(
    () =>
      sessions.filter((s) => {
        const day = toDateKey(new Date(s.clock_in_at));
        return day >= selectedPeriod.start && day <= selectedPeriod.end;
      }),
    [sessions, selectedPeriod],
  );

  const totalHours = useMemo(() => totalSessionHours(periodSessions), [periodSessions]);

  const grossPay = useMemo(
    () => (hourlyRate != null ? Math.round(totalHours * hourlyRate * 100) / 100 : null),
    [totalHours, hourlyRate],
  );

  const submittedPaystub = useMemo(
    () =>
      paystubs.find((p) => p.period_start === selectedPeriod.start && p.period_end === selectedPeriod.end) ?? null,
    [paystubs, selectedPeriod],
  );

  const submittedStarts = useMemo(() => {
    const m: Record<string, Paystub> = {};
    for (const p of paystubs) m[`${p.period_start}|${p.period_end}`] = p;
    return m;
  }, [paystubs]);

  const submitBlock: SubmitBlock = loadError
    ? "error"
    : submittedPaystub
      ? "submitted"
      : inProgress
        ? "in_progress"
        : !hourlyRate
          ? "no_rate"
          : totalHours <= 0
            ? "no_hours"
            : null;

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async (quiet: boolean): Promise<LoadResult> => {
    const id = ++reqId.current;
    const nextPeriods = getPastPayPeriods(PERIOD_COUNT);
    if (!quiet || !loadedRef.current) setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (id !== reqId.current) return { ok: true };
      if (!user) {
        if (!loadedRef.current) setLoadError(true);
        return { ok: false, error: "Not signed in" };
      }

      const oldest = nextPeriods[nextPeriods.length - 1];
      const fromISO = new Date(`${oldest.start}T00:00:00`).toISOString();

      const [userRes, paystubsRes, sessionsRes] = await Promise.all([
        supabase.schema("admin").from("users").select("hourly_rate, full_name, email").eq("id", user.id).single(),
        supabase
          .schema("teachers")
          .from("paystubs")
          .select("*")
          .eq("teacher_id", user.id)
          .order("period_start", { ascending: false }),
        supabase
          .schema("teachers")
          .from("clock_sessions")
          .select("id, clock_in_at, clock_out_at")
          .eq("teacher_id", user.id)
          .not("clock_out_at", "is", null)
          .gte("clock_in_at", fromISO)
          .order("clock_in_at", { ascending: true }),
      ]);

      if (userRes.error) notifyError("staff-payroll-load", userRes.error);
      if (paystubsRes.error) notifyError("staff-payroll-load", paystubsRes.error);
      if (sessionsRes.error) notifyError("staff-payroll-load", sessionsRes.error);
      if (id !== reqId.current) return { ok: true };

      const failed = !!(userRes.error || paystubsRes.error || sessionsRes.error);
      if (failed) {
        // A quiet reload keeps what's already on screen; a first load shows the error card.
        if (!loadedRef.current) setLoadError(true);
        return { ok: false };
      }

      setPeriods(nextPeriods);
      setToday(toDateKey(new Date()));
      setHourlyRate(userRes.data?.hourly_rate ?? null);
      setTeacherName(userRes.data?.full_name ?? null);
      setTeacherEmail(userRes.data?.email ?? null);
      setPaystubs((paystubsRes.data ?? []) as Paystub[]);
      setSessions((sessionsRes.data ?? []) as RawSession[]);
      setLoadError(false);
      loadedRef.current = true;
      setLoaded(true);
      return { ok: true };
    } catch (err) {
      notifyError("staff-payroll-load", err);
      if (id === reqId.current && !loadedRef.current) setLoadError(true);
      return { ok: false };
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const reload = useCallback(() => load(true), [load]);
  const retry = useCallback(() => load(false), [load]);

  // ── Period picker ──────────────────────────────────────────────────────────
  const openPicker = useCallback(() => pickerRef.current?.present(), []);
  const selectPeriod = useCallback((start: string) => {
    setSelectedStart(start);
    pickerRef.current?.dismiss();
  }, []);

  const openDetail = useCallback(() => detailRef.current?.present(), []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  /** Snapshot the numbers and open the summary sheet. Returns false when blocked. */
  const openConfirm = useCallback((): boolean => {
    if (submitBlock || hourlyRate == null || grossPay == null) return false;
    setConfirmTarget({ period: selectedPeriod, totalHours, hourlyRate, grossPay });
    confirmRef.current?.present();
    return true;
  }, [submitBlock, hourlyRate, grossPay, selectedPeriod, totalHours]);

  const closeConfirm = useCallback(() => confirmRef.current?.dismiss(), []);

  const submit = useCallback(
    async (target: SubmitTarget): Promise<SubmitResult> => {
      if (submittingRef.current) return { ok: false, skipped: true };
      // Re-check the guards against "now", in case the sheet sat open.
      if (isPeriodInProgress(target.period)) return { ok: false, error: "This pay period is still in progress." };
      if (!target.hourlyRate || target.totalHours <= 0) return { ok: false, skipped: true };
      if (paystubs.some((p) => p.period_start === target.period.start && p.period_end === target.period.end)) {
        return { ok: false, duplicate: true, error: DUPLICATE_MSG };
      }

      submittingRef.current = true;
      setSubmitting(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { ok: false, error: "Not authenticated." };

        const { data: stub, error } = await supabase
          .schema("teachers")
          .from("paystubs")
          .insert({
            teacher_id: user.id,
            period_start: target.period.start,
            period_end: target.period.end,
            total_hours: target.totalHours,
            hourly_rate_snapshot: target.hourlyRate,
            gross_pay: target.grossPay,
          })
          .select("*")
          .single();

        if (error) {
          notifyError("staff-payroll-submit", error);
          const duplicate = error.message.includes("duplicate") || error.message.includes("already");
          if (duplicate) void load(true); // pick up the paystub that's already there
          return { ok: false, duplicate, error: duplicate ? DUPLICATE_MSG : error.message };
        }

        setPaystubs((prev) => [stub as Paystub, ...prev]);
        notifyDiscord({
          type: "paystub_submitted",
          data: {
            teacherName: teacherName ?? teacherEmail ?? "Unknown",
            teacherEmail,
            periodStart: target.period.start,
            periodEnd: target.period.end,
            totalHours: target.totalHours,
            hourlyRate: target.hourlyRate,
            grossPay: target.grossPay,
          },
        });
        return { ok: true };
      } catch (err) {
        notifyError("staff-payroll-submit", err);
        return { ok: false, error: err instanceof Error ? err.message : "Something went wrong." };
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [paystubs, teacherName, teacherEmail, load],
  );

  return {
    // data
    periods,
    today,
    selectedPeriod,
    inProgress,
    hourlyRate,
    teacherName,
    teacherEmail,
    paystubs,
    submittedStarts,
    periodSessions,
    totalHours,
    grossPay,
    submittedPaystub,
    submitBlock,
    // status
    loading,
    loaded,
    loadError,
    submitting,
    // loaders
    reload,
    retry,
    // picker / sheets
    pickerRef,
    detailRef,
    confirmRef,
    confirmTarget,
    openPicker,
    selectPeriod,
    openDetail,
    openConfirm,
    closeConfirm,
    // writes
    submit,
  };
}

export type Payroll = ReturnType<typeof usePayroll>;
