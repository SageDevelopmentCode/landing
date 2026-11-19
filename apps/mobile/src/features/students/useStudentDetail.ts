// Staff student detail data + writes. Queries, payloads, storage paths and
// tab set are carried over from the original app/(staff)/students/[studentId].tsx.
// Differences (approved bug fixes):
//   • tab data loads once the student has loaded (tapping a tab early no
//     longer leaves Notes/Contacts empty forever)
//   • emergency contacts load even when the student has no parent account
//   • focus refreshes quietly; everything resets when studentId changes
//   • every write returns { ok } so the UI can show feedback; a failed note
//     save keeps the sheet open with the text intact
//   • attachment names are unique, so several photos picked together all upload
//   • "Message" opens (or starts) the DM with that guardian
import { useStudentAttendance } from "@/features/attendance/useStudentAttendance";
import { findOrCreateConversation } from "@/features/messages/messagingApi";
import { notifyError } from "@/lib/discord";
import { getStudentDisplayName } from "@/lib/student-display-name";
import { supabase } from "@/lib/supabase";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StudentContacts, StudentProfileInfo } from "./garden/StudentProfileBits";

export type StudentDetail = StudentProfileInfo & {
  id: string;
  child_legal_name: string;
  profile_image_url: string | null;
  parent_id: string | null;
};

export type NoteCategory = "general" | "behavioral" | "academic" | "social" | "health";
export const NOTE_CATEGORIES: NoteCategory[] = ["general", "behavioral", "academic", "social", "health"];

export type NoteAttachment = {
  id: string;
  file_name: string;
  file_path: string;
  file_type: "image" | "file";
  signed_url?: string;
  created_at: string;
};

export type NoteRecord = {
  id: string;
  note_text: string;
  category: NoteCategory;
  is_shared: boolean;
  created_at: string;
  teacher_note_attachments: NoteAttachment[];
};

export type PendingAttachment = { uri: string; name: string; mimeType: string; isImage: boolean };

export type StudentTab =
  | "info"
  | "contacts"
  | "notes"
  | "attendance"
  | "portfolio"
  | "progress"
  | "messages"
  | "pickup";

export const STUDENT_TABS: { key: StudentTab; label: string; icon: string }[] = [
  { key: "info", label: "Info", icon: "person-outline" },
  { key: "contacts", label: "Contacts", icon: "call-outline" },
  { key: "notes", label: "Notes", icon: "document-text-outline" },
  { key: "attendance", label: "Attendance", icon: "calendar-outline" },
  { key: "portfolio", label: "Portfolio", icon: "images-outline" },
  { key: "progress", label: "Progress", icon: "trending-up-outline" },
  { key: "messages", label: "Messages", icon: "chatbubbles-outline" },
  { key: "pickup", label: "Pickup", icon: "car-outline" },
];

export type Guardian = {
  key: "g1" | "g2";
  name: string;
  email: string | null;
  relationship: string | null;
  accountId: string | null;
};

export type WriteResult = { ok: boolean; canceled?: boolean; skipped?: boolean; error?: string };
export type SaveNoteResult = WriteResult & { attachmentsFailed?: number; edited?: boolean };

const BUCKET = "teacher-note-attachments";

function safeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_").slice(-80) || "file";
}

async function withSignedUrls(raw: any[]): Promise<NoteRecord[]> {
  return Promise.all(
    raw.map(async (note) => {
      const attachments: NoteAttachment[] = await Promise.all(
        (note.teacher_note_attachments ?? []).map(async (att: any) => {
          const { data } = await supabase.storage.from(BUCKET).createSignedUrl(att.file_path, 3600);
          return { ...att, signed_url: data?.signedUrl };
        }),
      );
      return { ...note, teacher_note_attachments: attachments };
    }),
  );
}

