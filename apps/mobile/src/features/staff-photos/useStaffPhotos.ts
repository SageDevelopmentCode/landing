// Staff Photos gallery: the shared gallery hook (grouping, lazy signing, date
// filter) routed into /(staff), plus who-can-do-what, the upload queue
// hookup and delete. Writes return { ok } — the Garden UI gives feedback.
import { useUploadQueue } from "@/contexts/UploadQueueContext";
import { usePhotosGallery } from "@/features/photos/usePhotosGallery";
import { useStaffRole } from "@/features/staff-shared/useStaffRole";
import { notifyError } from "@/lib/discord";
import { deletePhoto as deletePhotoAction, type TeacherPhoto } from "@/lib/photos-actions";
import { getPhotoGallerySession, updatePhotoGallerySession } from "@/lib/photo-gallery-session";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

export type WriteResult = { ok: boolean; error?: string };

export function useStaffPhotos() {
  const router = useRouter();
  const g = usePhotosGallery({ openPath: "/(staff)/photos/[photoId]" });
  const role = useStaffRole();
  const queue = useUploadQueue();
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const deletingRef = useRef(new Set<string>());

  const reloadRef = useRef(g.reload);
  useEffect(() => {
    reloadRef.current = g.reload;
  }, [g.reload]);

  // A finished upload batch (or an edit / delete elsewhere) marks the gallery
  // dirty; reload quietly when it finishes or when the screen regains focus.
  const { onBatchComplete, isGalleryDirty, markGalleryClean } = queue;
  useEffect(
    () =>
      onBatchComplete(() => {
        void reloadRef.current().then((r) => r.ok && markGalleryClean());
      }),
    [onBatchComplete, markGalleryClean],
  );
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        markGalleryClean();
        return;
      }
      if (isGalleryDirty()) void reloadRef.current().then((r) => r.ok && markGalleryClean());
    }, [isGalleryDirty, markGalleryClean]),
  );

  const canEdit = useCallback((p: TeacherPhoto) => role.isOwner(p.teacher_id), [role]);
  const canDelete = useCallback(
    (p: TeacherPhoto) => role.isOwner(p.teacher_id) || role.isSuperAdmin,
    [role],
  );

  const { removePhoto } = g;
  const deletePhoto = useCallback(
    async (p: TeacherPhoto): Promise<WriteResult> => {
      if (!canDelete(p)) return { ok: false, error: "You can't delete this photo." };
      if (deletingRef.current.has(p.id)) return { ok: true };
      deletingRef.current.add(p.id);
      setDeleting((d) => ({ ...d, [p.id]: true }));
      try {
        await deletePhotoAction(p.id, p.storage_path);
        removePhoto(p.id);
        updatePhotoGallerySession(getPhotoGallerySession().filter((x) => x.id !== p.id));
        return { ok: true };
      } catch (e) {
        notifyError("staff-photo-delete", e);
        return { ok: false, error: e instanceof Error ? e.message : "Could not delete photo." };
      } finally {
        deletingRef.current.delete(p.id);
        setDeleting(({ [p.id]: _, ...rest }) => rest);
      }
    },
    [canDelete, removePhoto],
  );

  const openUpload = useCallback(() => router.push("/(staff)/photos/upload" as never), [router]);
  const openEdit = useCallback(
    (p: TeacherPhoto) => router.push({ pathname: "/(staff)/photos/edit" as never, params: { photoId: p.id } }),
    [router],
  );

  return {
    ...g,
    role,
    queue,
    canEdit,
    canDelete,
    deletePhoto,
    deleting,
    openUpload,
    openEdit,
  };
}

export type StaffPhotos = ReturnType<typeof useStaffPhotos>;
