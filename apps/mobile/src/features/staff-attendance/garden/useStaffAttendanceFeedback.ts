// Garden feedback for the staff Attendance screen: toasts that name the student,
// Undo for un-marking, Retry on failures, and the "Everyone's checked in"
// milestone. Only reacts to the { ok } results useStaffAttendance returns.
import { haptic, useRefreshFeedback, type ConfettiHandle } from "@/components/garden";
import { shortName } from "@/features/staff-home/staffHomeUtils";
import { useEffect, useRef } from "react";
import { PROGRAMS } from "../attendanceData";
import { isCheckedIn, type RosterProgram, type RosterRow, type StaffAttendance } from "../useStaffAttendance";

const RETRY_MSG = "Check your connection and try again.";

export function useStaffAttendanceFeedback(a: StaffAttendance) {
  const { toast, refreshing, retrying, refresh, retry } = useRefreshFeedback(a.reload, a.retry);
  const confettiRef = useRef<ConfettiHandle>(null);

  const latest = useRef<{
    togglePresent?: (p: RosterProgram, row: RosterRow) => Promise<void>;
    undoUnmark?: (p: RosterProgram, studentId: string, date: string) => Promise<void>;
    openPickup?: (p: RosterProgram, row: RosterRow) => Promise<void>;
    confirmPickup?: () => Promise<void>;
    openProfile?: (row: RosterRow) => Promise<void>;
  }>({});

  // ── Milestone: last unmarked student on today's roster ─────────────────────
  // Armed just before the teacher's own check-in; browsing days or refreshing
  // never celebrates.
  const armedRef = useRef<RosterProgram | null>(null);
  const prevUnmarked = useRef<Record<string, number | null>>({});
  const program = a.activeProgram === "month_plan" ? null : a.activeProgram;
  const unmarked = program ? a.stats[program].unmarked : 0;
  const total = program ? a.stats[program].total : 0;
  const isToday = program ? a.dates[program] === a.today : false;
  useEffect(() => {
    if (!program) return;
    const prev = prevUnmarked.current[program] ?? null;
    prevUnmarked.current[program] = unmarked;
    if (armedRef.current !== program) return;
    armedRef.current = null;
    if (isToday && total > 0 && prev != null && prev > 0 && unmarked === 0) {
      confettiRef.current?.fire();
      toast.show({
        tone: "success",
        title: "Everyone's checked in 🎉",
        message: `All ${total} students are marked for today.`,
      });
    }
  }, [program, unmarked, isToday, total, toast]);
  useEffect(() => {
    // A new day or tab resets the baseline.
    armedRef.current = null;
    if (program) prevUnmarked.current[program] = null;
  }, [program, program ? a.dates[program] : null]); // eslint-disable-line react-hooks/exhaustive-deps

  const fail = (title: string, onRetry?: () => void) =>
    toast.show({
      tone: "error",
      title,
      message: RETRY_MSG,
      action: onRetry ? { label: "Retry", onPress: onRetry } : undefined,
    });

  // ── Check in / un-mark ───────────────────────────────────────────────────────
  const togglePresent = async (p: RosterProgram, row: RosterRow) => {
    const name = shortName(row.name);
    const was = isCheckedIn(p, row);
    if (was && row.record?.picked_up_by_name) {
      toast.show({ tone: "info", title: `${name} was already picked up`, message: "Pickup can't be undone here." });
      return;
    }
    const date = a.dates[p];
    haptic.select();
    if (!was) armedRef.current = p;
    const r = await a.togglePresent(p, row);
    if (!r.ok && armedRef.current === p) armedRef.current = null;
    if (r.skipped) return;
    if (r.ok) {
      if (was) {
        toast.show({
          tone: "info",
          title: p === "aftercare" ? `${name} checked out` : `${name} no longer marked present`,
          duration: 5000,
          action: { label: "Undo", onPress: () => void latest.current.undoUnmark?.(p, row.student_id, date) },
        });
      } else {
        haptic.success();
        toast.show({
          tone: "success",
          title: p === "aftercare" ? `${name} checked in` : `${name} marked present`,
          duration: 1800,
          silent: true,
        });
      }
    } else {
      fail(was ? `Couldn't update ${name}` : `Couldn't mark ${name} present`, () =>
        void latest.current.togglePresent?.(p, row),
      );
    }
  };

  const undoUnmark = async (p: RosterProgram, studentId: string, date: string) => {
    if (a.dates[p] !== date) {
      toast.show({ tone: "info", title: "Go back to that day to undo." });
      return;
    }
    const row = a.findRow(p, studentId);
    if (!row || isCheckedIn(p, row)) return;
    await togglePresent(p, row);
  };

  // ── Pickup ─────────────────────────────────────────────────────────────────────
  const openPickup = async (p: RosterProgram, row: RosterRow) => {
    const r = await a.openPickup(p, row);
    if (!r.ok) fail("Couldn't load pickup contacts", () => void latest.current.openPickup?.(p, row));
  };

  const confirmPickup = async () => {
    const row = a.pickupRow;
    const person = a.selectedPickupPerson;
    const r = await a.confirmPickup();
    if (r.skipped) return;
    if (r.ok) {
      haptic.success();
      toast.show({
        tone: "success",
        title: "Pickup recorded",
        message: row && person ? `${shortName(row.name)} went home with ${person.name}.` : undefined,
      });
    } else {
      // The sheet stays open so the teacher can try again right there.
      fail("Pickup wasn't saved", () => void latest.current.confirmPickup?.());
    }
  };

  const openPickupDetails = async (p: RosterProgram, row: RosterRow) => {
    const r = await a.openPickupDetails(p, row);
    if (!r.ok) toast.show({ tone: "error", title: "Couldn't load who recorded this", message: RETRY_MSG });
  };

  // ── Profile ──────────────────────────────────────────────────────────────────
  const openProfile = async (row: RosterRow) => {
    const r = await a.openProfile(row);
    if (!r.ok) fail("Couldn't load the profile", () => void latest.current.openProfile?.(row));
  };

  const switchProgram = (key: (typeof PROGRAMS)[number]["key"]) => {
    if (key === a.activeProgram) return;
    haptic.select();
    a.setActiveProgram(key);
  };

  useEffect(() => {
    latest.current = { togglePresent, undoUnmark, openPickup, confirmPickup, openProfile };
  });

  return {
    toast,
    confettiRef,
    refreshing,
    retrying,
    refresh,
    retry,
    togglePresent,
    openPickup,
    confirmPickup,
    openPickupDetails,
    openProfile,
    switchProgram,
  };
}

export type StaffAttendanceFeedback = ReturnType<typeof useStaffAttendanceFeedback>;
