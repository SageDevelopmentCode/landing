// Garden feedback for the parent calendar: toasts, haptics and confetti that
// react to the results returned by useParentCalendar's handlers.
import type { ConfettiHandle } from "@/components/garden";
import { haptic, READ_ONLY_TOAST, useToast } from "@/components/garden";
import type { ParentCalendarEventRecord } from "@/lib/calendar-actions";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking } from "react-native";
import type { CalendarEvent } from "../calendarUtils";
import type { ParentCalendar } from "../useParentCalendar";

export function useCalendarFeedback(c: ParentCalendar) {
  const toast = useToast();
  const confettiRef = useRef<ConfettiHandle>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const deleteRef = useRef<((evt: CalendarEvent) => Promise<void>) | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const r = await c.reload();
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
  }, [c, toast]);

  const retryLoad = useCallback(async () => {
    setRetrying(true);
    const r = await c.retryLoad();
    setRetrying(false);
    if (r.ok) haptic.success();
  }, [c]);

  const openAdd = useCallback(
    (dateYmd?: string) => {
      if (c.isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return;
      }
      haptic.press();
      c.openAddEvent(dateYmd);
    },
    [c, toast],
  );

  const openEdit = useCallback(
    (evt: CalendarEvent) => {
      if (c.isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return;
      }
      c.openEditEvent(evt);
    },
    [c, toast],
  );

  const runDelete = useCallback(
    async (evt: CalendarEvent) => {
      const id = toast.show({ tone: "loading", title: "Deleting event…" });
      const r = await c.deleteEvent(evt);
      if (r.ok) {
        toast.update(id, { tone: "success", title: "Event deleted", message: evt.title, duration: 2400 });
      } else {
        toast.update(id, {
          tone: "error",
          title: "Could not delete",
          message: r.error ?? "Please try again.",
          action: { label: "Retry", onPress: () => void deleteRef.current?.(evt) },
        });
      }
    },
    [c, toast],
  );

  const confirmDelete = useCallback(
    (evt: CalendarEvent) => {
      if (c.isReadOnlyPreview) {
        toast.show(READ_ONLY_TOAST);
        return;
      }
      haptic.warning();
      Alert.alert("Delete event?", "This will remove the event from the calendar for all parents.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void runDelete(evt) },
      ]);
    },
    [c.isReadOnlyPreview, runDelete, toast],
  );

  useEffect(() => {
    refreshRef.current = refresh;
    deleteRef.current = runDelete;
  }, [refresh, runDelete]);

  const onSaved = useCallback(
    (record: ParentCalendarEventRecord, wasEdit: boolean) => {
      haptic.success();
      if (wasEdit) {
        toast.show({ tone: "success", title: "Event updated", message: record.title, duration: 2400 });
      } else {
        confettiRef.current?.fire();
        toast.show({
          tone: "success",
          title: "Added to calendar 🎉",
          message: "Other Sagefield families can see it now.",
        });
      }
      c.applySavedEvent(record);
    },
    [c, toast],
  );

  const openAttachment = useCallback(
    async (url: string) => {
      try {
        await Linking.openURL(url);
      } catch {
        toast.show({
          tone: "error",
          title: "Couldn't open that file",
          message: "Please try again in a moment.",
        });
      }
    },
    [toast],
  );

  const openMaps = useCallback(
    async (url: string) => {
      try {
        await Linking.openURL(url);
      } catch {
        toast.show({ tone: "error", title: "Couldn't open Maps" });
      }
    },
    [toast],
  );

  return {
    toast,
    confettiRef,
    refreshing,
    retrying,
    refresh,
    retryLoad,
    openAdd,
    openEdit,
    confirmDelete,
    onSaved,
    openAttachment,
    openMaps,
  };
}

export type CalendarFeedback = ReturnType<typeof useCalendarFeedback>;
