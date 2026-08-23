"use client";

import { useMemo, useState } from "react";
import type { Activity } from "@/app/actions/activities";
import { saveStudentDefaultPreference } from "@/app/actions/studentDefaultPreferences";
import type { StudentDefaultPreference } from "@/app/parent/preferences/page";
import type { HomeStudent } from "@/app/parent/home/page";
import { childHasVisibleUpcomingActivity } from "@/shared/parent/activity-preferences";

export type ParticipationLevel = "watch" | "cook_no_eat" | "full";

export const LEVELS: { value: ParticipationLevel; label: string; emoji: string }[] = [
  { value: "watch", label: "Do not participate, just watch", emoji: "👀" },
  {
    value: "cook_no_eat",
    label: "Cook and interact with ingredients but do not consume",
    emoji: "🧑‍🍳",
  },
  { value: "full", label: "Okay for everything (cooking and eating)", emoji: "✅" },
];

export const LEVEL_SHORT: Record<ParticipationLevel, string> = {
  watch: "Watch",
  cook_no_eat: "Cook",
  full: "Full",
};

export function getEligibleAutoFillStudents(
  students: HomeStudent[],
  paidDateSets: Record<string, string[]>,
  upcomingActivities: Activity[],
): HomeStudent[] {
  return students.filter((s) =>
    childHasVisibleUpcomingActivity(
      paidDateSets[s.id] ?? [],
      upcomingActivities,
    ),
  );
}

export function ChildAutoFillCard({
  child,
  currentDefault,
  readOnly,
  onSaved,
  initiallyExpanded = false,
}: {
  child: HomeStudent;
  currentDefault: ParticipationLevel | null;
  readOnly?: boolean;
  onSaved: (level: ParticipationLevel | null) => void;
  initiallyExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [saving, setSaving] = useState(false);
  const firstName = child.child_legal_name.split(" ")[0];

  async function handleSetDefault(level: ParticipationLevel | null) {
    if (readOnly || saving) return;
    setSaving(true);
    const result = await saveStudentDefaultPreference(child.id, level);
    setSaving(false);
    if (!result.error) {
      onSaved(level);
      if (level !== null) {
        setExpanded(false);
      }
    }
  }

  const statusText = currentDefault
    ? `Default active · ${LEVEL_SHORT[currentDefault]}`
    : "Not set";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
        disabled={readOnly && !expanded}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold font-body text-gray-800">
            {firstName}
          </p>
          {!expanded ? (
            <p
              className={`text-xs font-body mt-0.5 ${
                currentDefault ? "text-[#4a7c59] font-semibold" : "text-gray-400"
              }`}
            >
              {statusText}
            </p>
          ) : null}
        </div>
        <span className="text-gray-400 text-sm shrink-0">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded ? (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-body leading-relaxed mb-3">
            Pick a level and every new activity for {firstName} will be
            automatically pre-selected — you can still change any activity
            individually.
          </p>
          <div className="flex gap-2 flex-wrap items-center">
            {LEVELS.map(({ value, label, emoji }) => {
              const isActive = currentDefault === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleSetDefault(isActive ? null : value)}
                  disabled={saving || readOnly}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-body transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isActive
                      ? "border-[#4a7c59] bg-[#4a7c59]/8 text-[#4a7c59] font-semibold"
                      : "border-gray-200 bg-white text-gray-700 hover:border-[#4a7c59] hover:bg-[#4a7c59]/5 hover:text-[#4a7c59]"
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
            {currentDefault && !readOnly ? (
              <button
                type="button"
                onClick={() => handleSetDefault(null)}
                disabled={saving}
                className="text-xs text-gray-400 font-body hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                Clear
              </button>
            ) : null}
          </div>
          {saving ? (
            <p className="text-xs text-gray-400 font-body mt-2">Saving…</p>
          ) : currentDefault ? (
            <p className="text-xs text-[#4a7c59] font-body font-semibold mt-2.5">
              ✓ Auto-fill active · New activities will be pre-set to &ldquo;
              {LEVELS.find((l) => l.value === currentDefault)?.label}&rdquo;
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  students: HomeStudent[];
  studentDefaults: StudentDefaultPreference[];
  paidDateSets: Record<string, string[]>;
  upcomingActivities: Activity[];
  readOnly?: boolean;
  onDefaultsChange: (defaults: StudentDefaultPreference[]) => void;
};

export default function AutoFillPreferenceSection({
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

  if (eligibleStudents.length === 0) return null;

  function handleChildSaved(studentId: string, level: ParticipationLevel | null) {
    const without = studentDefaults.filter((d) => d.student_id !== studentId);
    const next =
      level !== null
        ? [...without, { student_id: studentId, participation_level: level }]
        : without;
    onDefaultsChange(next);
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-base font-heading font-semibold text-gray-800">
          Activity auto-fill
        </h2>
        <p className="text-sm text-gray-500 font-body mt-1">
          Set a default participation level so new activities are pre-filled
          automatically.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {eligibleStudents.map((child) => {
          const currentDefault =
            studentDefaults.find((d) => d.student_id === child.id)
              ?.participation_level ?? null;
          return (
            <ChildAutoFillCard
              key={child.id}
              child={child}
              currentDefault={currentDefault}
              readOnly={readOnly}
              onSaved={(level) => handleChildSaved(child.id, level)}
            />
          );
        })}
      </div>
      {readOnly ? (
        <p className="text-xs text-gray-400 font-body mt-2">
          Preview mode — preferences cannot be saved.
        </p>
      ) : null}
    </section>
  );
}
