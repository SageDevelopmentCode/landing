"use client";

import { useMemo, useState } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";
import { RadioCardGroup } from "@/app/parent/_garden/fields";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { KidAvatar, Spinner, StepLabel, btnSheetPrimary, firstNameOf } from "@/app/parent/_garden/ui";
import {
  saveSchoolDayFoodPreferences,
  type EmergencySnackPreference,
  type SharedFoodPreference,
} from "@/app/actions/schoolDayFoodPreferences";
import type { PreferenceChild, SchoolDayFoodPreference } from "../page";
import { EMERGENCY_SNACK_OPTIONS, SHARED_FOOD_OPTIONS } from "./foodOptions";

type Draft = { snack: EmergencySnackPreference | null; shared: SharedFoodPreference | null };

const SNACK_CARDS = EMERGENCY_SNACK_OPTIONS.map((o) => ({ value: o.value, emoji: o.emoji, title: o.label }));
const SHARED_CARDS = SHARED_FOOD_OPTIONS.map((o) => ({ value: o.value, emoji: o.emoji, title: o.label }));

/**
 * School Day Food Preferences: two single-choice questions for one child.
 * Opens for `initialStudentId`, else the first child still missing answers. It can't close while saving.
 */
export default function FoodPreferencesSheet({
  open,
  onClose,
  students,
  savedPreferences,
  initialStudentId,
  onSaved,
  readOnlyPreview,
}: {
  open: boolean;
  onClose: () => void;
  students: PreferenceChild[];
  savedPreferences: SchoolDayFoodPreference[];
  initialStudentId?: string | null;
  onSaved: (pref: SchoolDayFoodPreference) => void;
  readOnlyPreview?: boolean;
}) {
  const { runSave } = usePortalFeedback(readOnlyPreview);

  const savedByStudent = useMemo(
    () => Object.fromEntries(savedPreferences.map((p) => [p.student_id, p])) as Record<string, SchoolDayFoodPreference>,
    [savedPreferences],
  );
  const missingStudentIds = students.filter((s) => !savedByStudent[s.id]).map((s) => s.id);

  const activeStudentId = open ? (initialStudentId ?? missingStudentIds[0] ?? students[0]?.id ?? null) : null;
  const activeStudent = students.find((s) => s.id === activeStudentId) ?? null;
  const existing = activeStudentId ? savedByStudent[activeStudentId] : undefined;

  const [draft, setDraft] = useState<Draft>({ snack: null, shared: null });
  const [draftFor, setDraftFor] = useState<string | null>(null);
  // Reset the answers each time the sheet opens for a child.
  if (activeStudentId !== draftFor) {
    setDraftFor(activeStudentId);
    if (activeStudentId) {
      setDraft({ snack: existing?.emergency_snack_preference ?? null, shared: existing?.shared_food_preference ?? null });
    }
  }

  const [saving, setSaving] = useState(false);
  const answered = (draft.snack ? 1 : 0) + (draft.shared ? 1 : 0);
  const canSave = !!activeStudentId && !!draft.snack && !!draft.shared && !saving;
  const showMaybeLater = missingStudentIds.length > 0;

  function close() {
    if (saving) return;
    onClose();
  }

  async function save() {
    if (!activeStudentId || !draft.snack || !draft.shared || saving) return;
    const studentId = activeStudentId;
    const emergencySnack = draft.snack;
    const sharedFood = draft.shared;
    const childName = activeStudent ? firstNameOf(activeStudent.child_legal_name) : "";
    setSaving(true);
    let ok = false;
    try {
      ok = await runSave({
        successTitle: "Preferences saved",
        successMessage: childName ? `School Day Food Preferences · ${childName}` : "School Day Food Preferences",
        errorTitle: "Couldn't save food preferences",
        retry: () => void save(),
        fn: async () => {
          const result = await saveSchoolDayFoodPreferences(studentId, { emergencySnack, sharedFood });
          return { ok: !result.error, error: result.error };
        },
      });
    } finally {
      setSaving(false);
    }
    if (!ok) return;
    onSaved({ student_id: studentId, emergency_snack_preference: emergencySnack, shared_food_preference: sharedFood });
    onClose();
  }

  return (
    <GardenSheet
      open={open}
      onClose={close}
      title="School Day Food Preferences"
      icon="🍎"
      note={`${answered} of 2 answered`}
      toolbar={
        students.length > 1 && activeStudent ? (
          <div className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-4 text-sm font-extrabold ring-1 ring-[var(--sf-ink)]/10">
            <KidAvatar id={activeStudent.id} name={activeStudent.child_legal_name} imageUrl={activeStudent.profile_image_url} size="h-9 w-9 text-xs" />
            <span className="truncate">{activeStudent.child_legal_name}</span>
          </div>
        ) : null
      }
      footer={
        <div className="flex flex-col gap-1">
          <button type="button" className={btnSheetPrimary} onClick={() => void save()} disabled={!canSave} aria-busy={saving || undefined}>
            {saving ? <Spinner /> : null}
            {saving ? "Saving…" : "Save Preferences"}
          </button>
          {showMaybeLater ? (
            <button
              type="button"
              onClick={close}
              disabled={saving}
              className="flex min-h-11 w-full items-center justify-center rounded-full text-sm font-bold text-[var(--sf-soft)] transition hover:text-[var(--sf-ink)] focus-visible:text-[var(--sf-ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] disabled:opacity-50 cursor-pointer"
            >
              Maybe later
            </button>
          ) : null}
          <p className="text-center text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
            {answered < 2 && !saving ? "Answer both questions to save." : null}
          </p>
        </div>
      }
    >
      <p className="rounded-[20px] bg-[var(--sf-butter)]/60 px-4 py-3 text-[15px] font-semibold leading-relaxed text-[var(--sf-ink)]">
        🍎 Snacks &amp; shared food during the school day — saved to your child&apos;s profile. Update anytime.
      </p>

      <section className="mt-6">
        <StepLabel n={1} done={!!draft.snack}>
          🚨 Emergency snacks
        </StepLabel>
        <RadioCardGroup
          legend="If their planned snack isn't available:"
          options={SNACK_CARDS}
          value={draft.snack}
          onChange={(v) => setDraft((d) => ({ ...d, snack: v }))}
          disabled={saving}
        />
      </section>

      <section className="mt-7">
        <StepLabel n={2} done={!!draft.shared}>
          🎁 Shared classroom food
        </StepLabel>
        <RadioCardGroup
          legend="Birthday treats, celebrations, or food from other families:"
          options={SHARED_CARDS}
          value={draft.shared}
          onChange={(v) => setDraft((d) => ({ ...d, shared: v }))}
          disabled={saving}
        />
      </section>
    </GardenSheet>
  );
}
