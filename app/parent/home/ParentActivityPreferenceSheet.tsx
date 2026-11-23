"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, UtensilsCrossed } from "lucide-react";
import type { Activity } from "@/app/actions/activities";
import type { HomeStudent } from "./page";
import {
  getActivityPreferencesForActivity,
  saveActivityPreferencesForActivity,
} from "@/app/actions/preferences";
import {
  ALLERGEN_DISCLAIMER,
  LEVEL_OPTIONS,
  buildInitialPrefsForActivity,
  type ActivityPref,
  type ParticipationLevel,
} from "@/shared/parent/activity-preferences";
import { useToast } from "@/app/_garden/toast";
import GardenSheet, { GardenDialog } from "@/app/parent/_garden/sheet";
import { Arrow, CheckIcon, KidAvatar, Spinner, StepLabel, btnGhostSm, btnSheetPrimary, firstNameOf, linkSoft } from "@/app/parent/_garden/ui";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  students: HomeStudent[];
  readOnly?: boolean;
  onSaved?: () => void;
};

const EMPTY: ActivityPref = { level: null, notes: "" };

function formatActivityDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function isDifferent(a: ActivityPref | undefined, b: ActivityPref | undefined) {
  const x = a ?? EMPTY;
  const y = b ?? EMPTY;
  return (x.level ?? null) !== (y.level ?? null) || (x.notes ?? "") !== (y.notes ?? "");
}

