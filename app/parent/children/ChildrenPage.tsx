"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { uploadStudentProfileImage } from "@/app/actions/uploadStudentProfileImage";
import { compressImage } from "@/app/utils/compressImage";
import {
  editableToPickupEntries,
  pickupPersonRowToEditable,
  type EditablePickupPerson,
} from "@/app/components/authorized-pickup/PickupPersonForm";
import { saveAuthorizedPickup } from "@/app/actions/saveAuthorizedPickup";
import {
  saveParentLearningNote,
  updateParentLearningNote,
  deleteParentLearningNote,
  type LearningNote,
  type LearningNoteCategory,
} from "@/app/actions/saveParentLearningNote";
import { updateStudentProfile, type ProfileFields } from "@/app/actions/updateStudentProfile";
import type { TeacherAssignment } from "@/app/actions/teacherAssignments";
import PortalShell from "@/app/parent/_garden/PortalShell";
import ChildSwitcher, { type SwitcherChild } from "@/app/parent/_garden/ChildSwitcher";
import { PillTabs } from "@/app/parent/_garden/tabs";
import { EmptyState } from "@/app/parent/_garden/states";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { Arrow, firstNameOf } from "@/app/parent/_garden/ui";
import {
  CATEGORY_META,
  CHILD_TABS,
  PROFILE_SECTIONS,
  SECTION_FIELDS,
  formatProgramLabel,
  parseTab,
  type AuthorizedPickupPerson,
  type AuthorizedPickupPlan,
  type ChildTab,
  type SectionKey,
  type Student,
} from "./garden/childrenData";
import ChildBanner from "./garden/ChildBanner";
import TeacherTab from "./garden/TeacherTab";
import LearningTab, { type SaveOutcome } from "./garden/LearningTab";
import PickupTab, { type PickupState } from "./garden/PickupTab";
import ProfileTab, { ProfileSectionSheet, type SectionDraft } from "./garden/ProfileTab";
import { AttendanceHistory, attendanceNote, useAttendanceHistory } from "./garden/AttendanceHistory";

interface Props {
  students: Student[];
  teachersByStudent: Record<string, TeacherAssignment[]>;
  nonEnrolledAppByStudent: Record<string, string>;
  studentProgramMap: Record<string, string>;
  pickupByStudent: Record<string, { plan: AuthorizedPickupPlan | null; persons: AuthorizedPickupPerson[] }>;
  notesByStudent: Record<string, LearningNote[]>;
  /** A dashboard-access grantee: edit controls are hidden (as before). */
  isSharedAccess?: boolean;
  /** Admin "view as parent": everything renders, writes are blocked with the Preview toast. */
  readOnlyPreview?: boolean;
  /** Where the Photos card links (the admin preview has its own route). */
  photosHref?: string;
}

const PANEL_ID = "child-tab-panel";

export default function ChildrenPage(props: Props) {
  return (
    <PortalShell>
      <ChildrenContent {...props} />
    </PortalShell>
  );
}

function withCacheBust(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}

