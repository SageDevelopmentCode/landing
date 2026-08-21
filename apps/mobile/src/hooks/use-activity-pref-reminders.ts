import { sendActivityPreferenceReminder } from "@/lib/staff-activity-pref-reminders";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export function useActivityPrefReminders(activityId: string | null) {
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(() => new Set());

  const resetReminderState = useCallback(() => {
    setSendingId(null);
    setSentIds(new Set());
  }, []);

  const sendReminder = useCallback(
    async (studentId: string) => {
      if (!activityId || sendingId || sentIds.has(studentId)) return;

      setSendingId(studentId);
      try {
        const result = await sendActivityPreferenceReminder(studentId, activityId);
        if (!result.success) {
          Alert.alert("Reminder failed", result.error ?? "Failed to send reminder");
          return;
        }

        setSentIds((prev) => new Set(prev).add(studentId));

        if (result.emailSent && !result.pushSent) {
          Alert.alert(
            "Reminder sent",
            "Email sent. Push notification was not sent (parent may not have the app).",
          );
        } else if (!result.emailSent && result.pushSent) {
          Alert.alert(
            "Reminder sent",
            "Push notification sent. Email could not be delivered.",
          );
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to send reminder";
        Alert.alert("Reminder failed", message);
      } finally {
        setSendingId(null);
      }
    },
    [activityId, sendingId, sentIds],
  );

  return {
    sendingId,
    sentIds,
    sendReminder,
    resetReminderState,
  };
}