export default function ParentActivityPreferenceSheet({
  open,
  onOpenChange,
  activity,
  students,
  readOnly = false,
  onSaved,
}: Props) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const studentIds = useMemo(() => students.map((s) => s.id), [students]);

  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [prefsByStudent, setPrefsByStudent] = useState<Record<string, ActivityPref>>({});
  /** Children whose preference for this activity is stored on the server (not just pre-filled). */
  const [savedStudentIds, setSavedStudentIds] = useState<Set<string>>(new Set());
  const [snapshotByStudent, setSnapshotByStudent] = useState<Record<string, ActivityPref>>({});
  const [expandedFoods, setExpandedFoods] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const loadPrefs = useCallback(async () => {
    if (!activity || studentIds.length === 0) return;
    setLoading(true);
    setLoadFailed(false);
    try {
      const result = await getActivityPreferencesForActivity(activity.id, studentIds);
      if ("error" in result) {
        setLoadFailed(true);
        return;
      }

      const { prefs, savedIds, snapshots } = buildInitialPrefsForActivity(
        studentIds,
        result.savedByStudent,
        result.defaultsByStudent,
        new Set(result.savedStudentIds),
      );

      setPrefsByStudent(prefs);
      setSavedStudentIds(savedIds);
      setSnapshotByStudent(snapshots);
      setSelectedChildId((prev) => (prev && studentIds.includes(prev) ? prev : (studentIds[0] ?? null)));
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [activity, studentIds]);

  useEffect(() => {
    if (open && activity) {
      setSaveStatus("idle");
      setExpandedFoods(false);
      setConfirmOpen(false);
      void loadPrefs();
    }
  }, [open, activity, loadPrefs]);

  const currentPref = selectedChildId ? (prefsByStudent[selectedChildId] ?? EMPTY) : EMPTY;
  const currentDirty = !!selectedChildId && isDifferent(prefsByStudent[selectedChildId], snapshotByStudent[selectedChildId]);

  const badge: { label: string; cls: string } =
    currentPref.level === null
      ? { label: "Not set", cls: "bg-white text-[var(--sf-soft)] ring-1 ring-[var(--sf-ink)]/15" }
      : currentDirty
        ? { label: "Unsaved changes", cls: "bg-[var(--sf-butter)] text-[#7a5b00]" }
        : selectedChildId && !savedStudentIds.has(selectedChildId)
          ? { label: "Pre-filled", cls: "bg-[var(--sf-sky)] text-[#2d5d86]" }
          : { label: "Saved", cls: "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]" };

  const dirtyIds = studentIds.filter((id) => isDifferent(prefsByStudent[id], snapshotByStudent[id]));
  const hasUnsavedChanges = dirtyIds.length > 0;
  const hasAnySelection = studentIds.some((id) => (prefsByStudent[id]?.level ?? null) !== null);
  const canSave = !readOnly && hasUnsavedChanges && hasAnySelection && saveStatus !== "saving";

  const showFoods = !!activity?.includes_food && (activity.foods?.length ?? 0) > 0;

  const setPref = (studentId: string, update: Partial<ActivityPref>) => {
    setPrefsByStudent((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? EMPTY), ...update },
    }));
    if (saveStatus === "saved" || saveStatus === "error") setSaveStatus("idle");
  };

  const handleSave = async () => {
    if (readOnly || !activity || saveStatus === "saving") return;
    if (!hasUnsavedChanges || !hasAnySelection) return;

    setSaveStatus("saving");
    try {
      const entries = dirtyIds.map((studentId) => {
        const pref = prefsByStudent[studentId] ?? EMPTY;
        const child = students.find((s) => s.id === studentId);
        return {
          studentId,
          childName: child?.child_legal_name ?? "Unknown",
          level: pref.level,
          notes: pref.notes,
        };
      });

      const result = await saveActivityPreferencesForActivity(activity.id, activity.title, entries);

      if (result.error) {
        setSaveStatus("error");
        toast.show({
          tone: "error",
          title: "Preferences weren't saved",
          message: "Please try again in a moment.",
          action: { label: "Try again", onClick: () => void handleSave() },
        });
        return;
      }

      const nextSnapshots: Record<string, ActivityPref> = {};
      const nextSaved = new Set(savedStudentIds);
      for (const studentId of studentIds) {
        const pref = prefsByStudent[studentId] ?? EMPTY;
        nextSnapshots[studentId] = { level: pref.level, notes: pref.notes };
        if (pref.level !== null) nextSaved.add(studentId);
      }
      setSavedStudentIds(nextSaved);
      setSnapshotByStudent(nextSnapshots);
      setConfirmOpen(false);
      setSaveStatus("saved");
      onSaved?.();

      const names = entries.map((e) => firstNameOf(e.childName));
      toast.show({
        tone: "success",
        title: "Preferences saved",
        message: `${activity.title} · ${names.join(", ")}`,
      });

      closeTimer.current = setTimeout(() => {
        onOpenChange(false);
        setSaveStatus("idle");
      }, 600);
    } catch {
      setSaveStatus("error");
      toast.show({
        tone: "error",
        title: "Preferences weren't saved",
        message: "Please check your connection and try again.",
        action: { label: "Try again", onClick: () => void handleSave() },
      });
    }
  };

  const handleSavePress = () => {
    if (!canSave) return;
    if (showFoods) setConfirmOpen(true);
    else void handleSave();
  };

  const selectedOption = LEVEL_OPTIONS.find((o) => o.level === currentPref.level);
  const coverUrl = activity?.images?.[0]?.signed_url ?? null;
  const multi = students.length > 1;
  const stepBase = multi ? 1 : 0;
  const unsetCount = studentIds.filter((id) => (prefsByStudent[id]?.level ?? null) === null).length;

  const footer = readOnly ? (
    <p className="text-center text-sm font-bold text-[var(--sf-soft)]">Preview mode — preferences cannot be saved.</p>
  ) : (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={handleSavePress} disabled={!canSave} className={btnSheetPrimary}>
        {saveStatus === "saving" ? (
          <>
            <Spinner /> Saving…
          </>
        ) : saveStatus === "saved" ? (
          "Saved ✓"
        ) : (
          "Save Preference"
        )}
      </button>
      <p className="text-center text-xs font-bold text-[var(--sf-soft)]" aria-live="polite">
        {saveStatus === "error"
          ? "Something went wrong. Please try again."
          : hasUnsavedChanges
            ? `${dirtyIds.length} unsaved change${dirtyIds.length > 1 ? "s" : ""}`
            : !hasAnySelection
              ? "Pick a participation level to save"
              : "Everything is saved"}
      </p>
    </div>
  );

  return (
    <>
      <GardenSheet
        open={open && !!activity}
        onClose={() => onOpenChange(false)}
        icon="🍳"
        title="Activity Preference"
        note={multi && !loading ? (unsetCount ? `${unsetCount} child${unsetCount > 1 ? "ren" : ""} still to set` : "everyone's set ✓") : undefined}
        footer={!loading && !loadFailed ? footer : undefined}
      >
        {activity ? (
          <div className="flex flex-col gap-6">
            <div className="sf-polaroid" style={{ rotate: "-1deg" }}>
              <div className="relative h-36 overflow-hidden rounded-[3px] bg-[var(--sf-peach)]">
                {coverUrl ? (
                  <Image src={coverUrl} alt="" fill sizes="440px" className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl" aria-hidden="true">
                    🎀
                  </div>
                )}
              </div>
              <div className="px-1 pt-3">
                <h3 className="sf-display text-2xl leading-tight">{activity.title}</h3>
                {activity.activity_date ? (
                  <p className="sf-hand text-lg text-[var(--sf-sage-deep)]">{formatActivityDate(activity.activity_date)}</p>
                ) : null}
                {activity.description ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--sf-soft)]">{activity.description}</p>
                ) : null}
              </div>
            </div>

            {multi ? (
              <div>
                <StepLabel n={1} done={!!selectedChildId && currentPref.level !== null}>
                  Choose a child
                </StepLabel>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Children">
                  {students.map((child) => {
                    const active = child.id === selectedChildId;
                    const unset = (prefsByStudent[child.id]?.level ?? null) === null;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSelectedChildId(child.id)}
                        className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
                          active ? "bg-[var(--sf-ink)] text-white" : "bg-white text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:ring-[var(--sf-ink)]/30"
                        }`}
                      >
                        <KidAvatar id={child.id} name={child.child_legal_name} imageUrl={child.profile_image_url} />
                        <span className="max-w-[9ch] truncate">{firstNameOf(child.child_legal_name)}</span>
                        {loading ? null : unset ? (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--sf-coral-deep)]" aria-label="not set" />
                        ) : (
                          <CheckIcon className={`h-3.5 w-3.5 ${active ? "text-[var(--sf-mint)]" : "text-[var(--sf-sage)]"}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading preferences">
                <div className="h-6 w-40 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-[20px] bg-white motion-reduce:animate-none" />
                  ))}
                </div>
              </div>
            ) : loadFailed ? (
              <div className="rounded-[24px] bg-[var(--sf-coral)]/15 px-5 py-6 text-center">
                <p className="font-extrabold">We couldn&apos;t load this activity&apos;s preferences.</p>
                <button type="button" className={`${btnGhostSm} mt-3`} onClick={() => void loadPrefs()}>
                  Try again
                </button>
              </div>
            ) : (
              <>
                {showFoods ? (
                  <div className="overflow-hidden rounded-[22px] bg-white ring-1 ring-[var(--sf-ink)]/[0.06]">
                    <button
                      type="button"
                      aria-expanded={expandedFoods}
                      onClick={() => setExpandedFoods((v) => !v)}
                      className="flex min-h-12 w-full items-center gap-2.5 px-4 text-left transition hover:bg-[var(--sf-butter)]/30 focus-visible:bg-[var(--sf-butter)]/30 focus-visible:outline-none cursor-pointer"
                    >
                      <UtensilsCrossed size={16} className="shrink-0 text-[var(--sf-sage-deep)]" aria-hidden="true" />
                      <span className="text-sm font-extrabold">
                        {expandedFoods
                          ? "Hide ingredients"
                          : `${activity.foods.length} food item${activity.foods.length === 1 ? "" : "s"}`}
                      </span>
                      {!expandedFoods ? <span className="sf-hand text-base text-[var(--sf-soft)]">tap to see ingredients</span> : null}
                      <ChevronDown size={18} className={`ml-auto text-[var(--sf-soft)] transition-transform ${expandedFoods ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                    <AnimatePresence initial={false}>
                      {expandedFoods ? (
                        <motion.div
                          initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                          exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <ul className="flex flex-col gap-3 px-4 pb-4">
                            {activity.foods.map((food) => (
                              <li key={food.id} className="border-t border-dashed border-[var(--sf-ink)]/10 pt-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-extrabold">{food.name}</span>
                                  {food.allergens ? (
                                    <span className="rounded-full bg-[var(--sf-butter)] px-2 py-0.5 text-[11px] font-extrabold text-[#7a5b00]">
                                      ⚠️ {food.allergens}
                                    </span>
                                  ) : null}
                                </div>
                                {food.ingredients.length > 0 ? (
                                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--sf-soft)]">
                                    {food.ingredients.map((ig) => ig.name).join(", ")}
                                  </p>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}

                <div>
                  <div className="flex items-start justify-between gap-2">
                    <StepLabel n={stepBase + 1} done={currentPref.level !== null}>
                      Participation
                      {multi && selectedChildId ? (
                        <span className="font-bold text-[var(--sf-soft)]">
                          {" "}
                          · {firstNameOf(students.find((s) => s.id === selectedChildId)?.child_legal_name ?? "")}
                        </span>
                      ) : null}
                    </StepLabel>
                    {selectedChildId ? (
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${badge.cls}`}>{badge.label}</span>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Participation level">
                    {LEVEL_OPTIONS.map((opt) => {
                      const active = currentPref.level === opt.level;
                      return (
                        <button
                          key={opt.level}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          aria-label={opt.label}
                          disabled={readOnly || !selectedChildId}
                          onClick={() =>
                            selectedChildId &&
                            setPref(selectedChildId, {
                              level: active ? null : (opt.level as ParticipationLevel),
                            })
                          }
                          className={`relative flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-[22px] px-2 py-3 text-center transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
                            active
                              ? "bg-[var(--sf-mint)] shadow-[0_4px_0_0_var(--sf-sage)] ring-2 ring-[var(--sf-sage)]"
                              : "bg-white ring-1 ring-[var(--sf-ink)]/10 hover:-translate-y-0.5 hover:ring-[var(--sf-ink)]/25"
                          }`}
                        >
                          {active ? (
                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sf-sage)] text-white">
                              <CheckIcon className="h-3 w-3" />
                            </span>
                          ) : null}
                          <span className="text-2xl" aria-hidden="true">
                            {opt.emoji}
                          </span>
                          <span className={`text-sm leading-tight ${active ? "font-extrabold text-[var(--sf-sage-deep)]" : "font-bold text-[var(--sf-ink)]"}`}>
                            {opt.level === "watch" ? "Watch" : opt.level === "cook_no_eat" ? "Cook" : "Full"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2.5 min-h-[1.25rem] text-sm font-bold text-[var(--sf-soft)]">
                    {selectedOption ? selectedOption.label : <span className="sf-hand text-base">pick one — tap again to clear</span>}
                  </p>
                </div>

                {currentPref.level !== null && selectedChildId ? (
                  <div>
                    <StepLabel n={stepBase + 2} done={!!currentPref.notes.trim()}>
                      Notes <span className="font-bold text-[var(--sf-soft)]">(optional)</span>
                    </StepLabel>
                    <label className="sr-only" htmlFor="activity-pref-notes">
                      Notes
                    </label>
                    <textarea
                      id="activity-pref-notes"
                      className="min-h-[84px] w-full resize-none rounded-[20px] border-2 border-[var(--sf-ink)]/10 bg-white p-3.5 text-sm text-[var(--sf-ink)] placeholder:text-[var(--sf-ink)]/40 focus:border-[var(--sf-sage)] focus:outline-none focus:ring-4 focus:ring-[var(--sf-mint)]"
                      placeholder="Optional notes (e.g. oat milk instead of dairy)"
                      value={currentPref.notes}
                      onChange={(e) => setPref(selectedChildId, { notes: e.target.value })}
                      disabled={readOnly}
                    />
                  </div>
                ) : null}

                <Link href="/parent/preferences" onClick={() => onOpenChange(false)} className={`${linkSoft} self-center`}>
                  View all activity preferences <Arrow />
                </Link>
              </>
            )}
          </div>
        ) : null}
      </GardenSheet>

      <GardenDialog
        open={confirmOpen}
        onClose={() => saveStatus !== "saving" && setConfirmOpen(false)}
        title="Review ingredients & allergens"
        layer="top"
      >
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--sf-soft)]">{ALLERGEN_DISCLAIMER}</p>
        {saveStatus === "error" ? (
          <p className="mt-3 rounded-2xl bg-[var(--sf-coral)]/15 px-4 py-2.5 text-sm font-extrabold text-[var(--sf-coral-deep)]" role="alert">
            Something went wrong. Please try again.
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => setConfirmOpen(false)} className={`${btnGhostSm} flex-1 min-h-12`}>
            Cancel
          </button>
          <button
            type="button"
            data-autofocus
            onClick={() => void handleSave()}
            disabled={saveStatus === "saving"}
            className={`${btnSheetPrimary} flex-1 !w-auto`}
          >
            {saveStatus === "saving" ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              "Confirm and Save"
            )}
          </button>
        </div>
      </GardenDialog>
    </>
  );
}
