"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { Activity } from "@/app/actions/activities";
import type { StudentDefaultPreference } from "@/app/parent/preferences/page";
import type { HomeStudent } from "@/app/parent/home/page";
import { saveStudentDefaultPreference } from "@/app/actions/studentDefaultPreferences";
import {
  LEVELS,
  LEVEL_SHORT,
  getEligibleAutoFillStudents,
  type ParticipationLevel,
} from "@/app/parent/components/AutoFillPreferenceSection";
import GardenSheet from "@/app/parent/_garden/sheet";
import { CheckIcon, KidAvatar, Spinner, firstNameOf } from "@/app/parent/_garden/ui";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: HomeStudent[];
  studentDefaults: StudentDefaultPreference[];
  paidDateSets: Record<string, string[]>;
  upcomingActivities: Activity[];
  readOnly?: boolean;
  onDefaultsChange: (defaults: StudentDefaultPreference[]) => void;
};

function GardenAutoFillCard({
  child,
  currentDefault,
  readOnly,
  onSaved,
  initiallyExpanded,
}: {
  child: HomeStudent;
  currentDefault: ParticipationLevel | null;
  readOnly: boolean;
  onSaved: (level: ParticipationLevel | null) => void;
  initiallyExpanded: boolean;
}) {
  const reduce = useReducedMotion();
  const { runSave } = usePortalFeedback(readOnly);
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [savingLevel, setSavingLevel] = useState<ParticipationLevel | "clear" | null>(null);
  const firstName = firstNameOf(child.child_legal_name);
  const panelId = `autofill-${child.id}`;

  async function handleSetDefault(level: ParticipationLevel | null) {
    if (readOnly || savingLevel) return;
    setSavingLevel(level ?? "clear");
    const ok = await runSave({
      successTitle: level ? `Auto-fill on for ${firstName}` : `Auto-fill cleared for ${firstName}`,
      successMessage: level ? `New activities will be pre-set to "${LEVEL_SHORT[level]}".` : undefined,
      errorTitle: `Couldn't save ${firstName}'s default`,
      retry: () => void handleSetDefault(level),
      fn: async () => {
        const result = await saveStudentDefaultPreference(child.id, level);
        return { ok: !result.error, error: result.error };
      },
    });
    setSavingLevel(null);
    if (ok) {
      onSaved(level);
      if (level !== null) setExpanded(false);
    }
  }

  const statusText = currentDefault ? `Default active · ${LEVEL_SHORT[currentDefault]}` : "Not set";

  return (
    <div className={`overflow-hidden rounded-[24px] bg-white ring-1 ${currentDefault ? "ring-[var(--sf-sage)]/40" : "ring-[var(--sf-ink)]/[0.08]"}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--sf-butter)]/25 focus-visible:bg-[var(--sf-butter)]/25 focus-visible:outline-none cursor-pointer"
      >
        <KidAvatar id={child.id} name={child.child_legal_name} imageUrl={child.profile_image_url} size="h-10 w-10 text-sm" />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-extrabold">{firstName}</span>
          <span
            className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold ${
              currentDefault ? "bg-[var(--sf-mint)] text-[var(--sf-sage-deep)]" : "bg-[var(--sf-ink)]/[0.06] text-[var(--sf-soft)]"
            }`}
          >
            {currentDefault ? <CheckIcon className="h-3 w-3" /> : null}
            {statusText}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-[var(--sf-soft)] transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id={panelId}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t-2 border-dashed border-[var(--sf-ink)]/10 px-4 pb-4 pt-3.5">
              <p className="mb-3 text-sm leading-relaxed text-[var(--sf-soft)]">
                Pick a level and every new activity for {firstName} will be automatically pre-selected — you can still
                change any activity individually.
              </p>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label={`Default participation for ${firstName}`}>
                {LEVELS.map(({ value, label, emoji }) => {
                  const isActive = currentDefault === value;
                  const isSaving = savingLevel === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => handleSetDefault(isActive ? null : value)}
                      disabled={!!savingLevel || readOnly}
                      className={`flex min-h-12 items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-left text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] disabled:cursor-not-allowed cursor-pointer ${
                        isActive
                          ? "bg-[var(--sf-mint)] font-extrabold text-[var(--sf-sage-deep)] ring-2 ring-[var(--sf-sage)]"
                          : "bg-[var(--sf-cream)] font-bold text-[var(--sf-ink)] ring-1 ring-[var(--sf-ink)]/10 hover:ring-[var(--sf-ink)]/30 disabled:opacity-60"
                      }`}
                    >
                      <span className="text-xl" aria-hidden="true">
                        {emoji}
                      </span>
                      <span className="flex-1 leading-snug">{label}</span>
                      {isSaving ? <Spinner /> : isActive ? <CheckIcon className="h-4 w-4" /> : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-2">
                {savingLevel ? (
                  <p className="text-xs font-bold text-[var(--sf-soft)]">Saving…</p>
                ) : currentDefault ? (
                  <p className="text-xs font-extrabold text-[var(--sf-sage-deep)]">
                    ✓ Auto-fill active · New activities will be pre-set to &ldquo;
                    {LEVELS.find((l) => l.value === currentDefault)?.label}&rdquo;
                  </p>
                ) : (
                  <span />
                )}
                {currentDefault && !readOnly ? (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(null)}
                    disabled={!!savingLevel}
                    className="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-extrabold text-[var(--sf-coral-deep)] transition hover:bg-[var(--sf-coral)]/15 focus-visible:bg-[var(--sf-coral)]/15 focus-visible:outline-none disabled:opacity-50 cursor-pointer"
                  >
                    {savingLevel === "clear" ? <Spinner className="mr-1.5 h-3 w-3" /> : null}
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function AutoFillPreferencesSheet({
  open,
  onOpenChange,
  students,
  studentDefaults,
  paidDateSets,
  upcomingActivities,
  readOnly = false,
  onDefaultsChange,
}: Props) {
  const eligibleStudents = useMemo(
    () => getEligibleAutoFillStudents(students, paidDateSets, upcomingActivities),
    [students, paidDateSets, upcomingActivities],
  );

  const activeCount = eligibleStudents.filter((c) => studentDefaults.some((d) => d.student_id === c.id)).length;

  function handleChildSaved(studentId: string, level: ParticipationLevel | null) {
    const without = studentDefaults.filter((d) => d.student_id !== studentId);
    const next = level !== null ? [...without, { student_id: studentId, participation_level: level }] : without;
    onDefaultsChange(next);
  }

  return (
    <GardenSheet
      open={open && eligibleStudents.length > 0}
      onClose={() => onOpenChange(false)}
      icon="⚡"
      title="Activity auto-fill"
      note={`${activeCount} of ${eligibleStudents.length} set up`}
    >
      <div className="flex flex-col gap-4">
        <p className="text-[15px] leading-relaxed text-[var(--sf-soft)]">
          Set a default participation level so new activities are pre-filled automatically.
        </p>

        <div className="flex flex-col gap-3">
          {eligibleStudents.map((child) => {
            const currentDefault = studentDefaults.find((d) => d.student_id === child.id)?.participation_level ?? null;
            return (
              <GardenAutoFillCard
                key={child.id}
                child={child}
                currentDefault={currentDefault}
                readOnly={readOnly}
                onSaved={(level) => handleChildSaved(child.id, level)}
                initiallyExpanded={currentDefault === null}
              />
            );
          })}
        </div>

        {readOnly ? <p className="text-xs font-bold text-[var(--sf-soft)]">Preview mode — preferences cannot be saved.</p> : null}
      </div>
    </GardenSheet>
  );
}
