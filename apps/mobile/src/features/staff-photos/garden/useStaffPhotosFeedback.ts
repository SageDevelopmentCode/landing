// Feedback for the staff gallery: pull to refresh, the long-press menu,
// delete confirm + toasts. Reacts only to the { ok } results from the hook.
import { haptic, useRefreshFeedback, type GardenActionSheetHandle } from "@/components/garden";
import type { TeacherPhoto } from "@/lib/photos-actions";
import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import type { StaffPhotos } from "../useStaffPhotos";

export function photoName(p: TeacherPhoto) {
  if (p.caption) return `“${p.caption.length > 32 ? `${p.caption.slice(0, 32)}…` : p.caption}”`;
  if (p.taken_on) {
    const d = new Date(p.taken_on + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `Photo from ${d}`;
  }
  return "This photo";
}

export function useStaffPhotosFeedback(s: StaffPhotos) {
  const refresh = useRefreshFeedback(s.reload);
  const { toast } = refresh;
  const menuRef = useRef<GardenActionSheetHandle>(null);
  const deleteRef = useRef<((p: TeacherPhoto) => Promise<void>) | null>(null);

  const runDelete = useCallback(
    async (p: TeacherPhoto) => {
      const r = await s.deletePhoto(p);
      if (r.ok) {
        toast.show({ tone: "success", title: "Photo deleted", message: `${photoName(p)} was removed.` });
      } else {
        toast.show({
          tone: "error",
          title: "Delete failed",
          message: r.error ?? "Could not delete photo.",
          action: { label: "Retry", onPress: () => void deleteRef.current?.(p) },
        });
      }
    },
    [s, toast],
  );

  useEffect(() => {
    deleteRef.current = runDelete;
  }, [runDelete]);

  const confirmDelete = useCallback(
    (p: TeacherPhoto) => {
      haptic.warning();
      Alert.alert("Delete Photo", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void runDelete(p) },
      ]);
    },
    [runDelete],
  );

  const openMenu = useCallback(
    (p: TeacherPhoto) => {
      haptic.press();
      const actions = [
        { label: "View", icon: "expand-outline" as const, onPress: () => s.openPhoto(p) },
        ...(s.canEdit(p)
          ? [
              {
                label: "Edit",
                icon: "create-outline" as const,
                hint: "Caption, date, labels and tags",
                onPress: () => s.openEdit(p),
              },
            ]
          : []),
        ...(s.canDelete(p)
          ? [{ label: "Delete", icon: "trash-outline" as const, destructive: true, onPress: () => confirmDelete(p) }]
          : []),
      ];
      menuRef.current?.present({
        title: photoName(p),
        subtitle: p.tags.length
          ? `Tagged: ${p.tags
              .map((t) => t.name?.split(" ")[0])
              .filter(Boolean)
              .join(", ")}`
          : undefined,
        actions,
      });
    },
    [s, confirmDelete],
  );

  return { ...refresh, menuRef, openMenu, confirmDelete };
}

export type StaffPhotosFeedback = ReturnType<typeof useStaffPhotosFeedback>;
