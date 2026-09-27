"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft } from "lucide-react";
import { Merriweather } from "next/font/google";
import {
  PARENT_CALENDAR_ADD_EVENT_STEPS,
  defaultParentCalendarEventFormValues,
  type ParentCalendarEventFormValues,
} from "@/shared/parent/parentCalendarAddEvent";
import { saveParentCalendarEvent } from "@/app/actions/saveParentCalendarEvent";
import { updateParentCalendarEvent } from "@/app/actions/updateParentCalendarEvent";

const merriweather = Merriweather({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const colors = {
  border: "#E4EDE7",
  mistyForest: "#5E7C68",
  textPrimary: "#1A2A20",
  textSecondary: "#4B6356",
  textTertiary: "#8FA898",
  pastelSage: "#EBF3EE",
  warmLinen: "#F7FAF8",
};

const panelSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 36,
  mass: 0.7,
};

export type ParentCalendarEventRecord = {
  id: string;
  title: string;
  event_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string;
  category: string | null;
  shared_with: string[];
  programs: string[];
  description: string | null;
  location: string | null;
  recurrence: string | null;
  recurrence_end_date: string | null;
  attachment_links: string[];
  rsvp_enabled: boolean;
  reminder_email: boolean;
  reminder_in_app: boolean;
  reminder_timing: string | null;
  created_by: string | null;
};

function eventToFormValues(event: ParentCalendarEventRecord): ParentCalendarEventFormValues {
  const dateOnly = event.event_date.split("T")[0];
  return {
    title: event.title,
    event_date: dateOnly,
    is_all_day: event.is_all_day,
    start_time: event.start_time?.slice(0, 5) ?? "09:00",
    end_time: event.end_time?.slice(0, 5) ?? "10:00",
    location: event.location ?? "",
    description: event.description ?? "",
  };
}

type Props = {
  onClose: () => void;
  onSaved: (event: ParentCalendarEventRecord) => void;
  initialDate?: string | null;
  initialHour?: number | null;
  eventToEdit?: ParentCalendarEventRecord | null;
};

export default function ParentAddEventSheet({
  onClose,
  onSaved,
  initialDate,
  initialHour,
  eventToEdit,
}: Props) {
  const isEdit = !!eventToEdit;
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState<ParentCalendarEventFormValues>(() => {
    if (eventToEdit) return eventToFormValues(eventToEdit);
    const base = defaultParentCalendarEventFormValues(initialDate ?? undefined);
    if (initialHour != null) {
      return {
        ...base,
        is_all_day: false,
        start_time: `${String(initialHour).padStart(2, "0")}:00`,
        end_time: `${String(initialHour + 1).padStart(2, "0")}:00`,
      };
    }
    return base;
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialDate && !eventToEdit && !form.event_date) {
      setForm((f) => ({ ...f, event_date: initialDate }));
    }
  }, [initialDate, eventToEdit, form.event_date]);

  const step = PARENT_CALENDAR_ADD_EVENT_STEPS[stepIdx];

  function patch(partial: Partial<ParentCalendarEventFormValues>) {
    setForm((f) => ({ ...f, ...partial }));
    setError("");
  }

  function validateCurrentStep(): boolean {
    if (step.id === "title" && !form.title.trim()) {
      setError("Please add a name for your event.");
      return false;
    }
    if (step.id === "date" && !form.event_date) {
      setError("Please pick a date.");
      return false;
    }
    if (step.id === "time" && !form.is_all_day) {
      if (!form.start_time) {
        setError("Please choose a start time.");
        return false;
      }
      if (!form.end_time) {
        setError("Please choose an end time.");
        return false;
      }
      if (form.end_time <= form.start_time) {
        setError("End time should be after start time.");
        return false;
      }
    }
    setError("");
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    if (stepIdx < PARENT_CALENDAR_ADD_EVENT_STEPS.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      void handleSubmit();
    }
  }

  function goBack() {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
    else onClose();
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      event_date: form.event_date,
      is_all_day: form.is_all_day,
      start_time: form.is_all_day ? null : form.start_time,
      end_time: form.is_all_day ? null : form.end_time,
      description: form.description.trim() || undefined,
      location: form.location.trim() || undefined,
    };

    const result = isEdit && eventToEdit
      ? await updateParentCalendarEvent({ ...payload, id: eventToEdit.id })
      : await saveParentCalendarEvent(payload);

    setSaving(false);

    if (result.success && result.event) {
      onSaved(result.event as ParentCalendarEventRecord);
      onClose();
    } else {
      setError(result.message || "Something went wrong. Please try again.");
    }
  }

  const isLast = stepIdx === PARENT_CALENDAR_ADD_EVENT_STEPS.length - 1;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[80]"
        style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className="fixed top-0 right-0 h-full z-[90] flex flex-col"
        style={{
          width: "min(440px, 100vw)",
          backgroundColor: "white",
          borderLeft: `1px solid ${colors.border}`,
          boxShadow: "-16px 0 48px rgba(0,0,0,0.10)",
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={panelSpring}
      >
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
              Step {stepIdx + 1} of {PARENT_CALENDAR_ADD_EVENT_STEPS.length}
            </p>
            <h2
              className={`text-base font-bold mt-1 ${merriweather.className}`}
              style={{ color: colors.mistyForest }}
            >
              {isEdit ? "Edit event" : "Add to calendar"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{
              backgroundColor: colors.warmLinen,
              border: `1px solid ${colors.border}`,
              cursor: "pointer",
            }}
          >
            <X className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
          </button>
        </div>

        <div className="px-6 pt-4 flex gap-1.5 flex-shrink-0">
          {PARENT_CALENDAR_ADD_EVENT_STEPS.map((s, i) => (
            <div
              key={s.id}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                backgroundColor:
                  i <= stepIdx ? colors.mistyForest : colors.pastelSage,
              }}
            />
          ))}
        </div>

        <div className="flex-1 overflow-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h3
                className={`text-xl font-bold mb-2 ${merriweather.className}`}
                style={{ color: colors.textPrimary }}
              >
                {step.question}
              </h3>
              {step.hint && (
                <p className="text-sm mb-5" style={{ color: colors.textSecondary }}>
                  {step.hint}
                </p>
              )}

              {step.id === "title" && (
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Neighborhood playdate"
                  value={form.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  className="w-full px-4 py-3 text-sm rounded-xl outline-none"
                  style={{
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                  }}
                />
              )}

              {step.id === "date" && (
                <input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => patch({ event_date: e.target.value })}
                  className="w-full px-4 py-3 text-sm rounded-xl outline-none"
                  style={{
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                  }}
                />
              )}

              {step.id === "time" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {[
                      { label: "All day", value: true },
                      { label: "Set a time", value: false },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => patch({ is_all_day: opt.value })}
                        className="flex-1 py-3 text-sm font-semibold rounded-xl transition-colors"
                        style={{
                          cursor: "pointer",
                          border: `1px solid ${form.is_all_day === opt.value ? colors.mistyForest : colors.border}`,
                          backgroundColor:
                            form.is_all_day === opt.value
                              ? colors.pastelSage
                              : "white",
                          color:
                            form.is_all_day === opt.value
                              ? colors.mistyForest
                              : colors.textSecondary,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {!form.is_all_day && (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                          Starts
                        </span>
                        <input
                          type="time"
                          value={form.start_time}
                          onChange={(e) => patch({ start_time: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg"
                          style={{ border: `1px solid ${colors.border}` }}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                          Ends
                        </span>
                        <input
                          type="time"
                          value={form.end_time}
                          onChange={(e) => patch({ end_time: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg"
                          style={{ border: `1px solid ${colors.border}` }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {step.id === "details" && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                      Location (optional)
                    </span>
                    <input
                      type="text"
                      placeholder="Where is it?"
                      value={form.location}
                      onChange={(e) => patch({ location: e.target.value })}
                      className="mt-1 w-full px-4 py-3 text-sm rounded-xl outline-none"
                      style={{ border: `1px solid ${colors.border}` }}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                      Notes (optional)
                    </span>
                    <textarea
                      rows={4}
                      placeholder="Anything other parents should know?"
                      value={form.description}
                      onChange={(e) => patch({ description: e.target.value })}
                      className="mt-1 w-full px-4 py-3 text-sm rounded-xl outline-none resize-none"
                      style={{ border: `1px solid ${colors.border}` }}
                    />
                  </label>
                </div>
              )}

              {error && (
                <p className="mt-4 text-sm font-medium" style={{ color: "#B45309" }}>
                  {error}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className="flex items-center gap-3 px-6 py-5 flex-shrink-0"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium rounded-xl"
            style={{
              border: `1px solid ${colors.border}`,
              backgroundColor: "white",
              color: colors.textSecondary,
              cursor: "pointer",
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            {stepIdx === 0 ? "Cancel" : "Back"}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white"
            style={{
              backgroundColor: colors.mistyForest,
              border: "none",
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving
              ? "Saving…"
              : isLast
                ? isEdit
                  ? "Save changes"
                  : "Add to calendar"
                : "Next"}
          </button>
        </div>
      </motion.div>
    </>
  );
}