function ChildrenContent({
  students: initialStudents,
  teachersByStudent,
  nonEnrolledAppByStudent,
  studentProgramMap,
  pickupByStudent,
  notesByStudent,
  isSharedAccess,
  readOnlyPreview,
  photosHref = "/parent/photos",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const { runSave, blockedByPreview } = usePortalFeedback(readOnlyPreview);
  const canEdit = !isSharedAccess;
  const browse = readOnlyPreview ? "pointer-events-auto" : "";

  // ─── Page-level state, keyed by student id ─────────────────────────────────
  // Lives above the tabs so switching tabs or children never resets it.
  const [studentsById, setStudentsById] = useState<Record<string, Student>>(() =>
    Object.fromEntries(initialStudents.map((s) => [s.id, s])),
  );
  const [notesById, setNotesById] = useState<Record<string, LearningNote[]>>(() => ({ ...notesByStudent }));
  const [pickupById, setPickupById] = useState<Record<string, PickupState>>(() =>
    Object.fromEntries(
      initialStudents.map((s) => {
        const p = pickupByStudent[s.id];
        return [s.id, { plan: p?.plan ?? null, persons: (p?.persons ?? []).map(pickupPersonRowToEditable) }];
      }),
    ),
  );
  // The request dates sent with every pickup save, from the page-load plan (unchanged behaviour).
  const [pickupDates] = useState<Record<string, { dateOfRequest: string; effectiveUntil: string }>>(() =>
    Object.fromEntries(
      initialStudents.map((s) => {
        const plan = pickupByStudent[s.id]?.plan;
        return [s.id, { dateOfRequest: plan?.date_of_request ?? "", effectiveUntil: plan?.effective_until ?? "" }];
      }),
    ),
  );
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [noteBusyId, setNoteBusyId] = useState<string | null>(null);
  const [pickupBusyKey, setPickupBusyKey] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);

  // Retries from toasts run later; they read the latest pickup list from here.
  const pickupRef = useRef(pickupById);
  useEffect(() => {
    pickupRef.current = pickupById;
  }, [pickupById]);

  // Enrolled children first, non-enrolled last (as before).
  const sortedChildren = useMemo(
    () =>
      initialStudents
        .map((s) => studentsById[s.id] ?? s)
        .sort((a, b) => {
          const aEnrolled = !nonEnrolledAppByStudent[a.id];
          const bEnrolled = !nonEnrolledAppByStudent[b.id];
          if (aEnrolled === bEnrolled) return 0;
          return aEnrolled ? -1 : 1;
        }),
    [initialStudents, studentsById, nonEnrolledAppByStudent],
  );

  // ─── URL state: ?studentId= & ?tab= (validated) ────────────────────────────
  const rawTab = searchParams.get("tab");
  const rawStudent = searchParams.get("studentId");
  const tab = parseTab(rawTab);
  const activeId = sortedChildren.find((s) => s.id === rawStudent)?.id ?? sortedChildren[0]?.id ?? null;

  // Shallow URL update: Next.js syncs `history.replaceState` with useSearchParams without
  // re-running the server page (router.replace would refetch all the page data per click).
  const writeParams = useCallback((patch: Record<string, string>) => {
    const sp = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) sp.set(k, v);
    window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
  }, []);

  // Normalise an invalid ?tab= / ?studentId= once (e.g. the retired "photos" tab).
  useEffect(() => {
    const patch: Record<string, string> = {};
    if (rawTab !== null && rawTab !== tab) patch.tab = tab;
    if (rawStudent !== null && activeId && rawStudent !== activeId) patch.studentId = activeId;
    if (Object.keys(patch).length) writeParams(patch);
  }, [rawTab, rawStudent, tab, activeId, writeParams]);

  const selectTab = (t: ChildTab) => writeParams({ tab: t, ...(activeId ? { studentId: activeId } : {}) });
  const selectChild = (id: string) => writeParams({ studentId: id, tab });

  // On phones the tab rail scrolls sideways: keep the selected tab (and chip) in view without moving the page.
  const railsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    railsRef.current?.querySelectorAll<HTMLElement>('[role="tablist"]').forEach((list) => {
      const sel = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!sel || list.scrollWidth <= list.clientWidth) return;
      const left = sel.offsetLeft - list.offsetLeft;
      if (left < list.scrollLeft || left + sel.offsetWidth > list.scrollLeft + list.clientWidth) {
        list.scrollTo({ left: Math.max(0, left - 24), behavior: reduce ? "auto" : "smooth" });
      }
    });
  }, [tab, activeId, reduce]);

  const child = activeId ? studentsById[activeId] : null;
  const att = useAttendanceHistory(activeId, tab === "attendance" && !!activeId && !nonEnrolledAppByStudent[activeId]);

  // ─── Writes (all through runSave) ──────────────────────────────────────────
  async function uploadPhoto(studentId: string, file: File) {
    setUploadingId(studentId);
    await runSave({
      loadingTitle: "Uploading photo…",
      successTitle: "Photo updated",
      errorTitle: "Photo didn't upload",
      retry: () => void uploadPhoto(studentId, file),
      fn: async () => {
        const compressed = await compressImage(file, { maxDimension: 400 });
        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("studentId", studentId);
        const result = await uploadStudentProfileImage(formData);
        if ("error" in result) return { ok: false, error: result.error };
        // Same storage path every time, so bust the cache or the old photo keeps showing.
        const url = withCacheBust(result.url);
        setStudentsById((prev) => ({ ...prev, [studentId]: { ...prev[studentId], profile_image_url: url } }));
        return { ok: true };
      },
    });
    setUploadingId(null);
  }

  async function saveNote(studentId: string, d: { noteId: string | null; category: LearningNoteCategory; text: string }): Promise<SaveOutcome> {
    let error: string | undefined;
    const ok = await runSave({
      successTitle: d.noteId ? "Request updated" : "Special request added",
      successMessage: CATEGORY_META[d.category].label,
      errorTitle: "Couldn't save your request",
      fn: async () => {
        const result = d.noteId
          ? await updateParentLearningNote({ noteId: d.noteId, category: d.category, noteText: d.text })
          : await saveParentLearningNote({ studentId, category: d.category, noteText: d.text });
        if (result.error) {
          error = result.error;
          return { ok: false, error: result.error };
        }
        const note = result.note;
        if (note) {
          setNotesById((prev) => {
            const list = prev[studentId] ?? [];
            return { ...prev, [studentId]: d.noteId ? list.map((n) => (n.id === d.noteId ? note : n)) : [note, ...list] };
          });
        }
        return { ok: true };
      },
    });
    return { ok, error };
  }

  async function deleteNote(studentId: string, note: LearningNote): Promise<boolean> {
    if (noteBusyId) return false;
    setNoteBusyId(note.id);
    const ok = await runSave({
      successTitle: "Request removed",
      errorTitle: "Couldn't remove that request",
      retry: () => void deleteNote(studentId, note),
      fn: async () => {
        const result = await deleteParentLearningNote(note.id);
        if (result.error) return { ok: false, error: result.error };
        setNotesById((prev) => ({ ...prev, [studentId]: (prev[studentId] ?? []).filter((n) => n.id !== note.id) }));
        return { ok: true };
      },
    });
    setNoteBusyId(null);
    return ok;
  }

  /** Saves the whole list with `saveAuthorizedPickup` (same payload as before) and updates state on success. */
  async function commitPickup(
    studentId: string,
    busyKey: string,
    build: (persons: EditablePickupPerson[]) => EditablePickupPerson[],
    copy: { successTitle: string; successMessage?: string; errorTitle: string; retry?: () => void },
  ): Promise<SaveOutcome> {
    if (pickupBusyKey) return { ok: false };
    const current = pickupRef.current[studentId] ?? { plan: null, persons: [] };
    const updated = build(current.persons);
    const dates = pickupDates[studentId] ?? { dateOfRequest: "", effectiveUntil: "" };
    let error: string | undefined;
    setPickupBusyKey(busyKey);
    const ok = await runSave({
      ...copy,
      fn: async () => {
        const result = await saveAuthorizedPickup({
          studentId,
          dateOfRequest: dates.dateOfRequest || new Date().toISOString().slice(0, 10),
          effectiveUntil: dates.effectiveUntil || "",
          persons: editableToPickupEntries(updated),
        });
        if (result.error) {
          error = result.error;
          return { ok: false, error: result.error };
        }
        setPickupById((prev) => ({
          ...prev,
          [studentId]: { plan: result.data ?? prev[studentId]?.plan ?? null, persons: updated },
        }));
        return { ok: true };
      },
    });
    setPickupBusyKey(null);
    return { ok, error };
  }

  function savePerson(studentId: string, p: EditablePickupPerson, mode: "add" | "edit") {
    const name = p.fullName.trim();
    return commitPickup(
      studentId,
      mode === "add" ? "new" : p._key,
      (persons) => (mode === "add" ? [...persons, p] : persons.map((x) => (x._key === p._key ? p : x))),
      mode === "add"
        ? { successTitle: `${name} added`, successMessage: "Pickup list saved", errorTitle: "Couldn't add that person" }
        : { successTitle: "Pickup list saved", successMessage: `${name} updated`, errorTitle: "Couldn't save pickup changes" },
    );
  }

  async function removePerson(studentId: string, p: EditablePickupPerson): Promise<boolean> {
    const r = await commitPickup(studentId, p._key, (persons) => persons.filter((x) => x._key !== p._key), {
      successTitle: "Pickup list saved",
      successMessage: `${p.fullName} removed`,
      errorTitle: `Couldn't remove ${p.fullName}`,
      retry: () => void removePerson(studentId, p),
    });
    return r.ok;
  }

  async function saveSection(studentId: string, section: SectionKey, draft: SectionDraft): Promise<SaveOutcome> {
    const payload: ProfileFields = {};
    for (const key of SECTION_FIELDS[section]) payload[key] = draft[key]?.trim() || null;
    let error: string | undefined;
    const ok = await runSave({
      successTitle: PROFILE_SECTIONS[section].successTitle,
      errorTitle: "Couldn't save changes",
      fn: async () => {
        const result = await updateStudentProfile(studentId, payload);
        if (result.error) {
          error = result.error;
          return { ok: false, error: result.error };
        }
        setStudentsById((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...payload } }));
        return { ok: true };
      },
    });
    return { ok, error };
  }

  function messageTeacher(t: TeacherAssignment) {
    if (blockedByPreview() || !activeId) return false;
    router.push(
      `/parent/messages?studentId=${activeId}&recipientId=${t.teacher_id}&recipientName=${encodeURIComponent(t.teacher_name ?? "")}`,
    );
    return true;
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  if (sortedChildren.length === 0 || !child || !activeId) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
        <h1 className="sf-display mb-6 text-[2.6rem] leading-none sm:text-[3.2rem]">My Children</h1>
        <EmptyState emoji="🌱" title="No enrolled children found." body="If you believe this is an error, please contact us." />
      </div>
    );
  }

  const switcherItems: SwitcherChild[] = sortedChildren.map((s, i) => ({
    id: s.id,
    name: s.child_legal_name ?? `Child ${i + 1}`,
    imageUrl: s.profile_image_url,
    sub: formatProgramLabel(studentProgramMap[s.id]) ?? s.child_grade,
    attention: !!nonEnrolledAppByStudent[s.id],
    attentionLabel: "Enrollment not complete",
  }));
  const multiple = sortedChildren.length > 1;
  const enrollmentAppId = nonEnrolledAppByStudent[activeId];
  const first = firstNameOf(child.child_legal_name ?? "");
  const tabLabel = CHILD_TABS.find((t) => t.value === tab)?.label ?? "";
  const notes = notesById[activeId] ?? [];
  const pickup = pickupById[activeId] ?? { plan: null, persons: [] };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
      <h1 className="sf-display text-[2.6rem] leading-none sm:text-[3.2rem]">My Children</h1>
      {multiple ? (
        <p className="sf-hand mt-1.5 text-lg leading-tight text-[var(--sf-sage-deep)]">
          {sortedChildren.length} little ones · pick a child to see their day
        </p>
      ) : null}

      <div className={`mt-8 ${multiple ? "lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10" : ""}`}>
        {multiple ? (
          <aside className={`hidden lg:block ${browse}`} aria-label="Your children">
            <ChildSwitcher items={switcherItems} activeId={activeId} onChange={selectChild} variant="cards" label="Choose a child" controls={PANEL_ID} />
          </aside>
        ) : null}

        <div ref={railsRef} className="flex min-w-0 flex-col gap-7">
          {multiple ? (
            <div className={`lg:hidden ${browse}`}>
              <ChildSwitcher items={switcherItems} activeId={activeId} onChange={selectChild} variant="chips" label="Choose a child" controls={PANEL_ID} className="no-scrollbar" />
            </div>
          ) : null}

          <ChildBanner
            key={activeId}
            student={child}
            imageUrl={child.profile_image_url}
            program={studentProgramMap[activeId]}
            canChangePhoto={canEdit}
            uploading={uploadingId === activeId}
            onBeforePick={() => !blockedByPreview()}
            onPickPhoto={(file) => void uploadPhoto(activeId, file)}
          />

          {enrollmentAppId ? (
            <a
              href={`/parent/dashboard?app=${enrollmentAppId}`}
              className="group flex flex-col gap-3 rounded-[28px] bg-[var(--sf-butter)]/70 px-6 py-5 no-underline transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] sm:flex-row sm:items-center"
            >
              <span className="text-3xl" aria-hidden="true">
                📝
              </span>
              <span className="min-w-0 flex-1">
                <span className="sf-display block text-2xl leading-tight text-[var(--sf-ink)]">Enrollment not complete</span>
                <span className="mt-1 block text-sm font-semibold text-[#7a5b00]">
                  Finish setting up this child&apos;s enrollment to access teacher info, attendance, and more.
                </span>
              </span>
              <span className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-full bg-[var(--sf-ink)] px-5 text-sm font-extrabold text-white shadow-[0_4px_0_0_#000] sm:self-auto">
                Complete enrollment <Arrow />
              </span>
            </a>
          ) : (
            <>
              <div className={browse}>
                <PillTabs
                  className="no-scrollbar"
                  label={`${first}'s details`}
                  value={tab}
                  onChange={selectTab}
                  options={CHILD_TABS.map((t) => ({ value: t.value, label: t.label, icon: t.icon, controls: PANEL_ID }))}
                />
              </div>

              <motion.div
                key={`${activeId}-${tab}`}
                id={PANEL_ID}
                role="tabpanel"
                aria-label={`${first} · ${tabLabel}`}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="min-w-0"
              >
                {tab === "teacher" ? <TeacherTab teachers={teachersByStudent[activeId] ?? []} onMessage={messageTeacher} /> : null}

                {tab === "attendance" ? (
                  <div className={browse}>
                    <AttendanceHistory
                      att={att}
                      heading={
                        <div>
                          <h3 className="sf-display text-2xl leading-tight">{first}&apos;s Attendance</h3>
                          {attendanceNote(att) ? (
                            <p className="sf-hand mt-0.5 text-lg leading-tight text-[var(--sf-sage-deep)]">{attendanceNote(att)}</p>
                          ) : null}
                        </div>
                      }
                    />
                  </div>
                ) : null}

                {tab === "learning" ? (
                  <LearningTab
                    student={child}
                    notes={notes}
                    canEdit={canEdit}
                    busyNoteId={noteBusyId}
                    blockedByPreview={blockedByPreview}
                    onSaveNote={(d) => saveNote(activeId, d)}
                    onDeleteNote={(n) => deleteNote(activeId, n)}
                    onEditProfile={() => {
                      if (!blockedByPreview()) setEditingSection("learning");
                    }}
                  />
                ) : null}

                {tab === "pickup" ? (
                  <PickupTab
                    pickup={pickup}
                    canEdit={canEdit}
                    busyKey={pickupBusyKey}
                    blockedByPreview={blockedByPreview}
                    onSavePerson={(p, mode) => savePerson(activeId, p, mode)}
                    onRemovePerson={(p) => removePerson(activeId, p)}
                  />
                ) : null}

                {tab === "profile" ? (
                  <ProfileTab
                    student={child}
                    canEdit={canEdit}
                    onEdit={(k) => {
                      if (!blockedByPreview()) setEditingSection(k);
                    }}
                  />
                ) : null}
              </motion.div>
            </>
          )}

          <Link
            href={photosHref}
            className={`group flex items-center gap-4 rounded-[28px] bg-[var(--sf-sky)]/70 px-5 py-4 no-underline transition hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sage)] ${browse}`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl" aria-hidden="true">
              📸
            </span>
            <span className="min-w-0 flex-1">
              <span className="sf-display block text-xl leading-tight text-[var(--sf-ink)]">Photos</span>
              <span className="block text-sm font-semibold text-[#2d5d86]">Photos from school activities and events</span>
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--sf-ink)] transition group-hover:translate-x-0.5" aria-hidden="true">
              <Arrow className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>

      <ProfileSectionSheet
        key={activeId}
        student={child}
        section={editingSection}
        onClose={() => setEditingSection(null)}
        onSave={(section, draft) => saveSection(activeId, section, draft)}
      />
    </div>
  );
}
