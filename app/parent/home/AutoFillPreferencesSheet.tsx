"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Zap } from "lucide-react";
import type { Activity } from "@/app/actions/activities";
import type { StudentDefaultPreference } from "@/app/parent/preferences/page";
import type { HomeStudent } from "@/app/parent/home/page";
import {
  ChildAutoFillCard,
  getEligibleAutoFillStudents,
  type ParticipationLevel,
} from "@/app/parent/components/AutoFillPreferenceSection";

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

  function handleChildSaved(studentId: string, level: ParticipationLevel | null) {
    const without = studentDefaults.filter((d) => d.student_id !== studentId);
    const next =
      level !== null
        ? [...without, { student_id: studentId, participation_level: level }]
        : without;
    onDefaultsChange(next);
  }

  return (
    <AnimatePresence>
      {open && eligibleStudents.length > 0 ? (
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
                <Zap className="w-4 h-4 text-[#4a7c59]" />
                <span className="text-sm font-semibold text-gray-800 font-heading">
                  Activity auto-fill
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
              <p className="text-sm text-gray-500 font-body leading-relaxed">
                Set a default participation level so new activities are pre-filled
                automatically.
              </p>

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
                      initiallyExpanded={currentDefault === null}
                    />
                  );
                })}
              </div>

              {readOnly ? (
                <p className="text-xs text-gray-400 font-body">
                  Preview mode — preferences cannot be saved.
                </p>
              ) : null}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
