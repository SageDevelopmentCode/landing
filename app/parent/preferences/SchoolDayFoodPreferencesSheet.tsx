"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import type { PreferenceChild, SchoolDayFoodPreference } from "./page";
import {
  saveSchoolDayFoodPreferences,
  type EmergencySnackPreference,
  type SharedFoodPreference,
} from "@/app/actions/schoolDayFoodPreferences";

export const EMERGENCY_SNACK_OPTIONS: {
  value: EmergencySnackPreference;
  emoji: string;
  label: string;
}[] = [
  {
    value: "always_allow",
    emoji: "✅",
    label: "Always allow a backup snack",
  },
  {
    value: "ask_permission",
    emoji: "📱",
    label: "Ask me first",
  },
  {
    value: "approved_only",
    emoji: "📋",
    label: "Approved foods only",
  },
];

export const SHARED_FOOD_OPTIONS: {
  value: SharedFoodPreference;
  emoji: string;
  label: string;
}[] = [
  {
    value: "always_allow",
    emoji: "✅",
    label: "Always allow",
  },
  {
    value: "ask_each_time",
    emoji: "📱",
    label: "Ask me each time",
  },
  {
    value: "do_not_offer",
    emoji: "🚫",
    label: "Do not offer",
  },
];

export function getEmergencySnackLabel(value: EmergencySnackPreference): string {
  const option = EMERGENCY_SNACK_OPTIONS.find((o) => o.value === value);
  return option ? `${option.emoji} ${option.label}` : value;
}

export function getSharedFoodLabel(value: SharedFoodPreference): string {
  const option = SHARED_FOOD_OPTIONS.find((o) => o.value === value);
  return option ? `${option.emoji} ${option.label}` : value;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: PreferenceChild[];
  savedPreferences: SchoolDayFoodPreference[];
  initialStudentId?: string | null;
  onSaved: (pref: SchoolDayFoodPreference) => void;
};

export default function SchoolDayFoodPreferencesSheet({
  open,
  onOpenChange,
  students,
  savedPreferences,
  initialStudentId,
  onSaved,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [emergencySnack, setEmergencySnack] =
    useState<EmergencySnackPreference | null>(null);
  const [sharedFood, setSharedFood] =
    useState<SharedFoodPreference | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savedByStudent = useMemo(() => {
    return Object.fromEntries(
      savedPreferences.map((p) => [p.student_id, p]),
    ) as Record<string, SchoolDayFoodPreference>;
  }, [savedPreferences]);

  const missingStudentIds = useMemo(
    () => students.filter((s) => !savedByStudent[s.id]).map((s) => s.id),
    [students, savedByStudent],
  );

  const activeStudent = students.find((s) => s.id === activeStudentId) ?? null;
  const showChildHeader = students.length > 1;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return;

    const targetId =
      initialStudentId ??
      missingStudentIds[0] ??
      students[0]?.id ??
      null;

    setActiveStudentId(targetId);

    if (targetId) {
      const existing = savedByStudent[targetId];
      setEmergencySnack(existing?.emergency_snack_preference ?? null);
      setSharedFood(existing?.shared_food_preference ?? null);
    }

    setError(null);
  }, [open, initialStudentId, missingStudentIds, students, savedByStudent]);

  async function handleSave() {
    if (!activeStudentId || !emergencySnack || !sharedFood) return;

    setSaving(true);
    setError(null);

    const result = await saveSchoolDayFoodPreferences(activeStudentId, {
      emergencySnack,
      sharedFood,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const saved: SchoolDayFoodPreference = {
      student_id: activeStudentId,
      emergency_snack_preference: emergencySnack,
      shared_food_preference: sharedFood,
    };

    onSaved(saved);
    onOpenChange(false);
  }

  function handleClose() {
    onOpenChange(false);
  }

  const canSave = !!emergencySnack && !!sharedFood && !saving;

  const formContent = (
    <>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-heading font-semibold text-gray-900">
            School Day Food Preferences
          </h2>
          {showChildHeader && activeStudent && (
            <div className="flex items-center gap-2 mt-2">
              {activeStudent.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeStudent.profile_image_url}
                  alt={activeStudent.child_legal_name}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 bg-[#4a7c59]">
                  {getInitials(activeStudent.child_legal_name)}
                </div>
              )}
              <p className="text-sm font-body text-gray-600">
                {activeStudent.child_legal_name}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm font-body text-gray-600 leading-relaxed mb-6">
        🍎 Snacks & shared food during the school day — saved to your
        child&apos;s profile. Update anytime.
      </p>

      <div className="flex flex-col gap-6 max-h-[50vh] overflow-y-auto pr-1">
        <section>
          <h3 className="text-sm font-semibold font-heading text-gray-900 mb-1">
            🚨 Emergency snacks
          </h3>
          <p className="text-xs font-body text-gray-500 mb-3 leading-relaxed">
            If their planned snack isn&apos;t available:
          </p>
          <div className="flex flex-col gap-2">
            {EMERGENCY_SNACK_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  emergencySnack === option.value
                    ? "border-[#4a7c59] bg-[#4a7c59]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="emergency_snack"
                  value={option.value}
                  checked={emergencySnack === option.value}
                  onChange={() => setEmergencySnack(option.value)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#4a7c59] cursor-pointer"
                />
                <span className="text-sm font-body text-gray-700 leading-relaxed">
                  {option.emoji} {option.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold font-heading text-gray-900 mb-1">
            🎁 Shared classroom food
          </h3>
          <p className="text-xs font-body text-gray-500 mb-3 leading-relaxed">
            Birthday treats, celebrations, or food from other families:
          </p>
          <div className="flex flex-col gap-2">
            {SHARED_FOOD_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  sharedFood === option.value
                    ? "border-[#4a7c59] bg-[#4a7c59]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="shared_food"
                  value={option.value}
                  checked={sharedFood === option.value}
                  onChange={() => setSharedFood(option.value)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#4a7c59] cursor-pointer"
                />
                <span className="text-sm font-body text-gray-700 leading-relaxed">
                  {option.emoji} {option.label}
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      {error && (
        <p className="mt-4 text-xs text-red-500 font-body">{error}</p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={`w-full py-3 rounded-xl text-sm font-semibold font-body transition-colors flex items-center justify-center gap-2 ${
            canSave
              ? "bg-[#4a7c59] text-white hover:bg-[#3d6b4a] cursor-pointer"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving…" : "Save Preferences"}
        </button>
        {missingStudentIds.length > 0 && (
          <button
            type="button"
            onClick={handleClose}
            className="w-full text-center text-xs font-body text-gray-400 hover:text-gray-600 transition-colors cursor-pointer py-1"
          >
            Maybe later
          </button>
        )}
      </div>
    </>
  );

  return (
    <AnimatePresence>
      {open &&
        (isMobile ? (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3 shrink-0" />
              <div className="p-6 pb-10 overflow-y-auto">{formContent}</div>
            </motion.div>
          </>
        ) : (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          >
            <motion.div
              className="relative w-full max-w-lg rounded-2xl shadow-2xl bg-white overflow-hidden max-h-[90vh] flex flex-col"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 overflow-y-auto">{formContent}</div>
            </motion.div>
          </motion.div>
        ))}
    </AnimatePresence>
  );
}
