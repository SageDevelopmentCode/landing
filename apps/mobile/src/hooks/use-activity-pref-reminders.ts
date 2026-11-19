// "Send Reminder" to a family who hasn't set an activity preference.
// Feedback is a Garden toast that names the student (staff toast host).
import { useToast } from "@/components/garden";
import { sendActivityPreferenceReminder } from "@/lib/staff-activity-pref-reminders";
import { useCallback, useState } from "react";

export function useActivityPrefReminders(activityId: string | null) {
  const toast = useToast();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(() => new Set());

  const resetReminderState = useCallback(() => {
    setSendingId(null);
    setSentIds(new Set());
  }, []);

  const sendReminder = useCallback(
    async (studentId: string, studentName?: string | null) => {
      if (!activityId || sendingId || sentIds.has(studentId)) return;
      const who = studentName?.split(" ")[0];

      setSendingId(studentId);
      try {
        const result = await sendActivityPreferenceReminder(studentId, activityId);
        if (!result.success) {
          toast.show({
            tone: "error",
            title: "Reminder failed",
            message: result.error ?? "Failed to send reminder",
          });
          return;
        }

        setSentIds((prev) => new Set(prev).add(studentId));

        const message =
          result.emailSent && !result.pushSent
            ? "Email sent. Push notification was not sent (parent may not have the app)."
            : !result.emailSent && result.pushSent
              ? "Push notification sent. Email could not be delivered."
              : undefined;
        toast.show({
          tone: "success",
          title: who ? `Reminder sent to ${who}'s family` : "Reminder sent",
          message,
          duration: message ? 5000 : undefined,
        });
      } catch (err: unknown) {
        toast.show({
          tone: "error",
          title: "Reminder failed",
          message: err instanceof Error ? err.message : "Failed to send reminder",
        });
      } finally {
        setSendingId(null);
      }
    },
    [activityId, sendingId, sentIds, toast],
  );

  return {
    sendingId,
    sentIds,
    sendReminder,
    resetReminderState,
  };
}
