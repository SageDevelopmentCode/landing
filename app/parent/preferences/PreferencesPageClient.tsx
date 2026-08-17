"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, Users, ChevronDown, UtensilsCrossed, Pencil, ChevronRight } from "lucide-react";
import Image from "next/image";
import type { Activity } from "@/app/actions/activities";
import type {
  PreferenceChild,
  SavedPreference,
  StudentDefaultPreference,
  SchoolDayFoodPreference,
} from "./page";
import { saveActivityPreferences, type PreferenceEntry } from "@/app/actions/preferences";
import { saveStudentDefaultPreference } from "@/app/actions/studentDefaultPreferences";
import SchoolDayFoodPreferencesSheet, {
  getEmergencySnackLabel,
  getSharedFoodLabel,
} from "./SchoolDayFoodPreferencesSheet";

type ParticipationLevel = "watch" | "cook_no_eat" | "full";

type ActivityPreference = {
  level: ParticipationLevel | null;
  notes: string;
};

type AllPreferences = Record<string, Record<string, ActivityPreference>>;

const LEVELS: { value: ParticipationLevel; label: string; emoji: string }[] = [
  { value: "watch", label: "Do not participate, just watch", emoji: "👀" },
  {
    value: "cook_no_eat",
    label: "Cook and interact with ingredients but do not consume",
    emoji: "🧑‍🍳",
  },
  { value: "full", label: "Okay for everything (cooking and eating)", emoji: "✅" },
];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface Props {
  students: PreferenceChild[];
  activities: Activity[];
  paidDatesByStudent: Record<string, string[]>;
  savedPreferences: SavedPreference[];
  studentDefaults: StudentDefaultPreference[];
  schoolDayFoodPreferences: SchoolDayFoodPreference[];
}