export function useStudentDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    studentId: string;
    studentName?: string;
    program?: string;
    classroom?: string;
    allStudentsView?: string;
  }>();
  const studentId = params.studentId;
  const allStudentsView = params.allStudentsView === "1";

  const [userId, setUserId] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [preferredName, setPreferredName] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<StudentTab>("info");
  const [visited, setVisited] = useState<StudentTab[]>(["info"]);

  const [contacts, setContacts] = useState<StudentContacts | null>(null);
  const [contactsState, setContactsState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [accounts, setAccounts] = useState<Record<string, string>>({}); // lower(email) → user id
  const [accountsState, setAccountsState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [notesState, setNotesState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  // Note sheet draft
  const noteSheetRef = useRef<BottomSheetModal>(null);
  const [editingNote, setEditingNote] = useState<NoteRecord | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteCategory, setNoteCategory] = useState<NoteCategory>("general");
  const [noteShared, setNoteShared] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [savingNote, setSavingNote] = useState(false);
  const savingNoteRef = useRef(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingGuardian, setOpeningGuardian] = useState<string | null>(null);

  const attendance = useStudentAttendance(
    student && visited.includes("attendance") ? studentId : null,
    "staff-student-attendance",
  );

  // Guards against a slow response for a previous student landing late.
  const reqId = useRef(0);

  // ── Reset when the route switches to another student ──────────────────────
  useEffect(() => {
    reqId.current++;
    setStudent(null);
    setPreferredName(null);
    setLoadingDetail(true);
    setDetailError(null);
    setActiveTab("info");
    setVisited(["info"]);
    setContacts(null);
    setContactsState("idle");
    setAccounts({});
    setAccountsState("idle");
    setNotes([]);
    setNotesState("idle");
  }, [studentId]);

  // ── Detail ────────────────────────────────────────────────────────────────
  const fetchDetail = useCallback(
    async (quiet: boolean): Promise<WriteResult> => {
      const id = reqId.current;
      if (!quiet) {
        setLoadingDetail(true);
        setDetailError(null);
      }
      const fail = (msg: string) => {
        if (id === reqId.current && !quiet) setDetailError(msg);
        return { ok: false, error: msg };
      };
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return fail("Not authenticated.");
        if (id !== reqId.current) return { ok: true };
        setUserId(user.id);

        // Verify access (skipped when opened from All Students).
        if (!allStudentsView) {
          const { data: rows, error } = await supabase
            .schema("teachers")
            .from("teacher_students")
            .select("id")
            .eq("teacher_id", user.id)
            .eq("student_id", studentId)
            .eq("is_deleted", false)
            .limit(1);
          if (error) return fail(`Access check failed: ${error.message}`);
          if (!rows || rows.length === 0) return fail("No assignment found for this student.");
        }

        const [studentRes, appRes] = await Promise.all([
          supabase.schema("admin").from("students").select("*").eq("id", studentId).single(),
          supabase
            .schema("parent_app")
            .from("applications")
            .select("preferred_name, child_legal_name")
            .eq("student_id", studentId)
            .eq("status", "enrolled")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        if (studentRes.error) return fail(`Student fetch failed: ${studentRes.error.message}`);
        if (id !== reqId.current) return { ok: true };
        setStudent((studentRes.data as StudentDetail) ?? null);
        setPreferredName((appRes.data as { preferred_name: string | null } | null)?.preferred_name ?? null);
        setDetailError(null);
        return { ok: true };
      } catch (e) {
        notifyError("staff-student-detail", e);
        return fail("Couldn't load this student.");
      } finally {
        if (id === reqId.current) setLoadingDetail(false);
      }
    },
    [allStudentsView, studentId],
  );

  // ── Contacts ──────────────────────────────────────────────────────────────
  const fetchContacts = useCallback(
    async (s: StudentDetail, quiet = false): Promise<WriteResult> => {
      const id = reqId.current;
      if (!quiet) setContactsState("loading");
      try {
        const [healthRes, parentRes] = await Promise.all([
          supabase
            .schema("parent_app")
            .from("student_health_info")
            .select("*")
            .eq("student_id", studentId)
            .limit(1)
            .maybeSingle(),
          s.parent_id
            ? supabase
                .schema("admin")
                .from("users")
                .select(
                  "id, full_name, email, g1_cell_phone, g1_work_phone, g2_full_name, g2_email, g2_cell_phone, g2_work_phone, g2_relationship",
                )
                .eq("id", s.parent_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);
        if (id !== reqId.current) return { ok: true };
        const err = healthRes.error ?? parentRes.error;
        if (err) {
          notifyError("staff-student-contacts", err);
          if (!quiet) setContactsState("error");
          return { ok: false };
        }
        const health = healthRes.data as any;
        const parent = parentRes.data as any;
        if (!health && !parent) {
          setContacts(null);
        } else {
          setContacts({
            // Guardian 1 is the parent user themselves
            g1_full_name: parent?.full_name ?? null,
            g1_relationship: null,
            g1_cell_phone: parent?.g1_cell_phone ?? null,
            g1_work_phone: parent?.g1_work_phone ?? null,
            g1_email: parent?.email ?? null,
            g2_full_name: parent?.g2_full_name ?? null,
            g2_relationship: parent?.g2_relationship ?? null,
            g2_cell_phone: parent?.g2_cell_phone ?? null,
            g2_work_phone: parent?.g2_work_phone ?? null,
            g2_email: parent?.g2_email ?? null,
            in_state_contact_name: health?.in_state_contact_name ?? null,
            in_state_contact_relation: health?.in_state_contact_relation ?? null,
            in_state_contact_phone: health?.in_state_contact_phone ?? null,
            out_of_state_contact_name: health?.out_of_state_contact_name ?? null,
            out_of_state_contact_relation: health?.out_of_state_contact_relation ?? null,
            out_of_state_contact_phone: health?.out_of_state_contact_phone ?? null,
          });
        }
        setContactsState("ready");
        return { ok: true };
      } catch (e) {
        notifyError("staff-student-contacts", e);
        if (id === reqId.current && !quiet) setContactsState("error");
        return { ok: false };
      }
    },
    [studentId],
  );

  // App accounts for the guardians' emails (Messages tab).
  const fetchAccounts = useCallback(async (c: StudentContacts | null): Promise<WriteResult> => {
    const id = reqId.current;
    const emails = [c?.g1_email, c?.g2_email].filter(Boolean) as string[];
    if (emails.length === 0) {
      setAccounts({});
      setAccountsState("ready");
      return { ok: true };
    }
    setAccountsState("loading");
    try {
      const variants = [...new Set(emails.flatMap((e) => [e, e.toLowerCase()]))];
      const { data, error } = await supabase
        .schema("admin")
        .from("users")
        .select("id, full_name, email")
        .in("email", variants);
      if (id !== reqId.current) return { ok: true };
      if (error) {
        notifyError("staff-student-guardian-accounts", error);
        setAccountsState("error");
        return { ok: false };
      }
      const map: Record<string, string> = {};
      for (const u of data ?? []) if (u.email) map[String(u.email).toLowerCase()] = u.id;
      setAccounts(map);
      setAccountsState("ready");
      return { ok: true };
    } catch (e) {
      notifyError("staff-student-guardian-accounts", e);
      if (id === reqId.current) setAccountsState("error");
      return { ok: false };
    }
  }, []);

  // ── Notes ─────────────────────────────────────────────────────────────────
  const fetchNotes = useCallback(
    async (uid: string, quiet = false): Promise<WriteResult> => {
      const id = reqId.current;
      if (!quiet) setNotesState("loading");
      try {
        const { data, error } = await supabase
          .schema("teachers")
          .from("teacher_notes")
          .select("*, teacher_note_attachments(*)")
          .eq("student_id", studentId)
          .eq("teacher_id", uid)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false });
        if (error) {
          notifyError("staff-student-notes", error);
          if (id === reqId.current && !quiet) setNotesState("error");
          return { ok: false };
        }
        const withUrls = await withSignedUrls(data ?? []);
        if (id !== reqId.current) return { ok: true };
        setNotes(withUrls);
        setNotesState("ready");
        return { ok: true };
      } catch (e) {
        notifyError("staff-student-notes", e);
        if (id === reqId.current && !quiet) setNotesState("error");
        return { ok: false };
      }
    },
    [studentId],
  );

  // Lazy tab loads, run once the student (and user) are known.
  const wantsContacts = visited.includes("contacts") || visited.includes("messages");
  const wantsNotes = visited.includes("notes");
  useEffect(() => {
    if (student && wantsContacts && contactsState === "idle") void fetchContacts(student);
  }, [student, wantsContacts, contactsState, fetchContacts]);
  useEffect(() => {
    if (visited.includes("messages") && contactsState === "ready" && accountsState === "idle") {
      void fetchAccounts(contacts);
    }
  }, [visited, contactsState, accountsState, contacts, fetchAccounts]);
  useEffect(() => {
    if (student && userId && wantsNotes && notesState === "idle") void fetchNotes(userId);
  }, [student, userId, wantsNotes, notesState, fetchNotes]);

  const selectTab = useCallback((tab: StudentTab) => {
    setActiveTab(tab);
    setVisited((v) => (v.includes(tab) ? v : [...v, tab]));
  }, []);

  // Focus: first load shows skeletons; returning to the screen refreshes quietly.
  const loadedRef = useRef(false);
  useEffect(() => {
    loadedRef.current = !!student;
  }, [student]);
  useFocusEffect(
    useCallback(() => {
      void fetchDetail(loadedRef.current);
    }, [fetchDetail]),
  );

  /** Pull to refresh: the detail plus every tab already opened. */
  const reload = useCallback(async (): Promise<WriteResult> => {
    const r = await fetchDetail(true);
    const jobs: Promise<WriteResult>[] = [];
    if (student && contactsState === "ready") {
      jobs.push(fetchContacts(student, true).then(async (c) => c));
    }
    if (userId && notesState === "ready") jobs.push(fetchNotes(userId, true));
    if (visited.includes("attendance")) jobs.push(attendance.reload());
    const rest = await Promise.all(jobs);
    if (accountsState === "ready") void fetchAccounts(contacts);
    return { ok: r.ok && rest.every((x) => x.ok) };
  }, [
    accountsState,
    attendance,
    contacts,
    contactsState,
    fetchAccounts,
    fetchContacts,
    fetchDetail,
    fetchNotes,
    notesState,
    student,
    userId,
    visited,
  ]);

  const retryDetail = useCallback(() => fetchDetail(false), [fetchDetail]);
  const retryContacts = useCallback(async () => {
    if (!student) return { ok: false };
    const r = await fetchContacts(student);
    if (r.ok && visited.includes("messages")) setAccountsState("idle");
    return r;
  }, [fetchContacts, student, visited]);
  const retryAccounts = useCallback(() => fetchAccounts(contacts), [contacts, fetchAccounts]);
  const retryNotes = useCallback(async () => (userId ? fetchNotes(userId) : { ok: false }), [fetchNotes, userId]);

  // ── Guardians (Messages tab) ───────────────────────────────────────────────
  const guardians: Guardian[] = (
    [
      { key: "g1", name: contacts?.g1_full_name, email: contacts?.g1_email, relationship: contacts?.g1_relationship },
      { key: "g2", name: contacts?.g2_full_name, email: contacts?.g2_email, relationship: contacts?.g2_relationship },
    ] as const
  )
    .filter((g) => !!g.name)
    .map((g) => ({
      key: g.key,
      name: g.name as string,
      email: g.email ?? null,
      relationship: g.relationship ?? null,
      accountId: g.email ? (accounts[g.email.toLowerCase()] ?? null) : null,
    }));

  const messageGuardian = useCallback(
    async (g: Guardian): Promise<WriteResult> => {
      if (!g.accountId || openingGuardian) return { ok: false, skipped: true };
      setOpeningGuardian(g.key);
      try {
        const r = await findOrCreateConversation(g.accountId);
        if (!r.ok) return { ok: false, error: r.error };
        router.push({
          pathname: "/(staff)/messages/[id]",
          params: { id: r.conversationId, otherUserName: g.name, otherUserId: g.accountId },
        } as any);
        return { ok: true };
      } finally {
        setOpeningGuardian(null);
      }
    },
    [openingGuardian, router],
  );

  // ── Note sheet ────────────────────────────────────────────────────────────
  const openAddNote = useCallback(() => {
    setEditingNote(null);
    setNoteText("");
    setNoteCategory("general");
    setNoteShared(false);
    setPendingAttachments([]);
    noteSheetRef.current?.present();
  }, []);

  const openEditNote = useCallback((note: NoteRecord) => {
    setEditingNote(note);
    setNoteText(note.note_text);
    setNoteCategory(note.category);
    setNoteShared(note.is_shared);
    setPendingAttachments([]);
    noteSheetRef.current?.present();
  }, []);

  const pickImages = useCallback(async (): Promise<WriteResult & { added?: number }> => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return { ok: false, error: "permission" };
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (result.canceled) return { ok: false, canceled: true };
      const stamp = Date.now();
      const items: PendingAttachment[] = await Promise.all(
        result.assets.map(async (a, i) => {
          const compressed = await ImageManipulator.manipulateAsync(a.uri, [{ resize: { width: 1280 } }], {
            compress: 0.75,
            format: ImageManipulator.SaveFormat.JPEG,
          });
          // Unique per image: several picked in the same tick used to collide.
          return { uri: compressed.uri, name: `image_${stamp}_${i + 1}.jpg`, mimeType: "image/jpeg", isImage: true };
        }),
      );
      setPendingAttachments((prev) => [...prev, ...items]);
      return { ok: true, added: items.length };
    } catch (e) {
      notifyError("staff-student-note-pick-image", e);
      return { ok: false };
    }
  }, []);

  const pickFiles = useCallback(async (): Promise<WriteResult & { added?: number }> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
      if (result.canceled) return { ok: false, canceled: true };
      const items: PendingAttachment[] = result.assets.map((a) => ({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType ?? "application/octet-stream",
        isImage: false,
      }));
      setPendingAttachments((prev) => [...prev, ...items]);
      return { ok: true, added: items.length };
    } catch (e) {
      notifyError("staff-student-note-pick-file", e);
      return { ok: false };
    }
  }, []);

  const removePending = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const saveNote = useCallback(
    async (hooks?: { onUploadStart?: (count: number) => void }): Promise<SaveNoteResult> => {
      const text = noteText.trim();
      if (!text || !userId || savingNoteRef.current) return { ok: false, skipped: true };
      savingNoteRef.current = true;
      setSavingNote(true);
      try {
        if (editingNote) {
          const { data, error } = await supabase
            .schema("teachers")
            .from("teacher_notes")
            .update({ note_text: text, category: noteCategory, is_shared: noteShared })
            .eq("id", editingNote.id)
            .select()
            .single();
          if (error || !data) {
            notifyError("staff-student-note-update", error);
            return { ok: false };
          }
          setNotes((prev) =>
            prev.map((n) =>
              n.id === editingNote.id ? { ...n, note_text: text, category: noteCategory, is_shared: noteShared } : n,
            ),
          );
          noteSheetRef.current?.dismiss();
          return { ok: true, edited: true };
        }

        const { data: newNote, error } = await supabase
          .schema("teachers")
          .from("teacher_notes")
          .insert({
            teacher_id: userId,
            student_id: studentId,
            note_text: text,
            category: noteCategory,
            is_shared: noteShared,
          })
          .select()
          .single();
        if (error || !newNote) {
          notifyError("staff-student-note-insert", error);
          return { ok: false };
        }

        const uploaded: NoteAttachment[] = [];
        let failed = 0;
        if (pendingAttachments.length > 0) hooks?.onUploadStart?.(pendingAttachments.length);
        for (const [i, att] of pendingAttachments.entries()) {
          try {
            const filePath = `${userId}/${newNote.id}/${Date.now()}-${i + 1}-${safeFileName(att.name)}`;
            const blob = await (await fetch(att.uri)).blob();
            const { error: upErr } = await supabase.storage
              .from(BUCKET)
              .upload(filePath, blob, { contentType: att.mimeType });
            if (upErr) throw upErr;
            const { data: rec, error: recErr } = await supabase
              .schema("teachers")
              .from("teacher_note_attachments")
              .insert({
                note_id: newNote.id,
                file_name: att.name,
                file_path: filePath,
                file_type: att.isImage ? "image" : "file",
              })
              .select()
              .single();
            if (recErr || !rec) throw recErr;
            const { data: url } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 3600);
            uploaded.push({ ...(rec as NoteAttachment), signed_url: url?.signedUrl });
          } catch (e) {
            failed++;
            notifyError("staff-student-note-attachment", e);
          }
        }

        setNotes((prev) => [{ ...(newNote as NoteRecord), teacher_note_attachments: uploaded }, ...prev]);
        setNotesState("ready");
        noteSheetRef.current?.dismiss();
        return { ok: true, attachmentsFailed: failed };
      } catch (e) {
        notifyError("staff-student-note-save", e);
        return { ok: false };
      } finally {
        savingNoteRef.current = false;
        setSavingNote(false);
      }
    },
    [editingNote, noteCategory, noteShared, noteText, pendingAttachments, studentId, userId],
  );

  const deleteNote = useCallback(
    async (noteId: string): Promise<WriteResult> => {
      if (deletingId) return { ok: false, skipped: true };
      setDeletingId(noteId);
      try {
        const { error } = await supabase
          .schema("teachers")
          .from("teacher_notes")
          .update({ is_deleted: true })
          .eq("id", noteId);
        if (error) {
          notifyError("staff-student-note-delete", error);
          return { ok: false };
        }
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        return { ok: true };
      } catch (e) {
        notifyError("staff-student-note-delete", e);
        return { ok: false };
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId],
  );

  // ── Derived header ────────────────────────────────────────────────────────
  const name = getStudentDisplayName(preferredName, student?.child_legal_name, params.studentName || "Student");
  const programLabel = (() => {
    const raw = (params.program ?? "").replace(/_/g, " ");
    const match = raw.match(/^school year (\d{2}) (\d{2})$/i);
    if (match) return `School Year '${match[1]}-'${match[2]}`;
    return raw.replace(/\b\w/g, (c) => c.toUpperCase());
  })();

  return {
    router,
    studentId,
    student,
    name,
    programLabel,
    loadingDetail,
    detailError,
    activeTab,
    selectTab,
    // Contacts / guardians
    contacts,
    contactsState,
    accountsState,
    guardians,
    openingGuardian,
    messageGuardian,
    // Notes
    notes,
    notesState,
    deletingId,
    deleteNote,
    // Attendance
    attendance,
    // Note sheet
    noteSheetRef,
    editingNote,
    noteText,
    setNoteText,
    noteCategory,
    setNoteCategory,
    noteShared,
    setNoteShared,
    pendingAttachments,
    removePending,
    pickImages,
    pickFiles,
    savingNote,
    openAddNote,
    openEditNote,
    saveNote,
    // Loading
    reload,
    retryDetail,
    retryContacts,
    retryAccounts,
    retryNotes,
  };
}

export type StudentDetailHook = ReturnType<typeof useStudentDetail>;
