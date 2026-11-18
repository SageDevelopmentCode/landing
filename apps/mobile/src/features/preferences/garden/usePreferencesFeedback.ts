// Garden feedback for Activity Preferences. Wraps the data hook's writes and
// only reacts to their { ok } results: read-only guard, haptics, toasts with
// Retry, and the "discard changes?" check on back.
import { haptic, useGardenGoBack, useToast, useWriteGuard } from "@/components/garden";
import type {
  EmergencySnackPreference,
  SharedFoodPreference,
} from "@/components/SchoolDayFoodPreferencesSheet";
import { LEVEL_SHORT_LABEL, type ParticipationLevel } from "@/lib/activity-preferences";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import type { ActivityPreferences } from "../useActivityPreferences";

export function usePreferencesFeedback(p: ActivityPreferences) {
  const toast = useToast();
  const { blocked } = useWriteGuard();
  const goBack = useGardenGoBack();
  const [retrying, setRetrying] = useState(false);

  const setDefaultRef = useRef<((l: ParticipationLevel | null) => Promise<void>) | null>(null);
  const saveRef = useRef<(() => Promise<boolean>) | null>(null);

  const setDefault = useCallback(
    async (level: ParticipationLevel | null) => {
      if (blocked()) return;
      const r = await p.setDefault(level);
      if (r.ok) {
        haptic.success();
        toast.show({
          tone: "success",
          title: level ? `Default saved · ${LEVEL_SHORT_LABEL[level]}` : "Default cleared.",
          duration: 1800,
          silent: true,
        });
      } else if (r.error !== "read-only") {
        toast.show({
          tone: "error",
          title: "Something went wrong. Please try again.",
          action: { label: "Retry", onPress: () => void setDefaultRef.current?.(level) },
        });
      }
    },
    [blocked, p, toast],
  );

  /** Returns true when the save went through. */
  const save = useCallback(async (): Promise<boolean> => {
    if (blocked()) return false;
    const r = await p.save();
    if (r.ok) {
      haptic.success();
      toast.show({
        tone: "success",
        title: "Preferences saved",
        message: p.selectedChildFirstName,
        duration: 2200,
        silent: true,
      });
      return true;
    }
    if (r.error && r.error !== "read-only") {
      toast.show({
        tone: "error",
        title: "Something went wrong. Please try again.",
        action: { label: "Retry", onPress: () => void saveRef.current?.() },
      });
    }
    return false;
  }, [blocked, p, toast]);

  const saveFood = useCallback(
    async (
      studentId: string,
      studentName: string,
      emergency: EmergencySnackPreference,
      shared: SharedFoodPreference,
    ) => {
      if (blocked()) return { ok: false };
      const r = await p.saveSchoolDayFood(studentId, studentName, emergency, shared);
      if (r.ok) {
        haptic.success();
        toast.show({ tone: "success", title: "Preferences saved", message: "School Day Food Preferences", silent: true });
      } else {
        haptic.error();
      }
      return r;
    },
    [blocked, p, toast],
  );

  const retryLoad = useCallback(async () => {
    setRetrying(true);
    const r = await p.retryLoad();
    setRetrying(false);
    if (r.ok) haptic.success();
    else haptic.error();
  }, [p]);

  const onBack = useCallback(() => {
    if (!p.hasUnsavedChanges || p.isReadOnlyPreview) {
      goBack();
      return;
    }
    haptic.warning();
    Alert.alert("Discard changes?", "Your selections haven't been saved yet.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: goBack },
    ]);
  }, [p.hasUnsavedChanges, p.isReadOnlyPreview, goBack]);

  useEffect(() => {
    setDefaultRef.current = setDefault;
    saveRef.current = save;
  }, [setDefault, save]);

  return { toast, blocked, retrying, setDefault, save, saveFood, retryLoad, onBack };
}

export type PreferencesFeedback = ReturnType<typeof usePreferencesFeedback>;
