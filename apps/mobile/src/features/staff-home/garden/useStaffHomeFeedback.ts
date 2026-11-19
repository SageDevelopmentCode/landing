// Wraps the staff Home handlers with Garden feedback (toasts, haptics,
// confetti, confirms, undo). Each wrapper only reacts to the { ok } result the
// data hook returns — the writes themselves live in useStaffHome.
import type { ConfettiHandle } from "@/components/garden";
import { haptic, useRefreshFeedback } from "@/components/garden";
import type { SchoolYearTodayStudent } from "@/lib/school-year-today-students";
import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { isStudentCheckedIn, shortName } from "../staffHomeUtils";
import type { StaffHome, WriteResult } from "../useStaffHome";

const RETRY_MSG = "Check your connection and try again.";

export function useStaffHomeFeedback(h: StaffHome) {
  const { toast, refreshing, retrying, refresh, retry } = useRefreshFeedback(h.reload);
  const confettiRef = useRef<ConfettiHandle>(null);

  // ── "Everyone's checked in" milestone ──────────────────────────────────────
  // Armed by a successful attendance write; fires when the last unmarked
  // student on *today's* roster is marked present or absent.
  const armedRef = useRef(false);
  const prevUnmarkedRef = useRef<number | null>(null);
  const unmarked = h.statusCounts.unmarked;
  const isToday = h.selectedDate === h.todayActual;
  const rosterSize = h.todayStudents.length;
  useEffect(() => {
    const prev = prevUnmarkedRef.current;
    prevUnmarkedRef.current = unmarked;
    if (!armedRef.current) return;
    armedRef.current = false;
    if (isToday && rosterSize > 0 && prev != null && prev > 0 && unmarked === 0) {
      confettiRef.current?.fire();
      toast.show({
        tone: "success",
        title: "Everyone's checked in 🎉",
        message: `All ${rosterSize} students are marked for today.`,
      });
    }
  }, [unmarked, isToday, rosterSize, toast]);
  useEffect(() => {
    // Changing day resets the baseline so browsing never celebrates.
    armedRef.current = false;
    prevUnmarkedRef.current = null;
  }, [h.selectedDate]);

  // Latest-callback refs so Retry / Undo actions call fresh closures
  // (assigned in an effect — React Compiler is on).
  const latest = useRef<{
    markPresent?: (s: SchoolYearTodayStudent) => Promise<void>;
    togglePresent?: (s: SchoolYearTodayStudent) => Promise<void>;
    toggleAbsent?: (s: SchoolYearTodayStudent) => Promise<void>;
    toggleAftercare?: (s: SchoolYearTodayStudent) => Promise<void>;
    confirmPickup?: () => Promise<void>;
    pickPhoto?: () => Promise<void>;
    addStudent?: (s: SchoolYearTodayStudent) => Promise<void>;
    restoreStudent?: (s: SchoolYearTodayStudent, undo?: boolean) => Promise<void>;
    openAddStudent?: () => Promise<void>;
    openAllergies?: () => Promise<void>;
    openPickup?: (s: SchoolYearTodayStudent) => Promise<void>;
  }>({});

  const fail = useCallback(
    (title: string, onRetry?: () => void) => {
      toast.show({
        tone: "error",
        title,
        message: RETRY_MSG,
        action: onRetry ? { label: "Retry", onPress: onRetry } : undefined,
      });
    },
    [toast],
  );

  // Arm before the write (the roster state can re-render before the awaited
  // result comes back) and disarm when it didn't succeed.
  const arm = () => {
    armedRef.current = true;
  };
  const afterAttendanceWrite = useCallback((r: WriteResult) => {
    if (!r.ok) armedRef.current = false;
  }, []);

  // ── Row chip: Mark Present ─────────────────────────────────────────────────
  const markPresent = async (student: SchoolYearTodayStudent) => {
    const name = shortName(student.name);
    arm();
    const r = await h.markStudentPresent(student);
    afterAttendanceWrite(r);
    if (r.skipped) return;
    if (r.ok) {
      toast.show({ tone: "success", title: `${name} marked present`, duration: 1800, silent: true });
      haptic.success();
    } else {
      fail(`Couldn't mark ${name} present`, () => void latest.current.markPresent?.(student));
    }
  };

  // ── Sheet tiles ────────────────────────────────────────────────────────────
  const togglePresent = async (student: SchoolYearTodayStudent) => {
    const friday = h.selectedIsFriday;
    const record = friday ? student.schoolYearFieldFridayRecord : student.schoolYearRecord;
    const wasPresent = isStudentCheckedIn(record);
    const name = shortName(student.name);

    const run = async () => {
      haptic.select();
      arm();
      const r = await h.togglePresent(student, friday);
      afterAttendanceWrite(r);
      if (r.skipped) return;
      if (r.ok) {
        toast.show({
          tone: wasPresent ? "info" : "success",
          title: wasPresent ? `${name} no longer marked present` : `${name} marked present`,
          duration: 1800,
          silent: true,
        });
      } else {
        fail(
          wasPresent ? `Couldn't update ${name}` : `Couldn't mark ${name} present`,
          () => void latest.current.togglePresent?.(student),
        );
      }
    };

    // Un-marking deletes the record, which also clears a recorded pickup.
    if (wasPresent && record?.picked_up_by_name) {
      Alert.alert(
        `Un-mark ${name}?`,
        `This also clears the pickup recorded for ${record.picked_up_by_name}.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Un-mark", style: "destructive", onPress: () => void run() },
        ],
      );
      return;
    }
    await run();
  };

  const toggleAbsent = async (student: SchoolYearTodayStudent) => {
    const friday = h.selectedIsFriday;
    const record = friday ? student.schoolYearFieldFridayRecord : student.schoolYearRecord;
    const wasAbsent = !!record?.marked_absent;
    const name = shortName(student.name);
    haptic.select();
    arm();
    const r = await h.toggleAbsent(student, friday);
    afterAttendanceWrite(r);
    if (r.skipped) return;
    if (r.ok) {
      toast.show({
        tone: "info",
        title: wasAbsent ? `${name} no longer marked absent` : `${name} marked absent`,
        duration: 1800,
        silent: true,
      });
    } else {
      fail(`Couldn't update ${name}`, () => void latest.current.toggleAbsent?.(student));
    }
  };

  const toggleAftercare = async (student: SchoolYearTodayStudent) => {
    const had = !!student.aftercareRecord;
    const name = shortName(student.name);
    haptic.select();
    const r = await h.toggleAftercareAttendance(student);
    if (r.skipped) return;
    if (r.ok) {
      toast.show({
        tone: had ? "info" : "success",
        title: had ? `Aftercare removed for ${name}` : `Aftercare logged for ${name}`,
        duration: 1800,
        silent: true,
      });
    } else {
      fail(`Couldn't update aftercare for ${name}`, () => void latest.current.toggleAftercare?.(student));
    }
  };

  // ── Roster: hide (with Undo), add, restore ────────────────────────────────
  const restoreStudent = async (student: SchoolYearTodayStudent, undo = false) => {
    const name = shortName(student.name);
    const r = await h.restoreHiddenStudent(student);
    if (r.skipped) return;
    if (r.ok) {
      toast.show({
        tone: "success",
        title: undo ? `${name} is back on the list` : `${name} added to today's list`,
        duration: 2000,
      });
    } else {
      fail(`Couldn't restore ${name}`, () => void latest.current.restoreStudent?.(student, undo));
    }
  };

  const hideStudent = async (student: SchoolYearTodayStudent) => {
    const name = shortName(student.name);
    const hiddenOn = h.selectedDate;
    const r = await h.hideStudentFromRoster(student);
    if (r.skipped) return;
    if (r.ok) {
      toast.show({
        tone: "info",
        title: `${name} hidden from today`,
        message: "Restore anytime from Add Student.",
        duration: 5000,
        action: {
          label: "Undo",
          onPress: () => {
            if (h.selectedDate !== hiddenOn) {
              toast.show({ tone: "info", title: "Go back to that day to restore them." });
              return;
            }
            void latest.current.restoreStudent?.(student, true);
          },
        },
      });
    } else {
      fail(`Couldn't hide ${name}`);
    }
  };

  const addStudent = async (student: SchoolYearTodayStudent) => {
    const name = shortName(student.name);
    const r = await h.addStudentToRoster(student);
    if (r.skipped) return;
    if (r.ok) {
      toast.show({ tone: "success", title: `${name} added to today's list`, duration: 2000 });
    } else {
      fail(`Couldn't add ${name}`, () => void latest.current.addStudent?.(student));
    }
  };

  // ── Sheets that load on open ───────────────────────────────────────────────
  const openAddStudent = async () => {
    const r = await h.openAddStudentSheet();
    if (!r.ok) fail("Couldn't load students", () => void latest.current.openAddStudent?.());
  };

  const openAllergies = async () => {
    const r = await h.openAllergiesSheet();
    if (!r.ok) fail("Couldn't load allergy info", () => void latest.current.openAllergies?.());
  };

  const openPickup = async (student: SchoolYearTodayStudent) => {
    const r = await h.openPickup(student);
    if (!r.ok) fail("Couldn't load pickup contacts", () => void latest.current.openPickup?.(student));
  };

  // ── Pickup confirm ─────────────────────────────────────────────────────────
  const confirmPickup = async () => {
    const student = h.pickupStudent;
    const person = h.selectedPickupPerson;
    const r = await h.confirmPickup();
    if (r.skipped) return;
    if (r.ok) {
      haptic.success();
      toast.show({
        tone: "success",
        title: "Pickup recorded",
        message:
          student && person ? `${shortName(student.name)} went home with ${person.name}.` : undefined,
      });
    } else {
      // The sheet stays open so the teacher can try again right there.
      fail("Pickup wasn't saved", () => void latest.current.confirmPickup?.());
    }
  };

  // ── Profile ────────────────────────────────────────────────────────────────
  const pickPhoto = async () => {
    let id = -1;
    const r = await h.handlePickImage({
      onUploadStart: () => {
        id = toast.show({ tone: "loading", title: "Uploading your photo…" });
      },
    });
    if (r.canceled) return;
    if (r.ok) {
      toast.update(id, { tone: "success", title: "Photo updated", message: "Looking great!" });
    } else {
      toast.update(id, {
        tone: "error",
        title: "Photo didn't upload",
        message: RETRY_MSG,
        action: { label: "Retry", onPress: () => void latest.current.pickPhoto?.() },
      });
    }
  };

  const confirmSignOut = () => {
    Alert.alert("Sign out?", "You'll need to sign in again to use the app.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          h.avatarSheetRef.current?.dismiss();
          void h.signOut();
        },
      },
    ]);
  };

  useEffect(() => {
    latest.current = {
      markPresent,
      togglePresent,
      toggleAbsent,
      toggleAftercare,
      confirmPickup,
      pickPhoto,
      addStudent,
      restoreStudent,
      openAddStudent,
      openAllergies,
      openPickup,
    };
  });

  return {
    toast,
    confettiRef,
    refreshing,
    retrying,
    refresh,
    retry,
    markPresent,
    togglePresent,
    toggleAbsent,
    toggleAftercare,
    hideStudent,
    addStudent,
    restoreStudent,
    openAddStudent,
    openAllergies,
    openPickup,
    confirmPickup,
    pickPhoto,
    confirmSignOut,
  };
}

export type StaffHomeFeedback = ReturnType<typeof useStaffHomeFeedback>;
