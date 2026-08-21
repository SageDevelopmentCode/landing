"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronRight, UtensilsCrossed } from "lucide-react";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  students: HomeStudent[];
  readOnly?: boolean;
  onSaved?: () => void;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-[#6b7c9b]",
  "bg-[#7b8ca3]",
  "bg-[#8b9c7e]",
  "bg-[#9c7e8b]",
  "bg-[#7e8b9c]",
  "bg-[#a07060]",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatActivityDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function ParentActivityPreferenceSheet({
  open,
  onOpenChange,
  activity,
  students,
  readOnly = false,
  onSaved,
}: Props) {
  const studentIds = useMemo(() => students.map((s) => s.id), [students]);

  const [loading, setLoading] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [prefsByStudent, setPrefsByStudent] = useState<Record<string, ActivityPref>>({});
  const [savedStudentIds, setSavedStudentIds] = useState<Set<string>>(new Set());
  const [snapshotByStudent, setSnapshotByStudent] = useState<Record<string, ActivityPref>>({});
  const [expandedFoods, setExpandedFoods] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const loadPrefs = useCallback(async () => {
    if (!activity || studentIds.length === 0) return;
    setLoading(true);
    try {
      const result = await getActivityPreferencesForActivity(activity.id, studentIds);
      if ("error" in result) {
        setSaveStatus("error");
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
      setSelectedChildId((prev) =>
        prev && studentIds.includes(prev) ? prev : studentIds[0] ?? null,
      );
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

  const currentPref = selectedChildId
    ? (prefsByStudent[selectedChildId] ?? { level: null, notes: "" })
    : { level: null, notes: "" };

  const isPreFilled =
    !!selectedChildId &&
    !savedStudentIds.has(selectedChildId) &&
    currentPref.level !== null;

  const hasUnsavedChanges = studentIds.some((id) => {
    const current = prefsByStudent[id] ?? { level: null, notes: "" };
    const saved = snapshotByStudent[id] ?? { level: null, notes: "" };
    return (
      (current.level ?? null) !== (saved.level ?? null) ||
      (current.notes ?? "") !== (saved.notes ?? "")
    );
  });

  const hasAnySelection = studentIds.some(
    (id) => (prefsByStudent[id]?.level ?? null) !== null,
  );

  const canSave =
    !readOnly && hasUnsavedChanges && hasAnySelection && saveStatus !== "saving";

  const showFoods =
    !!activity?.includes_food && (activity.foods?.length ?? 0) > 0;

  const setPref = (studentId: string, update: Partial<ActivityPref>) => {
    setSavedStudentIds((prev) => new Set(prev).add(studentId));
    setPrefsByStudent((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] ?? { level: null, notes: "" }),
        ...update,
      },
    }));
    if (saveStatus === "saved" || saveStatus === "error") {
      setSaveStatus("idle");
    }
  };

  const handleSave = async () => {
    if (readOnly || !activity || saveStatus === "saving") return;
    if (!hasUnsavedChanges || !hasAnySelection) return;

    setSaveStatus("saving");
    try {
      const entries = studentIds
        .filter((studentId) => {
          const pref = prefsByStudent[studentId] ?? { level: null, notes: "" };
          const snap = snapshotByStudent[studentId] ?? { level: null, notes: "" };
          return (
            (pref.level ?? null) !== (snap.level ?? null) ||
            (pref.notes ?? "") !== (snap.notes ?? "")
          );
        })
        .map((studentId) => {
          const pref = prefsByStudent[studentId] ?? { level: null, notes: "" };
          const child = students.find((s) => s.id === studentId);
          return {
            studentId,
            childName: child?.child_legal_name ?? "Unknown",
            level: pref.level,
            notes: pref.notes,
          };
        });

      const result = await saveActivityPreferencesForActivity(
        activity.id,
        activity.title,
        entries,
      );

      if (result.error) {
        setSaveStatus("error");
        return;
      }

      const nextSnapshots: Record<string, ActivityPref> = {};
      for (const studentId of studentIds) {
        const pref = prefsByStudent[studentId] ?? { level: null, notes: "" };
        nextSnapshots[studentId] = { level: pref.level, notes: pref.notes };
        if (pref.level !== null) {
          setSavedStudentIds((prev) => new Set(prev).add(studentId));
        }
      }
      setSnapshotByStudent(nextSnapshots);
      setConfirmOpen(false);
      setSaveStatus("saved");
      onSaved?.();

      setTimeout(() => {
        onOpenChange(false);
        setSaveStatus("idle");
      }, 600);
    } catch {
      setSaveStatus("error");
    }
  };

  const handleSavePress = () => {
    if (!canSave) return;
    if (showFoods) {
      setConfirmOpen(true);
    } else {
      void handleSave();
    }
  };

  const selectedOption = LEVEL_OPTIONS.find((o) => o.level === currentPref.level);
  const coverUrl = activity?.images?.[0]?.signed_url ?? null;

  return (
    <AnimatePresence>
      {open && activity && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[480px] bg-white shadow-2xl flex flex-col pointer-events-auto [&_button:not(:disabled)]:cursor-pointer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#4a7c59]" />
                <span className="text-sm font-semibold text-gray-800 font-heading">
                  Activity Preference
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
              {coverUrl ? (
                <div className="relative w-full h-28 rounded-xl overflow-hidden">
                  <Image
                    src={coverUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-full h-28 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 text-2xl">
                  🎀
                </div>
              )}

              <div>
                <h2 className="text-lg font-heading font-semibold text-gray-800">
                  {activity.title}
                </h2>
                {activity.activity_date ? (
                  <p className="text-sm text-[#4a7c59] font-body mt-0.5">
                    {formatActivityDate(activity.activity_date)}
                  </p>
                ) : null}
                {activity.description ? (
                  <p className="text-sm text-gray-500 font-body mt-2 leading-relaxed">
                    {activity.description}
                  </p>
                ) : null}
              </div>

              {students.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {students.map((child) => {
                    const active = child.id === selectedChildId;
                    const pref = prefsByStudent[child.id] ?? { level: null, notes: "" };
                    const unset = pref.level === null;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setSelectedChildId(child.id)}
                        className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-body transition-colors ${
                          active
                            ? "bg-[#4a7c59] text-white"
                            : "bg-[#F2F7F3] text-gray-600 hover:bg-[#e8f0ea]"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ${avatarColor(child.id)}`}
                        >
                          {getInitials(child.child_legal_name)}
                        </span>
                        <span className="max-w-[8ch] truncate">
                          {child.child_legal_name.split(" ")[0]}
                        </span>
                        {unset ? (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#4a7c59] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {selectedChildId ? (
                    <div>
                      <span
                        className={`inline-block text-[11px] font-semibold font-body px-2 py-0.5 rounded-md border ${
                          currentPref.level === null
                            ? "bg-gray-50 text-gray-500 border-gray-200"
                            : isPreFilled
                              ? "bg-[#4a7c59]/10 text-[#4a7c59] border-[#4a7c59]/30"
                              : "bg-green-50 text-green-700 border-green-200"
                        }`}
                      >
                        {currentPref.level === null
                          ? "Not set"
                          : isPreFilled
                            ? "Pre-filled"
                            : "Saved"}
                      </span>
                    </div>
                  ) : null}

                  {showFoods ? (
                    <div className="rounded-xl bg-gray-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedFoods((v) => !v)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-100/80 transition-colors"
                      >
                        <UtensilsCrossed size={15} className="text-[#4a7c59] shrink-0" />
                        <span className="text-sm font-semibold text-gray-700 font-body">
                          {expandedFoods
                            ? "Hide ingredients"
                            : `${activity.foods.length} food item${activity.foods.length === 1 ? "" : "s"}`}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`ml-auto text-gray-400 transition-transform ${expandedFoods ? "rotate-180" : ""}`}
                        />
                      </button>
                      {expandedFoods ? (
                        <div className="px-3 pb-3 flex flex-col gap-2">
                          {activity.foods.map((food) => (
                            <div key={food.id} className="pl-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-700 font-body">
                                  {food.name}
                                </span>
                                {food.allergens ? (
                                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-body">
                                    {food.allergens}
                                  </span>
                                ) : null}
                              </div>
                              {food.ingredients.length > 0 ? (
                                <p className="text-xs text-gray-500 font-body mt-0.5">
                                  {food.ingredients.map((ig) => ig.name).join(", ")}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 font-body mb-2">
                      Participation
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {LEVEL_OPTIONS.map((opt) => {
                        const active = currentPref.level === opt.level;
                        return (
                          <button
                            key={opt.level}
                            type="button"
                            disabled={readOnly || !selectedChildId}
                            onClick={() =>
                              selectedChildId &&
                              setPref(selectedChildId, {
                                level: active ? null : (opt.level as ParticipationLevel),
                              })
                            }
                            className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-center transition-colors ${
                              active
                                ? "border-[#4a7c59] bg-[#4a7c59]/10"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            } disabled:opacity-50`}
                          >
                            <span className="text-base">{opt.emoji}</span>
                            <span
                              className={`text-[11px] font-body leading-tight ${
                                active ? "font-semibold text-[#4a7c59]" : "text-gray-600"
                              }`}
                            >
                              {opt.level === "watch"
                                ? "Watch"
                                : opt.level === "cook_no_eat"
                                  ? "Cook"
                                  : "Full"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedOption ? (
                      <p className="text-xs text-gray-500 font-body mt-2">
                        {selectedOption.label}
                      </p>
                    ) : null}
                  </div>

                  {currentPref.level !== null && selectedChildId ? (
                    <textarea
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm font-body text-gray-800 min-h-[72px] resize-none bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30"
                      placeholder="Optional notes (e.g. oat milk instead of dairy)"
                      value={currentPref.notes}
                      onChange={(e) =>
                        setPref(selectedChildId, { notes: e.target.value })
                      }
                      disabled={readOnly}
                    />
                  ) : null}

                  {saveStatus === "error" ? (
                    <p className="text-xs text-red-600 font-body text-center">
                      Something went wrong. Please try again.
                    </p>
                  ) : null}

                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={handleSavePress}
                      disabled={!canSave}
                      className="w-full py-3 rounded-xl bg-[#4a7c59] text-white text-sm font-semibold font-body hover:bg-[#3d6849] transition-colors disabled:opacity-45"
                    >
                      {saveStatus === "saving"
                        ? "Saving…"
                        : saveStatus === "saved"
                          ? "Saved ✓"
                          : "Save Preference"}
                    </button>
                  ) : null}

                  <Link
                    href="/parent/preferences"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-center gap-1 text-sm font-semibold text-[#4a7c59] font-body hover:underline"
                  >
                    View all activity preferences
                    <ChevronRight size={14} />
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          {confirmOpen ? (
            <motion.div
              className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setConfirmOpen(false)}
              />
              <motion.div
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-5 flex flex-col gap-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <h3 className="text-base font-semibold text-gray-900 font-heading">
                  Review ingredients &amp; allergens
                </h3>
                <p className="text-sm text-gray-600 font-body leading-relaxed">
                  {ALLERGEN_DISCLAIMER}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold font-body hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saveStatus === "saving"}
                    className="flex-1 py-3 rounded-xl bg-[#4a7c59] text-white text-sm font-semibold font-body hover:bg-[#3d6849] transition-colors disabled:opacity-45"
                  >
                    {saveStatus === "saving" ? "Saving…" : "Confirm and Save"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </>
      )}
    </AnimatePresence>
  );
}
