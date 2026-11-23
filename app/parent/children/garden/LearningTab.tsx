"use client";

import { useId, useState } from "react";
import type { LearningNote, LearningNoteCategory } from "@/app/actions/saveParentLearningNote";
import GardenSheet from "@/app/parent/_garden/sheet";
import ConfirmDialog from "@/app/parent/_garden/ConfirmDialog";
import { EmptyState } from "@/app/parent/_garden/states";
import { StepLabel, TINT_BG, TINT_FG, btnSageSm } from "@/app/parent/_garden/ui";
import { CATEGORY_META, NOTE_CATEGORIES, type Student } from "./childrenData";
import { IconButton, InfoRow, InlineError, PencilIcon, SectionCard, SheetSaveFooter, TextArea, TrashIcon } from "./fields";

export type SaveOutcome = { ok: boolean; error?: string };

type NoteDraft = { noteId: string | null; category: LearningNoteCategory; text: string };

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  );
}

function CategoryPicker({ value, onChange }: { value: LearningNoteCategory; onChange: (c: LearningNoteCategory) => void }) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-2">
      {NOTE_CATEGORIES.map((k) => {
        const meta = CATEGORY_META[k];
        const on = value === k;
        return (
          <label
            key={k}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-extrabold transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[var(--sf-sky)] ${
              on ? "bg-[var(--sf-ink)] text-white shadow-[0_3px_0_0_#000]" : `${TINT_BG[meta.tint]} ${TINT_FG[meta.tint]} hover:-translate-y-0.5`
            }`}
          >
            <input type="radio" name={name} value={k} checked={on} onChange={() => onChange(k)} className="sr-only" />
            <span aria-hidden="true">{meta.emoji}</span>
            {meta.label}
          </label>
        );
      })}
    </div>
  );
}

function NoteSheet({
  draft,
  original,
  onClose,
  onSave,
}: {
  draft: NoteDraft | null;
  original: NoteDraft | null;
  onClose: () => void;
  onSave: (d: NoteDraft) => Promise<SaveOutcome>;
}) {
  // The sheet keeps its own copy of the draft; `draft` seeds it when it opens.
  const [local, setLocal] = useState<NoteDraft | null>(draft);
  const [seed, setSeed] = useState<NoteDraft | null>(draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (draft !== seed) {
    setSeed(draft);
    // Keep the last draft while the sheet animates out.
    if (draft) {
      setLocal(draft);
      setError(null);
    }
  }

  const isEdit = !!local?.noteId;
  const dirty = !!local && (!original || local.category !== original.category || local.text !== original.text);
  const canSave = !!local && !!local.text.trim() && dirty;

  async function submit() {
    if (!local || !canSave || busy) return;
    setBusy(true);
    setError(null);
    const r = await onSave(local);
    setBusy(false);
    if (r.ok) onClose();
    else if (r.error) setError(r.error);
  }

  return (
    <GardenSheet
      open={!!draft}
      onClose={() => {
        if (!busy) onClose();
      }}
      icon="📝"
      title={isEdit ? "Edit Request" : "Add Special Request"}
      note={isEdit ? "tweak it and save" : "teachers will see this"}
      footer={
        <SheetSaveFooter
          label={isEdit ? "Save Changes" : "Save Request"}
          busy={busy}
          disabled={!canSave}
          onClick={() => void submit()}
          status={!local?.text.trim() ? "Write your request to save it" : dirty ? "Unsaved changes" : "No changes yet"}
        />
      }
    >
      {local ? (
        <div className="flex flex-col gap-6 pt-2">
          <div>
            <StepLabel n={1} done>
              Pick a category
            </StepLabel>
            <CategoryPicker value={local.category} onChange={(category) => setLocal({ ...local, category })} />
          </div>
          <div>
            <StepLabel n={2} done={!!local.text.trim()}>
              Your request
            </StepLabel>
            <TextArea
              label={<span className="sr-only">Note</span>}
              rows={5}
              autoFocus
              placeholder="e.g. My child is needing extra help with reading comprehension this month."
              value={local.text}
              onChange={(text) => setLocal({ ...local, text })}
            />
          </div>
          <InlineError>{error}</InlineError>
        </div>
      ) : null}
    </GardenSheet>
  );
}

export default function LearningTab({
  student,
  notes,
  canEdit,
  busyNoteId,
  onSaveNote,
  onDeleteNote,
  onEditProfile,
  blockedByPreview,
}: {
  student: Student;
  notes: LearningNote[];
  canEdit: boolean;
  /** Note being removed (per-row spinner). */
  busyNoteId: string | null;
  onSaveNote: (d: { noteId: string | null; category: LearningNoteCategory; text: string }) => Promise<SaveOutcome>;
  onDeleteNote: (n: LearningNote) => Promise<boolean>;
  onEditProfile: () => void;
  blockedByPreview: () => boolean;
}) {
  const [draft, setDraft] = useState<NoteDraft | null>(null);
  const [original, setOriginal] = useState<NoteDraft | null>(null);
  const [confirming, setConfirming] = useState<LearningNote | null>(null);
  const deletingId = busyNoteId;

  const hasProfile = student.learning_style || student.strengths_interests || student.current_challenges;

  function openNew() {
    if (blockedByPreview()) return;
    const d = { noteId: null, category: "academic" as const, text: "" };
    setOriginal(null);
    setDraft(d);
  }
  function openEdit(n: LearningNote) {
    if (blockedByPreview()) return;
    const d = { noteId: n.id, category: n.category, text: n.note_text };
    setOriginal(d);
    setDraft(d);
  }
  function askDelete(n: LearningNote) {
    if (blockedByPreview()) return;
    setConfirming(n);
  }
  async function confirmDelete() {
    const n = confirming;
    if (!n) return;
    // Close either way: a failure shows an error toast with "Try again".
    await onDeleteNote(n);
    setConfirming(null);
  }

  return (
    <div className="flex flex-col gap-8">
      {hasProfile ? (
        <SectionCard emoji="🎨" title="Learning Profile" onEdit={canEdit ? onEditProfile : undefined} editLabel="Edit Learning Profile">
          <dl>
            <InfoRow label="Learning Style" value={student.learning_style} />
            <InfoRow label="Strengths & Interests" value={student.strengths_interests} />
            <InfoRow label="Current Challenges" value={student.current_challenges} />
          </dl>
        </SectionCard>
      ) : null}

      <section aria-labelledby="special-requests">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 id="special-requests" className="sf-display text-2xl leading-tight">
            Special Requests{notes.length > 0 ? ` (${notes.length})` : ""}
          </h3>
          {canEdit && notes.length > 0 ? (
            <button type="button" onClick={openNew} className={btnSageSm}>
              <PlusIcon />
              Add Note
            </button>
          ) : null}
        </div>

        {notes.length === 0 ? (
          <EmptyState
            emoji="📝"
            tint="sky"
            title="No special requests yet."
            body="Let teachers know if your child needs any extra support."
            action={
              canEdit ? (
                <button type="button" onClick={openNew} className={btnSageSm}>
                  <PlusIcon />
                  Add Note
                </button>
              ) : null
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => {
              const meta = CATEGORY_META[note.category] ?? CATEGORY_META.other;
              const date = new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <li key={note.id} className={`flex items-start gap-3 rounded-[24px] px-5 py-4 ${TINT_BG[meta.tint]}`}>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-extrabold ${TINT_FG[meta.tint]}`}>
                        <span aria-hidden="true">{meta.emoji}</span>
                        {meta.label}
                      </span>
                      <span className="text-xs font-bold text-[var(--sf-soft)]">{date}</span>
                    </div>
                    <p className="whitespace-pre-line text-[15px] font-semibold leading-relaxed text-[var(--sf-ink)]">{note.note_text}</p>
                  </div>
                  {canEdit ? (
                    <div className="-mr-2 -mt-1 flex shrink-0 flex-col">
                      <IconButton label="Edit request" onClick={() => openEdit(note)} disabled={deletingId === note.id}>
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="Remove request" tone="coral" onClick={() => askDelete(note)} busy={deletingId === note.id}>
                        <TrashIcon />
                      </IconButton>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <NoteSheet
        draft={draft}
        original={original}
        onClose={() => setDraft(null)}
        onSave={onSaveNote}
      />
      <ConfirmDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => void confirmDelete()}
        title="Remove this request?"
        body="It will be removed from your special requests."
        confirmLabel="Remove"
        busyLabel="Removing…"
        busy={!!confirming && deletingId === confirming.id}
      />
    </div>
  );
}
