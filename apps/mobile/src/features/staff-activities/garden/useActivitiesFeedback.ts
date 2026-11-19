// Feedback for the staff Activities list: refresh, the ⋮ menu, delete
// confirm + toast naming the activity.
import { haptic, useRefreshFeedback, type GardenActionSheetHandle } from "@/components/garden";
import type { Activity } from "@/lib/activities-actions";
import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import type { StaffActivities } from "../useStaffActivities";

export function useActivitiesFeedback(a: StaffActivities) {
  const refresh = useRefreshFeedback(a.reload);
  const { toast } = refresh;
  const menuRef = useRef<GardenActionSheetHandle>(null);
  const deleteRef = useRef<((x: Activity) => Promise<void>) | null>(null);

  const runDelete = useCallback(
    async (x: Activity) => {
      const r = await a.remove(x);
      if (r.ok) toast.show({ tone: "success", title: "Activity deleted", message: `“${x.title}” was removed.` });
      else
        toast.show({
          tone: "error",
          title: "Couldn't delete the activity",
          message: r.error ?? "Failed to delete",
          action: { label: "Retry", onPress: () => void deleteRef.current?.(x) },
        });
    },
    [a, toast],
  );
  useEffect(() => {
    deleteRef.current = runDelete;
  }, [runDelete]);

  const confirmDelete = useCallback(
    (x: Activity) => {
      haptic.warning();
      Alert.alert(
        "Delete Activity",
        `Are you sure you want to delete "${x.title}"?${x.status === "published" && x.visibility === "public" ? " Families will no longer see it." : ""}`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => void runDelete(x) },
        ],
      );
    },
    [runDelete],
  );

  const openMenu = useCallback(
    (x: Activity) => {
      menuRef.current?.present({
        title: x.title,
        actions: [
          { label: "Open", icon: "open-outline", onPress: () => a.openDetail(x) },
          { label: "Edit", icon: "create-outline", hint: "Details, photos, publishing and food", onPress: () => a.openEdit(x) },
          { label: "Delete", icon: "trash-outline", destructive: true, onPress: () => confirmDelete(x) },
        ],
      });
    },
    [a, confirmDelete],
  );

  return { ...refresh, menuRef, openMenu, confirmDelete };
}
