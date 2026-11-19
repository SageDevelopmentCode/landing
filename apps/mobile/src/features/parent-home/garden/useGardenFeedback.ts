// Wraps the shared Home handlers with Garden feedback (toasts, haptics,
// confetti). Behaviour of each handler is unchanged — this only reacts to the
// results they return.
import type { ConfettiHandle } from "@/components/garden";
import { haptic, useToast } from "@/components/garden";
import type { ParticipationLevel } from "@/lib/activity-preferences";
import type { ConferenceBookingRecord } from "@/lib/parent-teacher-conference";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHECKLIST_TASKS, TOTAL_TASKS } from "../constants";
import type { TeacherSuggestion } from "../types";
import type { ParentHome } from "../useParentHome";

const READ_ONLY_TOAST = {
  tone: "info" as const,
  title: "Preview mode",
  message: "Changes are turned off while viewing as a parent.",
};

export function useGardenFeedback(h: ParentHome) {
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const pickPhotoRef = useRef<(() => Promise<void>) | null>(null);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const celebrate = useCallback(() => confettiRef.current?.fire(), []);

  const messageTeacher = useCallback(
    async (teacher: TeacherSuggestion) => {
      const r = await h.handleMessageTeacher(teacher);
      if (!r.ok) {
        toast.show({
          tone: "error",
          title: "Couldn't open the chat",
          message: "Please try again in a moment.",
          action: { label: "Retry", onPress: () => void h.handleMessageTeacher(teacher) },
        });
      }
    },
    [h, toast],
  );

  const pickPhoto = useCallback(async () => {
    if (h.isReadOnlyPreview) {
      toast.show(READ_ONLY_TOAST);
      return;
    }
    let id = -1;
    const r = await h.handlePickParentImage({
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
        message: "Check your connection and try again.",
        action: { label: "Retry", onPress: () => void pickPhotoRef.current?.() },
      });
    }
  }, [h, toast]);

  const toggleTask = useCallback(
    async (taskId: string) => {
      if (h.isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return;
      }
      haptic.select();
      const r = await h.toggleOnboardingTask(taskId);
      if (!r.ok) {
        toast.show({ tone: "error", title: "Couldn't save that step", message: "Please try again." });
        return;
      }
      if (!r.done) return;
      if (r.completedCount === TOTAL_TASKS) {
        celebrate();
        toast.show({ tone: "success", title: "All set up! 🎉", message: "Great job getting started." });
      } else {
        const label = CHECKLIST_TASKS.find((t) => t.id === taskId)?.label;
        toast.show({
          tone: "success",
          title: `${r.completedCount} of ${TOTAL_TASKS} done`,
          message: label ? `Checked off “${label}”` : undefined,
          duration: 2200,
        });
      }
    },
    [h, toast, celebrate],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const r = await h.reload();
    setRefreshing(false);
    if (r.ok) {
      toast.show({ tone: "success", title: "You're up to date", duration: 1600, silent: true });
      haptic.tap();
    } else {
      toast.show({
        tone: "error",
        title: "Couldn't refresh",
        message: "Check your connection and try again.",
        action: { label: "Retry", onPress: () => void refreshRef.current?.() },
      });
    }
  }, [h, toast]);
  useEffect(() => {
    pickPhotoRef.current = pickPhoto;
    refreshRef.current = refresh;
  }, [pickPhoto, refresh]);

  const retryLoad = useCallback(async () => {
    setRetrying(true);
    await h.reload();
    setRetrying(false);
  }, [h]);

  const onDefaultSaved = useCallback(
    (_studentId: string, _level: ParticipationLevel | null, ok: boolean) => {
      if (ok) toast.show({ tone: "success", title: "Auto-fill saved", duration: 1800 });
      else toast.show({ tone: "error", title: "Couldn't save auto-fill", message: "Please try again." });
    },
    [toast],
  );

  const onActivitySaved = useCallback(() => {
    toast.show({ tone: "success", title: "Preferences saved", message: "Thanks for letting us know!" });
  }, [toast]);

  const onBookingsChanged = useCallback(
    (
      next: Record<string, ConferenceBookingRecord>,
      prev: Record<string, ConferenceBookingRecord>,
    ) => {
      const nextCount = Object.keys(next).length;
      const prevCount = Object.keys(prev).length;
      if (nextCount > prevCount) {
        celebrate();
        toast.show({ tone: "success", title: "Conference booked", message: "We'll see you there!" });
      } else if (nextCount < prevCount) {
        toast.show({ tone: "info", title: "Conference cancelled" });
      } else {
        toast.show({ tone: "success", title: "Conference updated" });
      }
    },
    [toast, celebrate],
  );

  const guardWrite = useCallback(
    (fn: () => void) => {
      if (h.isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return;
      }
      fn();
    },
    [h.isReadOnlyPreview, toast],
  );

  return {
    toast,
    confettiRef,
    celebrate,
    refreshing,
    retrying,
    refresh,
    retryLoad,
    messageTeacher,
    pickPhoto,
    toggleTask,
    onDefaultSaved,
    onActivitySaved,
    onBookingsChanged,
    guardWrite,
  };
}

export type GardenFeedback = ReturnType<typeof useGardenFeedback>;
