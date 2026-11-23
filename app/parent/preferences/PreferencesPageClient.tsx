"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Activity } from "@/app/actions/activities";
import { saveActivityPreferences, type PreferenceEntry } from "@/app/actions/preferences";
import { saveStudentDefaultPreference } from "@/app/actions/studentDefaultPreferences";
import { ALLERGEN_DISCLAIMER } from "@/shared/parent/activity-preferences";
import PortalShell from "@/app/parent/_garden/PortalShell";
import { CheckboxRow, FieldError } from "@/app/parent/_garden/fields";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { useUnsavedGuard } from "@/app/parent/_garden/unsaved";
import { EmptyState, SkeletonList } from "@/app/parent/_garden/states";
import { useNow } from "@/app/parent/_garden/time";
import { toYmd } from "@/app/parent/_garden/format";
import { SectionHeader, firstNameOf } from "@/app/parent/_garden/ui";
import type { PreferenceChild, SavedPreference, StudentDefaultPreference, SchoolDayFoodPreference } from "./page";
import PrefsChildTabs from "./garden/PrefsChildTabs";
import FoodPreferencesSheet from "./garden/FoodPreferencesSheet";
import { FoodActionNeeded, FoodSavedSummary } from "./garden/FoodSummary";
import AutoFillCard from "./garden/AutoFillCard";
import ActivityCard, { type ActivityPreference } from "./garden/ActivityCard";
import SaveBar from "./garden/SaveBar";
import { useGuardLinks } from "./garden/useGuardLinks";
import { LEVEL_TOAST_LABEL, type ParticipationLevel } from "./garden/levels";

type Drafts = Record<string, Record<string, ActivityPreference>>;

const key = (studentId: string, activityId: string) => `${studentId}:${activityId}`;

interface Props {
  students: PreferenceChild[];
  activities: Activity[];
  paidDatesByStudent: Record<string, string[]>;
  savedPreferences: SavedPreference[];
  studentDefaults: StudentDefaultPreference[];
  schoolDayFoodPreferences: SchoolDayFoodPreference[];
  /** Admin "view as parent": renders the same page, never auto-opens the food sheet, and blocks writes. */
  readOnlyPreview?: boolean;
}

export default function PreferencesPageClient(props: Props) {
  return (
    <PortalShell>
      <PreferencesContent {...props} />
    </PortalShell>
  );
}

/** Local copy of a server prop that we update optimistically; resets whenever the server sends a new one. */
function useServerState<T>(serverValue: T) {
  const [value, setValue] = useState(serverValue);
  const [source, setSource] = useState(serverValue);
  if (source !== serverValue) {
    setSource(serverValue);
    setValue(serverValue);
  }
  return [value, setValue] as const;
}