export default function PreferencesPageClient({
  students,
  activities,
  paidDatesByStudent,
  savedPreferences,
  studentDefaults: initialStudentDefaults,
  schoolDayFoodPreferences: initialSchoolDayFoodPreferences,
}: Props) {
  const [selectedChildId, setSelectedChildId] = useState(students[0]?.id ?? "");
  const [expandedFoods, setExpandedFoods] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [acknowledged, setAcknowledged] = useState(false);
  const [defaults, setDefaults] = useState<StudentDefaultPreference[]>(initialStudentDefaults);
  const [savingDefault, setSavingDefault] = useState(false);
  const [schoolDayFoodPrefs, setSchoolDayFoodPrefs] = useState<SchoolDayFoodPreference[]>(
    initialSchoolDayFoodPreferences,
  );
  const [foodSheetOpen, setFoodSheetOpen] = useState(false);
  const [foodSheetStudentId, setFoodSheetStudentId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<AllPreferences>(() => {
    const init: AllPreferences = {};
    for (const child of students) {
      init[child.id] = {};
      const defaultLevel = initialStudentDefaults.find(d => d.student_id === child.id)?.participation_level ?? null;
      for (const activity of activities) {
        const saved = savedPreferences.find(
          (s) => s.student_id === child.id && s.activity_id === activity.id
        );
        init[child.id][activity.id] = saved
          ? { level: saved.participation_level, notes: saved.notes }
          : { level: defaultLevel, notes: "" };
      }
    }
    return init;
  });

  const selectedSchoolDayFoodPref = schoolDayFoodPrefs.find(
    (p) => p.student_id === selectedChildId,
  );

  function childNeedsSchoolDayFoodPrefs(childId: string) {
    return !schoolDayFoodPrefs.some((p) => p.student_id === childId);
  }

  function handleSchoolDayFoodSaved(pref: SchoolDayFoodPreference) {
    setSchoolDayFoodPrefs((prev) => {
      const without = prev.filter((p) => p.student_id !== pref.student_id);
      return [...without, pref];
    });
  }

  function openFoodSheetForStudent(studentId: string) {
    setFoodSheetStudentId(studentId);
    setFoodSheetOpen(true);
  }

  function maybeOpenFoodSheetForChild(childId: string) {
    if (childNeedsSchoolDayFoodPrefs(childId)) {
      openFoodSheetForStudent(childId);
    } else {
      setFoodSheetOpen(false);
    }
  }

  useEffect(() => {
    if (selectedChildId) maybeOpenFoodSheetForChild(selectedChildId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial child only
  }, []);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    setSaveStatus("idle");
    setAcknowledged(false);
    maybeOpenFoodSheetForChild(childId);
  };

  function updatePreference(
    childId: string,
    activityId: string,
    patch: Partial<ActivityPreference>
  ) {
    setPreferences((prev) => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        [activityId]: {
          ...prev[childId][activityId],
          ...patch,
        },
      },
    }));
  }

  const savedActivityIds = new Set(
    savedPreferences
      .filter((s) => s.student_id === selectedChildId)
      .map((s) => s.activity_id)
  );

  async function handleSetDefault(level: ParticipationLevel | null) {
    setSavingDefault(true);
    const result = await saveStudentDefaultPreference(selectedChildId, level);
    if (!result.error) {
      setDefaults((prev) => {
        const without = prev.filter((d) => d.student_id !== selectedChildId);
        return level !== null
          ? [...without, { student_id: selectedChildId, participation_level: level }]
          : without;
      });
      setPreferences((prev) => {
        const updated = { ...prev[selectedChildId] };
        for (const activityId of Object.keys(updated)) {
          if (!savedActivityIds.has(activityId)) {
            updated[activityId] = { ...updated[activityId], level };
          }
        }
        return { ...prev, [selectedChildId]: updated };
      });
    }
    setSavingDefault(false);
  }

  function applyToAll(level: ParticipationLevel, visibleActivities: Activity[]) {
    setPreferences((prev) => {
      const updated = { ...prev[selectedChildId] };
      for (const a of visibleActivities) {
        updated[a.id] = { ...updated[a.id], level };
      }
      return { ...prev, [selectedChildId]: updated };
    });
  }

  async function handleSave(visibleActivities: Activity[]) {
    setSaving(true);
    setSaveStatus("idle");
    const childPrefs = preferences[selectedChildId] ?? {};
    const entries: PreferenceEntry[] = visibleActivities.map((a) => ({
      activityId: a.id,
      level: childPrefs[a.id]?.level ?? null,
      notes: childPrefs[a.id]?.notes ?? "",
    }));
    const result = await saveActivityPreferences(selectedChildId, entries);
    setSaving(false);
    setSaveStatus(result.error ? "error" : "success");
  }

  if (students.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-5">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold font-heading text-gray-800 mb-3">
            No children found
          </h2>
          <p className="text-gray-500 font-body text-sm max-w-sm leading-relaxed">
            Once a child is added to your account, their activity preferences will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <SchoolDayFoodPreferencesSheet
        open={foodSheetOpen}
        onOpenChange={setFoodSheetOpen}
        students={students}
        savedPreferences={schoolDayFoodPrefs}
        initialStudentId={foodSheetStudentId}
        onSaved={handleSchoolDayFoodSaved}
      />

      {/* Left sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 overflow-y-auto px-3 pt-8 gap-1 bg-white border-r border-gray-100">
        <p className="text-xs font-semibold font-body text-gray-400 uppercase tracking-wider px-2 pb-2">
          Children
        </p>
        {students.map((child) => {
          const isActive = child.id === selectedChildId;
          return (
            <button
              key={child.id}
              onClick={() => handleSelectChild(child.id)}
              className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#4a7c59]/10 text-gray-800"
                  : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
              }`}
            >
              {child.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={child.profile_image_url}
                  alt={child.child_legal_name}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 bg-[#4a7c59]">
                  {getInitials(child.child_legal_name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-body font-medium truncate leading-tight">
                  {child.child_legal_name}
                </p>
              </div>
              {childNeedsSchoolDayFoodPrefs(child.id) && (
                <span
                  className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                  aria-label="School day food preferences needed"
                />
              )}
            </button>
          );
        })}
      </aside>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile: horizontal scrollable tab bar */}
        <div className="md:hidden flex gap-2 overflow-x-auto px-4 py-2 border-b border-gray-100 bg-white shrink-0">
          {students.map((child) => {
            const isActive = child.id === selectedChildId;
            return (
              <button
                key={child.id}
                onClick={() => handleSelectChild(child.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#4a7c59]/10 text-gray-800"
                    : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
                }`}
              >
                {child.profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={child.profile_image_url}
                    alt={child.child_legal_name}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 bg-[#4a7c59]">
                    {getInitials(child.child_legal_name)}
                  </div>
                )}
                <span className="max-w-[10ch] truncate">{child.child_legal_name}</span>
                {childNeedsSchoolDayFoodPrefs(child.id) && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                    aria-label="School day food preferences needed"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold font-heading text-gray-800 mb-2">
                Activity Preferences
              </h1>
              <p className="text-sm text-gray-500 font-body">
                Let us know how each child would like to participate in upcoming
                activities. School day food preferences for snacks and shared
                foods are separate from activity participation below.
              </p>
            </div>

            {childNeedsSchoolDayFoodPrefs(selectedChildId) && (
              <div className="mb-8 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 flex flex-col gap-3 shadow-sm">
                <span className="self-start text-xs font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full font-body">
                  Action Needed
                </span>
                <button
                  type="button"
                  onClick={() => openFoodSheetForStudent(selectedChildId)}
                  className="w-full text-left rounded-xl border border-amber-200/60 bg-amber-100/60 px-3 py-3 flex items-center gap-3 hover:bg-amber-100/80 transition-colors cursor-pointer"
                >
                  <span className="text-xl shrink-0">🍎</span>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-sm font-bold text-amber-900 leading-snug font-heading">
                      School Day Food Preferences
                    </span>
                    <span className="text-xs text-amber-800 font-body leading-relaxed">
                      Please tell us how to handle backup snacks and food shared
                      by families during the school day. This is a new form,
                      separate from activity cooking preferences below.
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-amber-600 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => openFoodSheetForStudent(selectedChildId)}
                  className="self-start inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors font-body ml-0"
                >
                  Complete preferences
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {selectedSchoolDayFoodPref && (
              <div className="mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold font-heading text-gray-900">
                        School Day Food Preferences
                      </h2>
                      <p className="text-xs font-body text-gray-500">
                        Saved to your child&apos;s profile for daily food offerings
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openFoodSheetForStudent(selectedChildId)}
                    className="flex items-center gap-1.5 text-xs font-semibold font-body text-[#4a7c59] hover:text-[#3d6b4a] transition-colors cursor-pointer shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Update
                  </button>
                </div>
                <div className="flex flex-col gap-3 text-xs font-body text-gray-600 leading-relaxed">
                  <div>
                    <p className="font-semibold text-gray-800 mb-0.5">
                      Emergency / backup snacks
                    </p>
                    <p>
                      {getEmergencySnackLabel(
                        selectedSchoolDayFoodPref.emergency_snack_preference,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-0.5">
                      Shared / gifted foods
                    </p>
                    <p>
                      {getSharedFoodLabel(
                        selectedSchoolDayFoodPref.shared_food_preference,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* No activities state */}
            {activities.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
                  <SlidersHorizontal className="w-8 h-8 text-[#4a7c59]" />
                </div>
                <h2 className="text-xl font-semibold font-heading text-gray-800 mb-3">
                  No activities yet
                </h2>
                <p className="text-gray-500 font-body text-sm max-w-sm leading-relaxed">
                  When teachers publish activities, they will appear here for you to set preferences.
                </p>
              </div>
            )}

            {/* Activity cards */}
            {activities.length > 0 && (() => {
              const today = new Date().toISOString().slice(0, 10);
              const paidDates = paidDatesByStudent[selectedChildId] ?? [];
              const visibleActivities = activities.filter((a) =>
                (!a.activity_date || paidDates.includes(a.activity_date)) &&
                (!a.activity_date || a.activity_date >= today)
              );
              return (
              <div className="flex flex-col gap-4">
                {visibleActivities.length > 0 && (() => {
                  const currentDefault = defaults.find(d => d.student_id === selectedChildId);
                  const selectedChild = students.find(c => c.id === selectedChildId);
                  return (
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-4">
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-[#4a7c59]/10 text-[#4a7c59] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-body">
                              New
                            </span>
                            <p className="text-sm font-semibold font-body text-gray-800">
                              Auto-fill preference
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 font-body leading-relaxed">
                            Pick a level and every new activity for {selectedChild?.child_legal_name} will be automatically pre-selected — you can still change any activity individually.
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                          {LEVELS.map(({ value, label, emoji }) => {
                            const isActive = currentDefault?.participation_level === value;
                            return (
                              <button
                                key={value}
                                onClick={() => handleSetDefault(isActive ? null : value)}
                                disabled={savingDefault}
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
                          {currentDefault && (
                            <button
                              onClick={() => handleSetDefault(null)}
                              disabled={savingDefault}
                              className="text-xs text-gray-400 font-body hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      {currentDefault && (
                        <p className="text-xs text-[#4a7c59] font-body font-semibold mt-2.5">
                          ✓ Auto-fill active · New activities will be pre-set to &ldquo;{LEVELS.find(l => l.value === currentDefault.participation_level)?.label}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })()}

                {visibleActivities.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
                      <SlidersHorizontal className="w-8 h-8 text-[#4a7c59]" />
                    </div>
                    <h2 className="text-xl font-semibold font-heading text-gray-800 mb-3">
                      No activities for your scheduled days
                    </h2>
                    <p className="text-gray-500 font-body text-sm max-w-sm leading-relaxed">
                      Activities will appear here once they are scheduled on a day your child is enrolled for.
                    </p>
                  </div>
                )}
                {visibleActivities.map((activity) => {
                  const pref = preferences[selectedChildId]?.[activity.id] ?? {
                    level: null,
                    notes: "",
                  };
                  return (
                    <div
                      key={activity.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                    >
                      {/* Activity header */}
                      <div className="flex items-start gap-4 mb-5">
                        {activity.images.length > 0 && (
                          <Image
                            src={activity.images[0].signed_url}
                            alt={activity.title}
                            width={80}
                            height={80}
                            className="rounded-xl object-cover w-20 h-20 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold font-heading text-gray-800 mb-1">
                            {activity.title}
                          </h3>
                          {activity.description && (
                            <p className="text-sm text-gray-500 font-body leading-relaxed">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Food items — collapsible */}
                      {activity.includes_food && activity.foods.length > 0 && (
                        <div className="mb-5 pt-5 border-t border-gray-100">
                          <button
                            onClick={() =>
                              setExpandedFoods((prev) => {
                                const next = new Set(prev);
                                if (next.has(activity.id)) next.delete(activity.id);
                                else next.add(activity.id);
                                return next;
                              })
                            }
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#4a7c59] transition-colors cursor-pointer font-body uppercase tracking-wide"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                expandedFoods.has(activity.id) ? "rotate-180" : ""
                              }`}
                              strokeWidth={2.5}
                            />
                            {expandedFoods.has(activity.id)
                              ? "Hide food items & ingredients"
                              : `See food items & ingredients (${activity.foods.length})`}
                          </button>

                          {expandedFoods.has(activity.id) && (
                            <div className="flex flex-col gap-2 mt-3">
                              {activity.foods.map((food) => (
                                <div key={food.id} className="bg-gray-50 rounded-xl p-3">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-sm font-semibold text-gray-800 font-body">
                                      {food.name}
                                    </span>
                                    {food.allergens && (
                                      <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-body">
                                        ⚠ {food.allergens}
                                      </span>
                                    )}
                                  </div>
                                  {food.ingredients.length > 0 && (
                                    <p className="text-xs text-gray-500 font-body">
                                      Ingredients:{" "}
                                      {food.ingredients
                                        .slice()
                                        .sort((a, b) => a.sort_order - b.sort_order)
                                        .map((i) => i.name)
                                        .join(", ")}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Preference selector */}
                      <div className="pt-5 border-t border-gray-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 font-body mb-3">
                          Participation Preference
                        </p>
                        <div className="flex flex-col gap-2">
                          {LEVELS.map(({ value, label, emoji }) => {
                            const isActive = pref.level === value;
                            return (
                              <button
                                key={value}
                                onClick={() =>
                                  updatePreference(selectedChildId, activity.id, {
                                    level: isActive ? null : value,
                                  })
                                }
                                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
                                  isActive
                                    ? "border-[#4a7c59] bg-[#4a7c59]/8 text-[#4a7c59] font-semibold"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                                    isActive
                                      ? "bg-[#4a7c59] border-[#4a7c59]"
                                      : "border-gray-400"
                                  }`}
                                />
                                <span className="text-base leading-none flex-shrink-0">
                                  {emoji}
                                </span>
                                <span className="text-sm font-body">{label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Default-filled indicator */}
                        {pref.level !== null && !savedActivityIds.has(activity.id) && defaults.some(d => d.student_id === selectedChildId) && (
                          <p className="text-xs text-gray-400 font-body mt-2 flex items-center gap-1">
                            <span>⚡</span>
                            <span>Pre-filled by your default preference · Select a different option to override</span>
                          </p>
                        )}

                        {/* Notes textarea */}
                        {pref.level !== null && (
                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-gray-500 font-body mb-1.5 uppercase tracking-wide">
                              Notes or special instructions (optional)
                            </label>
                            <textarea
                              value={pref.notes}
                              onChange={(e) =>
                                updatePreference(selectedChildId, activity.id, {
                                  notes: e.target.value,
                                })
                              }
                              placeholder="e.g. only eat one serving, bringing alternative ingredients: oat milk instead of dairy..."
                              rows={2}
                              className="w-full px-3 py-2 text-sm font-body border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59] placeholder-gray-400 text-gray-800"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Save button */}
                {visibleActivities.length > 0 && (
                <>
                <label className="flex items-start gap-3 cursor-pointer mt-4 pt-6 border-t border-gray-100">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#4a7c59] cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 font-body leading-relaxed">
                    I have reviewed the ingredients and allergens listed above. I understand and acknowledge that Sage Field is not responsible for any allergic reactions, dietary sensitivities, or adverse responses related to food items consumed during activities.
                  </span>
                </label>
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-center md:text-left">
                    {saveStatus === "success" && (
                      <p className="text-xs text-[#4a7c59] font-body font-semibold">Preferences saved!</p>
                    )}
                    {saveStatus === "error" && (
                      <p className="text-xs text-red-500 font-body">Something went wrong. Please try again.</p>
                    )}
                    {saveStatus === "idle" && (
                      <p className="text-xs text-gray-400 font-body">Changes are not saved until you click Save.</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleSave(visibleActivities)}
                    disabled={saving || !acknowledged}
                    className={`w-full md:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold font-body transition-colors ${
                      saving || !acknowledged
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-[#4a7c59] text-white hover:bg-[#3d6b4a] cursor-pointer"
                    }`}
                  >
                    {saving ? "Saving…" : "Save Preferences"}
                  </button>
                </div>
                </>
                )}
              </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
