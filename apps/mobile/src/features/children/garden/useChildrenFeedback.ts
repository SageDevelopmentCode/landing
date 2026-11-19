// Garden feedback for the Children screen: toasts, haptics, confirms and the
// read-only guard. It only reacts to the { ok, error, canceled } results the
// data hooks return.
import { haptic, READ_ONLY_TOAST, useToast } from "@/components/garden";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import type { SectionDraft } from "../profileSections";
import { PROFILE_SECTIONS } from "../profileSections";
import { CATEGORY_LABELS, firstName, type ChildTab, type LearningNote, type LearningNoteCategory, type LocalPerson, type ProfileSectionKind, type TeacherAssignment } from "../types";
import type { Children } from "../useChildren";

export function useChildrenFeedback(c: Children) {
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingSection, setSavingSection] = useState(false);
  const [pickupSaved, setPickupSaved] = useState(false);

  // Retry targets (refs updated in an effect — the React Compiler is on).
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const pickPhotoRef = useRef<(() => Promise<void>) | null>(null);
  const savePickupRef = useRef<(() => Promise<void>) | null>(null);
  const deleteNoteRef = useRef<((n: LearningNote) => Promise<void>) | null>(null);

  const blocked = useCallback(() => {
    if (!c.isReadOnlyPreview) return false;
    toast.show(READ_ONLY_TOAST);
    return true;
  }, [c.isReadOnlyPreview, toast]);

  // ─── Load / refresh ────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setRefreshing(true);
    const r = await c.reloadAll();
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

  // ─── Navigation between children / tabs ────────────────────────────────────
  const selectChild = useCallback(
    (i: number) => {
      if (i === c.activeIndex) return;
      if (c.pickup.isDirty && c.student) {
        haptic.warning();
        Alert.alert(
          "Discard unsaved changes?",
          `You haven't saved ${firstName(c.student.child_legal_name)}'s pickup changes yet.`,
          [
            { text: "Keep editing", style: "cancel", onPress: () => c.selectTab("pickup") },
            { text: "Discard", style: "destructive", onPress: () => c.selectChild(i) },
          ],
        );
        return;
      }
      c.selectChild(i);
    },
    [c],
  );

  const selectTab = useCallback((t: ChildTab) => c.selectTab(t), [c]);

  // ─── Teacher ───────────────────────────────────────────────────────────────
  const messageTeacher = useCallback(
    async (t: TeacherAssignment) => {
      const r = await c.messageTeacher(t.teacher_id, t.teacher_name);
      if (r.ok || r.canceled) return;
      haptic.error();
      toast.show({
        tone: "error",
        title: "Couldn't open the chat",
        message: "Please try again in a moment.",
        action: { label: "Retry", onPress: () => void c.messageTeacher(t.teacher_id, t.teacher_name) },
      });
    },
    [c, toast],
  );

  // ─── Learning: special requests ────────────────────────────────────────────
  const openNewNote = useCallback(() => {
    if (blocked()) return;
    haptic.press();
    c.learning.openNewNote();
  }, [blocked, c.learning]);

  const openEditNote = useCallback(
    (n: LearningNote) => {
      if (blocked()) return;
      c.learning.openEditNote(n);
    },
    [blocked, c.learning],
  );

  const saveNote = useCallback(
    async (category: LearningNoteCategory, text: string) => {
      if (blocked() || savingNote) return;
      setSavingNote(true);
      const r = await c.learning.saveNote(category, text);
      setSavingNote(false);
      if (r.ok) {
        haptic.success();
        toast.show({
          tone: "success",
          title: r.wasEdit ? "Request updated" : "Special request added",
          message: CATEGORY_LABELS[category],
          duration: 2400,
        });
      } else {
        haptic.error();
        toast.show({
          tone: "error",
          title: "Couldn't save your request",
          message: "Your note is still here — try again.",
        });
      }
    },
    [blocked, savingNote, c.learning, toast],
  );

  const runDeleteNote = useCallback(
    async (n: LearningNote) => {
      const r = await c.learning.deleteNote(n);
      if (r.ok) {
        toast.show({ tone: "success", title: "Request removed", duration: 2000 });
      } else {
        haptic.error();
        toast.show({
          tone: "error",
          title: "Couldn't remove that request",
          message: "It's back in your list.",
          action: { label: "Retry", onPress: () => void deleteNoteRef.current?.(n) },
        });
      }
    },
    [c.learning, toast],
  );

  const confirmDeleteNote = useCallback(
    (n: LearningNote) => {
      if (blocked()) return;
      haptic.warning();
      Alert.alert("Remove this request?", "It will be removed from your special requests.", [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => void runDeleteNote(n) },
      ]);
    },
    [blocked, runDeleteNote],
  );

  // ─── Profile ───────────────────────────────────────────────────────────────
  const openSection = useCallback(
    (kind: ProfileSectionKind) => {
      if (blocked()) return;
      c.profile.openSection(kind);
    },
    [blocked, c.profile],
  );

  const saveSection = useCallback(
    async (kind: ProfileSectionKind, draft: SectionDraft) => {
      if (blocked() || savingSection) return;
      setSavingSection(true);
      const r = await c.profile.saveSection(kind, draft);
      setSavingSection(false);
      if (r.ok) {
        haptic.success();
        toast.show({ tone: "success", title: PROFILE_SECTIONS[kind].successTitle, duration: 2200 });
      } else {
        haptic.error();
        toast.show({
          tone: "error",
          title: "Couldn't save changes",
          message: "Your edits are still here — try again.",
        });
      }
    },
    [blocked, savingSection, c.profile, toast],
  );

  const pickPhoto = useCallback(async () => {
    if (blocked() || c.profile.uploading) return;
    let id = -1;
    const r = await c.profile.uploadPhoto({
      onUploadStart: () => {
        id = toast.show({ tone: "loading", title: "Uploading photo…" });
      },
    });
    if (r.canceled) return;
    if (r.ok) {
      haptic.success();
      toast.update(id, { tone: "success", title: "Photo updated", duration: 2400 });
    } else {
      haptic.error();
      const opts = {
        tone: "error" as const,
        title: "Photo didn't upload",
        message: "Check your connection and try again.",
        action: { label: "Retry", onPress: () => void pickPhotoRef.current?.() },
      };
      if (id >= 0) toast.update(id, opts);
      else toast.show(opts);
    }
  }, [blocked, c.profile, toast]);

  // ─── Pickup ────────────────────────────────────────────────────────────────
  const openAddPerson = useCallback(() => {
    if (blocked()) return;
    haptic.press();
    c.pickup.openAddPerson();
  }, [blocked, c.pickup]);

  const openEditPerson = useCallback(
    (p: LocalPerson) => {
      if (blocked()) return;
      c.pickup.openEditPerson(p);
    },
    [blocked, c.pickup],
  );

  const savePerson = useCallback(
    (p: LocalPerson) => {
      const { wasEdit } = c.pickup.savePerson(p);
      haptic.select();
      toast.show({
        tone: "info",
        title: wasEdit ? "Person updated" : `${p.full_name.trim()} added`,
        message: "Tap “Save Changes” to keep it.",
        duration: 2600,
        silent: true,
      });
    },
    [c.pickup, toast],
  );

  const confirmRemovePerson = useCallback(
    (p: LocalPerson) => {
      if (blocked()) return;
      haptic.warning();
      Alert.alert(`Remove ${p.full_name}?`, "They'll be taken off the list when you save.", [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => c.pickup.removePerson(p.tempId) },
      ]);
    },
    [blocked, c.pickup],
  );

  const openDate = useCallback(
    (field: "dateOfRequest" | "effectiveUntil") => {
      if (blocked()) return;
      c.pickup.openDate(field);
    },
    [blocked, c.pickup],
  );

  const savePickup = useCallback(async () => {
    if (blocked()) return;
    const r = await c.pickup.save();
    if (r.ok) {
      haptic.success();
      setPickupSaved(true);
      toast.show({ tone: "success", title: "Pickup list saved", message: "Saved successfully!", duration: 2400 });
      setTimeout(() => setPickupSaved(false), 2000);
    } else if (r.error && r.error === c.pickup.dateProblem) {
      haptic.warning();
      toast.show({ tone: "error", title: "Check the dates", message: r.error });
    } else {
      haptic.error();
      toast.show({
        tone: "error",
        title: "Couldn't save pickup changes",
        message: "Nothing was lost — your edits are still here.",
        action: { label: "Retry", onPress: () => void savePickupRef.current?.() },
      });
    }
  }, [blocked, c.pickup, toast]);

  const discardPickup = useCallback(() => {
    haptic.warning();
    Alert.alert("Discard unsaved changes?", "Your pickup list will go back to what's saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => void c.pickup.discard() },
    ]);
  }, [c.pickup]);

  useEffect(() => {
    refreshRef.current = refresh;
    pickPhotoRef.current = pickPhoto;
    savePickupRef.current = savePickup;
    deleteNoteRef.current = runDeleteNote;
  }, [refresh, pickPhoto, savePickup, runDeleteNote]);

  return {
    toast,
    refreshing,
    retrying,
    refresh,
    retryLoad,
    selectChild,
    selectTab,
    messageTeacher,
    openNewNote,
    openEditNote,
    saveNote,
    savingNote,
    confirmDeleteNote,
    openSection,
    saveSection,
    savingSection,
    pickPhoto,
    openAddPerson,
    openEditPerson,
    savePerson,
    confirmRemovePerson,
    openDate,
    savePickup,
    discardPickup,
    pickupSaved,
  };
}

export type ChildrenFeedback = ReturnType<typeof useChildrenFeedback>;