function PreferencesContent({
  students,
  activities,
  paidDatesByStudent,
  savedPreferences,
  studentDefaults,
  schoolDayFoodPreferences,
  readOnlyPreview,
}: Props) {
  const router = useRouter();
  const { runSave } = usePortalFeedback(readOnlyPreview);

  const [selectedChildId, setSelectedChildId] = useState(students[0]?.id ?? "");
  const [savedRows, setSavedRows] = useServerState(savedPreferences);
  const [defaults, setDefaults] = useServerState(studentDefaults);
  const [foodPrefs, setFoodPrefs] = useServerState(schoolDayFoodPreferences);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [acknowledged, setAcknowledged] = useState(false);
  const [ackError, setAckError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [foodSheet, setFoodSheet] = useState<{ open: boolean; studentId: string | null }>({ open: false, studentId: null });
  const ackRef = useRef<HTMLDivElement>(null);

  const selectedChild = students.find((c) => c.id === selectedChildId) ?? null;
  const childFirstName = selectedChild ? firstNameOf(selectedChild.child_legal_name) : "";

  // ── Derived preference state ────────────────────────────────────────────────
  const savedMap = useMemo(() => new Map(savedRows.map((r) => [key(r.student_id, r.activity_id), r])), [savedRows]);
  const defaultLevelFor = (childId: string): ParticipationLevel | null =>
    defaults.find((d) => d.student_id === childId)?.participation_level ?? null;

  function baseFor(childId: string, activityId: string): ActivityPreference {
    const saved = savedMap.get(key(childId, activityId));
    return saved ? { level: saved.participation_level, notes: saved.notes ?? "" } : { level: defaultLevelFor(childId), notes: "" };
  }
  function valueFor(childId: string, activityId: string): ActivityPreference {
    return drafts[childId]?.[activityId] ?? baseFor(childId, activityId);
  }
  function isDirty(childId: string, activityId: string): boolean {
    const d = drafts[childId]?.[activityId];
    if (!d) return false;
    const b = baseFor(childId, activityId);
    return d.level !== b.level || (d.level !== null && d.notes !== b.notes);
  }

  // "today" is the parent's local date, known only after hydration.
  const now = useNow();
  const today = now ? toYmd(now) : null;
  const paidDates = paidDatesByStudent[selectedChildId] ?? [];
  const visibleActivities = today
    ? activities.filter(
        (a) => (!a.activity_date || paidDates.includes(a.activity_date)) && (!a.activity_date || a.activity_date >= today),
      )
    : [];

  const unsavedIds = visibleActivities.filter((a) => isDirty(selectedChildId, a.id)).map((a) => a.id);
  const unsavedCount = unsavedIds.length;
  const dirty = unsavedCount > 0;
  // Auto-filled levels that exist only on this page until the parent presses Save.
  const prefilledPending = visibleActivities.filter(
    (a) => !savedMap.has(key(selectedChildId, a.id)) && !isDirty(selectedChildId, a.id) && valueFor(selectedChildId, a.id).level !== null,
  ).length;
  const setCount = visibleActivities.filter((a) => valueFor(selectedChildId, a.id).level !== null).length;
  const canSave = visibleActivities.length > 0 && (dirty || prefilledPending > 0);
  const currentDefault = defaultLevelFor(selectedChildId);

  const guard = useUnsavedGuard(dirty, { body: "Your preference changes haven't been saved yet." });
  useGuardLinks(dirty, guard.confirm);

  // ── Food preferences ────────────────────────────────────────────────────────
  const needsFood = (childId: string) => !foodPrefs.some((p) => p.student_id === childId);
  const selectedFoodPref = foodPrefs.find((p) => p.student_id === selectedChildId);

  function openFoodSheet(studentId: string) {
    setFoodSheet({ open: true, studentId });
  }

  // Auto-open for the first child when their food answers are missing (never in admin preview).
  useEffect(() => {
    const first = students[0]?.id;
    if (!readOnlyPreview && first && !schoolDayFoodPreferences.some((p) => p.student_id === first)) openFoodSheet(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial child only
  }, []);

  function selectChild(childId: string) {
    if (childId === selectedChildId) return;
    guard.confirm(() => {
      setDrafts((prev) => ({ ...prev, [selectedChildId]: {} }));
      setSelectedChildId(childId);
      setAcknowledged(false);
      setAckError(false);
      if (!readOnlyPreview && needsFood(childId)) openFoodSheet(childId);
      else setFoodSheet((s) => ({ ...s, open: false }));
    });
  }

  function handleFoodSaved(pref: SchoolDayFoodPreference) {
    setFoodPrefs((prev) => [...prev.filter((p) => p.student_id !== pref.student_id), pref]);
  }

  // ── Edits ───────────────────────────────────────────────────────────────────
  function updatePreference(activityId: string, patch: Partial<ActivityPreference>) {
    const childId = selectedChildId;
    setDrafts((prev) => {
      const current = prev[childId]?.[activityId] ?? baseFor(childId, activityId);
      return { ...prev, [childId]: { ...prev[childId], [activityId]: { ...current, ...patch } } };
    });
  }

  async function handleSetDefault(level: ParticipationLevel | null) {
    if (savingDefault) return;
    const childId = selectedChildId;
    const name = childFirstName;
    setSavingDefault(true);
    let ok = false;
    try {
      ok = await runSave({
        successTitle: level ? `Auto-fill set · ${LEVEL_TOAST_LABEL[level]} · ${name}` : `Auto-fill cleared · ${name}`,
        errorTitle: level ? "Couldn't set auto-fill" : "Couldn't clear auto-fill",
        retry: () => void handleSetDefault(level),
        fn: async () => {
          const result = await saveStudentDefaultPreference(childId, level);
          return { ok: !result.error, error: result.error };
        },
      });
    } finally {
      setSavingDefault(false);
    }
    if (!ok) return;
    setDefaults((prev) => {
      const without = prev.filter((d) => d.student_id !== childId);
      return level !== null ? [...without, { student_id: childId, participation_level: level }] : without;
    });
    // Pre-set every not-yet-saved activity to the new default (edits there take the new level too).
    setDrafts((prev) => {
      const child = { ...prev[childId] };
      for (const activityId of Object.keys(child)) {
        if (!savedMap.has(key(childId, activityId))) child[activityId] = { ...child[activityId], level };
      }
      return { ...prev, [childId]: child };
    });
  }

  async function handleSave() {
    if (saving || !canSave) return;
    if (!acknowledged) {
      setAckError(true);
      const el = ackRef.current;
      el?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      el?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
      return;
    }
    const childId = selectedChildId;
    const name = childFirstName;
    const visible = visibleActivities;
    const entries: PreferenceEntry[] = visible.map((a) => {
      const v = valueFor(childId, a.id);
      return { activityId: a.id, level: v.level, notes: v.notes };
    });
    setSaving(true);
    let ok = false;
    try {
      ok = await runSave({
        successTitle: `Preferences saved · ${name}`,
        errorTitle: "Couldn't save preferences",
        retry: () => void handleSave(),
        fn: async () => {
          const result = await saveActivityPreferences(childId, entries);
          return { ok: !result.error, error: result.error };
        },
      });
    } finally {
      setSaving(false);
    }
    if (!ok) return;
    const visibleIds = new Set(visible.map((a) => a.id));
    setSavedRows((prev) => [
      ...prev.filter((r) => !(r.student_id === childId && visibleIds.has(r.activity_id))),
      ...entries
        .filter((e) => e.level !== null)
        .map((e) => ({ student_id: childId, activity_id: e.activityId, participation_level: e.level!, notes: e.notes })),
    ]);
    setDrafts((prev) => ({ ...prev, [childId]: {} }));
    router.refresh();
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
      <header className="max-w-2xl">
        <h1 className="sf-display text-[2.5rem] leading-[1.02] sm:text-[3.2rem]">Activity Preferences</h1>
        <p className="mt-3 text-[15px] font-semibold leading-relaxed text-[var(--sf-soft)]">
          Let us know how each child would like to participate in upcoming activities. School day food preferences for
          snacks and shared foods are separate from activity participation below.
        </p>
      </header>

      {students.length === 0 ? (
        <EmptyState
          className="mt-8"
          emoji="👨‍👩‍👧"
          tint="sky"
          title="No children found"
          body="Once a child is added to your account, their activity preferences will appear here."
        />
      ) : (
        <>
          <div className="mt-7">
            <PrefsChildTabs
              students={students}
              activeId={selectedChildId}
              onChange={selectChild}
              needsFood={needsFood}
              unsaved={(id) => id === selectedChildId && dirty}
              controls="prefs-panel"
            />
          </div>

          <div id="prefs-panel" role="tabpanel" aria-label={selectedChild?.child_legal_name} className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <aside className="flex min-w-0 flex-col gap-5 lg:order-2" aria-label="Food and auto-fill preferences">
              {needsFood(selectedChildId) ? (
                <FoodActionNeeded onOpen={() => openFoodSheet(selectedChildId)} />
              ) : selectedFoodPref ? (
                <FoodSavedSummary pref={selectedFoodPref} onUpdate={() => openFoodSheet(selectedChildId)} />
              ) : null}
              {visibleActivities.length > 0 && selectedChild ? (
                <AutoFillCard
                  childName={selectedChild.child_legal_name}
                  level={currentDefault}
                  saving={savingDefault}
                  onSet={(level) => void handleSetDefault(level)}
                />
              ) : null}
            </aside>

            <section className="min-w-0 lg:order-1" aria-labelledby="activities-title">
              <SectionHeader
                id="activities-title"
                title="Activities"
                note={visibleActivities.length > 0 ? (setCount === visibleActivities.length ? "all set 🌿" : `${setCount} of ${visibleActivities.length} set`) : undefined}
              />

              {activities.length === 0 ? (
                <EmptyState
                  emoji="🧺"
                  title="No activities yet"
                  body="When teachers publish activities, they will appear here for you to set preferences."
                />
              ) : today === null ? (
                <SkeletonList rows={2} rowClassName="h-64" label="Loading activities…" />
              ) : visibleActivities.length === 0 ? (
                <EmptyState
                  emoji="📅"
                  tint="butter"
                  title="No activities for your scheduled days"
                  body="Activities will appear here once they are scheduled on a day your child is enrolled for."
                />
              ) : (
                <div className="flex flex-col gap-5">
                  {visibleActivities.map((activity) => {
                    const pref = valueFor(selectedChildId, activity.id);
                    return (
                      <ActivityCard
                        key={`${selectedChildId}:${activity.id}`}
                        activity={activity}
                        pref={pref}
                        onChange={(patch) => updatePreference(activity.id, patch)}
                        prefilled={!savedMap.has(key(selectedChildId, activity.id)) && currentDefault !== null && pref.level === currentDefault}
                        unsaved={unsavedIds.includes(activity.id)}
                      />
                    );
                  })}

                  <div ref={ackRef} className="mt-2" aria-live="polite">
                    <CheckboxRow
                      checked={acknowledged}
                      onChange={(v) => {
                        setAcknowledged(v);
                        if (v) setAckError(false);
                      }}
                    >
                      {ALLERGEN_DISCLAIMER}
                    </CheckboxRow>
                    {ackError && !acknowledged ? <FieldError>Please tick the box above to save your preferences.</FieldError> : null}
                  </div>

                  <SaveBar unsavedCount={unsavedCount} canSave={canSave} saving={saving} onSave={() => void handleSave()} />
                </div>
              )}
            </section>
          </div>

          <FoodPreferencesSheet
            open={foodSheet.open}
            onClose={() => setFoodSheet((s) => ({ ...s, open: false }))}
            students={students}
            savedPreferences={foodPrefs}
            initialStudentId={foodSheet.studentId}
            onSaved={handleFoodSaved}
            readOnlyPreview={readOnlyPreview}
          />
        </>
      )}

      {guard.dialog}
    </div>
  );
}
