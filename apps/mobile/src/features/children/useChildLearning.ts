// Special requests (student_learning_notes) for one child. Data only.
import { notifyDiscord, notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LearningNote, LearningNoteCategory, Result } from "./types";

export function useChildLearning(
  studentId: string | null,
  userId: string | null,
  studentName: string,
  enabled: boolean,
) {
  const [notes, setNotes] = useState<LearningNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingNote, setEditingNote] = useState<LearningNote | null>(null);
  const [noteSession, setNoteSession] = useState(0);
  const noteSheetRef = useRef<BottomSheetModal>(null);
  const reqId = useRef(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const key = studentId && userId ? `${userId}:${studentId}` : null;

  const load = useCallback(
    async (quiet: boolean): Promise<Result> => {
      if (!studentId || !userId) return { ok: true };
      const id = ++reqId.current;
      if (!quiet) setLoading(true);
      const { data, error: err } = await supabase
        .schema("parent_app")
        .from("student_learning_notes")
        .select("*")
        .eq("student_id", studentId)
        .eq("parent_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (id !== reqId.current) return { ok: true };
      setLoading(false);
      if (err) {
        notifyError("parent-children-learning-notes-fetch", err);
        setError(true);
        return { ok: false, error: err.message };
      }
      setNotes((data as LearningNote[]) ?? []);
      setError(false);
      setLoadedKey(`${userId}:${studentId}`);
      return { ok: true };
    },
    [studentId, userId],
  );

  // Load when the Learning tab is shown for a child we haven't loaded yet.
  useEffect(() => {
    if (!enabled || !key || loadedKey === key) return;
    setNotes([]);
    void load(false);
    // loadedKey intentionally omitted: only a new child/tab should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, load]);

  const reload = useCallback(async (): Promise<Result> => {
    if (!key || loadedKey !== key) return { ok: true };
    return load(true);
  }, [load, key, loadedKey]);

  const retry = useCallback(() => load(false), [load]);

  const openNewNote = useCallback(() => {
    setEditingNote(null);
    setNoteSession((n) => n + 1);
    noteSheetRef.current?.present();
  }, []);

  const openEditNote = useCallback((note: LearningNote) => {
    setEditingNote(note);
    setNoteSession((n) => n + 1);
    noteSheetRef.current?.present();
  }, []);

  const saveNote = useCallback(
    async (category: LearningNoteCategory, noteText: string): Promise<Result & { wasEdit?: boolean }> => {
      if (!studentId || !userId) return { ok: false };
      const text = noteText.trim();
      if (editingNote) {
        const { data, error: err } = await supabase
          .schema("parent_app")
          .from("student_learning_notes")
          .update({ category, note_text: text, updated_at: new Date().toISOString() })
          .eq("id", editingNote.id)
          .eq("parent_id", userId)
          .select()
          .single();
        if (err || !data) {
          notifyError("parent-children-learning-note-update", err);
          return { ok: false, error: err?.message };
        }
        setNotes((prev) => prev.map((n) => (n.id === data.id ? (data as LearningNote) : n)));
        noteSheetRef.current?.dismiss();
        setEditingNote(null);
        return { ok: true, wasEdit: true };
      }
      const { data, error: err } = await supabase
        .schema("parent_app")
        .from("student_learning_notes")
        .insert({ parent_id: userId, student_id: studentId, category, note_text: text })
        .select()
        .single();
      if (err || !data) {
        notifyError("parent-children-learning-note-create", err);
        return { ok: false, error: err?.message };
      }
      setNotes((prev) => [data as LearningNote, ...prev]);
      notifyDiscord({ type: "special_request_created", data: { studentName, category, noteText: text } });
      noteSheetRef.current?.dismiss();
      return { ok: true, wasEdit: false };
    },
    [editingNote, studentId, userId, studentName],
  );

  /** Optimistic soft-delete; the note is put back if the write fails. */
  const deleteNote = useCallback(
    async (note: LearningNote): Promise<Result> => {
      if (!userId) return { ok: false };
      const index = notes.findIndex((n) => n.id === note.id);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      const { error: err } = await supabase
        .schema("parent_app")
        .from("student_learning_notes")
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq("id", note.id)
        .eq("parent_id", userId);
      if (err) {
        notifyError("parent-children-learning-note-delete", err);
        setNotes((prev) => {
          if (prev.some((n) => n.id === note.id)) return prev;
          const next = [...prev];
          next.splice(index < 0 ? 0 : Math.min(index, next.length), 0, note);
          return next;
        });
        return { ok: false, error: err.message };
      }
      return { ok: true };
    },
    [userId, notes],
  );

  return {
    notes,
    loading: loading || (!!key && loadedKey !== key && !error),
    error,
    reload,
    retry,
    noteSheetRef,
    editingNote,
    noteSession,
    openNewNote,
    openEditNote,
    saveNote,
    deleteNote,
  };
}

export type ChildLearning = ReturnType<typeof useChildLearning>;
