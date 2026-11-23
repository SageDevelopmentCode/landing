"use client";

import { useState } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";
import { PROFILE_SECTIONS, SECTION_FIELDS, type ProfileFieldKey, type SectionKey, type Student } from "./childrenData";
import { InfoRow, InlineError, SectionCard, SheetSaveFooter, TextArea, YesNoField } from "./fields";
import type { SaveOutcome } from "./LearningTab";

export type SectionDraft = Partial<Record<ProfileFieldKey, string>>;

export function draftFor(student: Student, section: SectionKey): SectionDraft {
  return Object.fromEntries(SECTION_FIELDS[section].map((f) => [f, student[f] ?? ""]));
}

/** Read view for one section: yes/no answers show their description only when "yes" (as before). */
function SectionRows({ student, section }: { student: Student; section: SectionKey }) {
  return (
    <dl>
      {PROFILE_SECTIONS[section].fields.map((f) =>
        f.kind === "text" ? (
          <InfoRow key={f.key} label={f.label} value={student[f.key]} />
        ) : (
          <div key={f.key}>
            <InfoRow label={f.label} value={student[f.key]} />
            {student[f.key]?.toLowerCase() === "yes" ? (
              <InfoRow label={f.detail.viewLabel} value={student[f.detail.key]} />
            ) : null}
          </div>
        ),
      )}
    </dl>
  );
}

export default function ProfileTab({
  student,
  canEdit,
  onEdit,
}: {
  student: Student;
  canEdit: boolean;
  onEdit: (s: SectionKey) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {(Object.keys(PROFILE_SECTIONS) as SectionKey[]).map((k) => (
        <SectionCard
          key={k}
          emoji={PROFILE_SECTIONS[k].emoji}
          title={PROFILE_SECTIONS[k].title}
          onEdit={canEdit ? () => onEdit(k) : undefined}
          editLabel={`Edit ${PROFILE_SECTIONS[k].title}`}
        >
          <SectionRows student={student} section={k} />
        </SectionCard>
      ))}
    </div>
  );
}

/** "Edit Medical Info" etc. Same fields and `updateStudentProfile` payload as the old inline editors. */
export function ProfileSectionSheet({
  student,
  section,
  onClose,
  onSave,
}: {
  student: Student;
  section: SectionKey | null;
  onClose: () => void;
  onSave: (section: SectionKey, draft: SectionDraft) => Promise<SaveOutcome>;
}) {
  const [shown, setShown] = useState<SectionKey | null>(section);
  const [seed, setSeed] = useState<SectionKey | null>(section);
  const [draft, setDraft] = useState<SectionDraft>(() => (section ? draftFor(student, section) : {}));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (section !== seed) {
    setSeed(section);
    if (section) {
      setShown(section);
      setDraft(draftFor(student, section));
      setError(null);
    }
  }

  const meta = shown ? PROFILE_SECTIONS[shown] : null;
  const original = shown ? draftFor(student, shown) : {};
  const changed = shown ? SECTION_FIELDS[shown].filter((f) => (draft[f] ?? "") !== (original[f] ?? "")).length : 0;
  const set = (key: ProfileFieldKey) => (v: string) => setDraft((d) => ({ ...d, [key]: v }));

  async function submit() {
    if (!shown || busy || changed === 0) return;
    setBusy(true);
    setError(null);
    const r = await onSave(shown, draft);
    setBusy(false);
    if (r.ok) onClose();
    else if (r.error) setError(r.error);
  }

  return (
    <GardenSheet
      open={!!section}
      onClose={() => {
        if (!busy) onClose();
      }}
      icon={meta?.emoji}
      title={meta ? `Edit ${meta.title}` : ""}
      footer={
        <SheetSaveFooter
          label="Save Changes"
          busy={busy}
          disabled={changed === 0}
          onClick={() => void submit()}
          status={changed === 0 ? "No changes yet" : changed === 1 ? "1 unsaved change" : `${changed} unsaved changes`}
        />
      }
    >
      {meta ? (
        <div className="flex flex-col gap-5 pt-2">
          {meta.fields.map((f, i) =>
            f.kind === "text" ? (
              <TextArea key={f.key} label={f.label} value={draft[f.key] ?? ""} onChange={set(f.key)} autoFocus={i === 0} />
            ) : (
              <div key={f.key} className="flex flex-col gap-3 rounded-[22px] bg-white/70 p-4 ring-1 ring-[var(--sf-ink)]/[0.06]">
                <YesNoField label={f.label} value={draft[f.key] ?? ""} onChange={set(f.key)} />
                {draft[f.key] === "yes" ? (
                  <TextArea label={f.detail.label} value={draft[f.detail.key] ?? ""} onChange={set(f.detail.key)} />
                ) : null}
              </div>
            ),
          )}
          <InlineError>{error}</InlineError>
        </div>
      ) : null}
    </GardenSheet>
  );
}
