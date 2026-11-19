// Wraps the student detail handlers with Garden feedback (toasts, haptics,
// confirms). Only reacts to the { ok } results useStudentDetail returns.
import { haptic, useRefreshFeedback } from "@/components/garden";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import type { Guardian, NoteRecord, StudentDetailHook } from "../useStudentDetail";

const RETRY_MSG = "Check your connection and try again.";

export function useStudentDetailFeedback(d: StudentDetailHook) {
  const { toast, refreshing, retrying, refresh, retry } = useRefreshFeedback(d.reload, d.retryDetail);

  const latest = useRef<{
    saveNote?: () => Promise<void>;
    messageGuardian?: (g: Guardian) => Promise<void>;
    runDelete?: (n: NoteRecord) => Promise<void>;
  }>({});

  const firstName = d.name.split(" ")[0] || d.name;

  const saveNote = async () => {
    let uploadId = -1;
    const editing = !!d.editingNote;
    const r = await d.saveNote({
      onUploadStart: (n) => {
        uploadId = toast.show({
          tone: "loading",
          title: n === 1 ? "Uploading 1 attachment…" : `Uploading ${n} attachments…`,
        });
      },
    });
    if (r.skipped) return;
    if (r.ok) {
      haptic.success();
      const failed = r.attachmentsFailed ?? 0;
      const opts =
        failed > 0
          ? {
              tone: "error" as const,
              title: "Note saved",
              message:
                failed === 1
                  ? "1 attachment didn't upload. Add it to a new note."
                  : `${failed} attachments didn't upload. Add them to a new note.`,
            }
          : {
              tone: "success" as const,
              title: editing ? "Changes saved" : `Note added for ${firstName}`,
              duration: 2000,
            };
      if (uploadId >= 0) toast.update(uploadId, opts);
      else toast.show(opts);
    } else {
      const opts = {
        tone: "error" as const,
        title: editing ? "Changes weren't saved" : "Note wasn't saved",
        message: "Your text is still here. " + RETRY_MSG,
        action: { label: "Retry", onPress: () => void latest.current.saveNote?.() },
      };
      if (uploadId >= 0) toast.update(uploadId, opts);
      else toast.show(opts);
    }
  };

  const runDelete = async (note: NoteRecord) => {
    const r = await d.deleteNote(note.id);
    if (r.skipped) return;
    if (r.ok) {
      haptic.success();
      toast.show({ tone: "info", title: "Note deleted", duration: 2000 });
    } else {
      toast.show({
        tone: "error",
        title: "Note wasn't deleted",
        message: RETRY_MSG,
        action: { label: "Retry", onPress: () => void latest.current.runDelete?.(note) },
      });
    }
  };

  const deleteNote = (note: NoteRecord) => {
    haptic.warning();
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void runDelete(note) },
    ]);
  };

  const pickImages = async () => {
    const r = await d.pickImages();
    if (r.canceled) return;
    if (r.ok) {
      haptic.select();
      toast.show({
        tone: "success",
        title: r.added === 1 ? "Photo attached" : `${r.added} photos attached`,
        duration: 1500,
        silent: true,
      });
    } else if (r.error === "permission") {
      toast.show({ tone: "info", title: "Photo access needed", message: "Allow photo access in Settings to attach images." });
    } else {
      toast.show({ tone: "error", title: "Couldn't attach that photo", message: "Try a different one." });
    }
  };

  const pickFiles = async () => {
    const r = await d.pickFiles();
    if (r.canceled) return;
    if (r.ok) {
      haptic.select();
      toast.show({
        tone: "success",
        title: r.added === 1 ? "File attached" : `${r.added} files attached`,
        duration: 1500,
        silent: true,
      });
    } else {
      toast.show({ tone: "error", title: "Couldn't attach that file", message: "Try again." });
    }
  };

  const messageGuardian = async (g: Guardian) => {
    const r = await d.messageGuardian(g);
    if (r.skipped) return;
    if (!r.ok) {
      toast.show({
        tone: "error",
        title: `Couldn't open a chat with ${g.name.split(" ")[0]}`,
        message: RETRY_MSG,
        action: { label: "Retry", onPress: () => void latest.current.messageGuardian?.(g) },
      });
    }
  };

  const retrySection = async (fn: () => Promise<{ ok: boolean }>) => {
    const r = await fn();
    if (r.ok) haptic.success();
    else haptic.error();
  };

  useEffect(() => {
    latest.current = { saveNote, messageGuardian, runDelete };
  });

  return {
    toast,
    refreshing,
    retrying,
    refresh,
    retry,
    saveNote,
    deleteNote,
    pickImages,
    pickFiles,
    messageGuardian,
    retrySection,
  };
}

export type StudentDetailFeedback = ReturnType<typeof useStudentDetailFeedback>;
