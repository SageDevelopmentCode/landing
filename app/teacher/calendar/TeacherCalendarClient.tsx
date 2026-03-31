"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X, Link2, Upload, Pencil, MapPin, Users, RefreshCw, Bell, Trash2 } from "lucide-react";
import { Merriweather } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { colors, radius, shadows } from "@/app/admin/design-system";
import { saveCalendarEvent } from "@/app/actions/saveCalendarEvent";
import { updateCalendarEvent } from "@/app/actions/updateCalendarEvent";
import { deleteCalendarEvent } from "@/app/actions/deleteCalendarEvent";

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

type ProgramKey = "summer" | "school";
type ViewMode = "monthly" | "weekly";

type CalendarEvent = {
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
  internal_notes: string | null;
  created_by: string | null;
};

const SHARE_GROUPS = ["Teachers", "Parents"];
const PROGRAM_PILLS = ["Pre-K – 1st Grade", "2nd – 4th Grade", "Both"];
const EVENT_CATEGORIES = [
  "Academic",
  "Field Trip",
  "Holiday",
  "Staff Meeting",
  "Parent Event",
  "Deadline",
  "Community",
  "Other",
];
const RECURRENCE_OPTIONS = ["None", "Daily", "Weekly", "Monthly"];
const EVENT_COLORS = [
  { label: "Sage",      value: "#5E7C68" },
  { label: "Sky",       value: "#5B9BBF" },
  { label: "Rose",      value: "#C2717A" },
  { label: "Marigold",  value: "#D49A3A" },
  { label: "Lavender",  value: "#8B7BAD" },
  { label: "Clay",      value: "#C47A52" },
  { label: "Slate",     value: "#6B7A8D" },
  { label: "Moss",      value: "#7A9E5E" },
];
const REMINDER_TIMING_OPTIONS = [
  "15 min before",
  "30 min before",
  "1 hour before",
  "1 day before",
];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM → 9 PM
const HOUR_HEIGHT = 120; // px per hour slot

function getOverlapClusters(events: CalendarEvent[]): CalendarEvent[][] {
  if (events.length === 0) return [];
  const toMin = (t: string | null) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const sorted = [...events].sort((a, b) => toMin(a.start_time) - toMin(b.start_time));
  const clusters: CalendarEvent[][] = [];
  for (const ev of sorted) {
    const evStart = toMin(ev.start_time);
    const evEnd = toMin(ev.end_time) || evStart + 60;
    let placed = false;
    for (const cluster of clusters) {
      const clusterEnd = Math.max(...cluster.map((c) => toMin(c.end_time) || toMin(c.start_time) + 60));
      const clusterStart = toMin(cluster[0].start_time);
      if (evStart < clusterEnd && evEnd > clusterStart) {
        cluster.push(ev);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([ev]);
  }
  return clusters;
}

const programs: Record<ProgramKey, { label: string; start: Date; end: Date }> =
  {
    summer: {
      label: "Summer 2026",
      start: new Date(2026, 4, 1),
      end: new Date(2026, 7, 31),
    },
    school: {
      label: "School Year 2026–2027",
      start: new Date(2026, 7, 1),
      end: new Date(2027, 4, 31),
    },
  };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  d.setDate(1);
  return d;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  for (let i = startPad - 1; i >= 0; i--) days.push(new Date(year, month, -i));
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  const rem = 7 - (days.length % 7);
  if (rem < 7) for (let i = 1; i <= rem; i++) days.push(new Date(year, month + 1, i));
  return days;
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function colorForId(id: string): string {
  const palette = ["#4a7c59", "#7c6b4a", "#5a6b8a", "#8a5a6b", "#6b7c4a", "#4a6b7c"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ─── Toggle Switch ──────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: colors.textSecondary }}>
        {label}
      </span>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        style={{
          width: "40px",
          height: "22px",
          borderRadius: radius.full,
          padding: 0,
          backgroundColor: checked ? colors.mistyForest : colors.warmLinen,
          border: `1px solid ${checked ? colors.mistyForest : colors.border}`,
          cursor: "pointer",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            width: "18px",
            height: "18px",
            borderRadius: radius.full,
            backgroundColor: "white",
            boxShadow: shadows.soft,
            transform: checked ? "translateX(19px)" : "translateX(1px)",
            transition: "transform 200ms",
            display: "block",
          }}
        />
      </button>
    </div>
  );
}

// ─── Add Event Panel ───────────────────────────────────────────────────────────

function AddEventPanel({
  onClose,
  onSave,
  onUpdate,
  initialDate,
  initialHour,
  currentUser,
  eventToEdit,
}: {
  onClose: () => void;
  onSave?: (event: CalendarEvent) => void;
  onUpdate?: (event: CalendarEvent) => void;
  initialDate?: Date | null;
  initialHour?: number | null;
  currentUser?: { full_name: string; role: string; id: string } | null;
  eventToEdit?: CalendarEvent | null;
}) {
  const isEditMode = !!eventToEdit;
  const [eventName, setEventName] = useState(eventToEdit?.title ?? "");
  const [eventDate, setEventDate] = useState(
    eventToEdit?.event_date ?? (initialDate ? formatDateInput(initialDate) : "")
  );
  // Default to "Teachers" for new events; preserve existing shared_with when editing
  const [selectedGroups, setSelectedGroups] = useState<string[]>(eventToEdit?.shared_with ?? ["Teachers"]);
  const [isAllDay, setIsAllDay] = useState(eventToEdit?.is_all_day ?? false);
  const [startTime, setStartTime] = useState(
    eventToEdit?.start_time ?? (initialHour != null ? `${String(initialHour).padStart(2, "0")}:00` : "")
  );
  const [endTime, setEndTime] = useState(
    eventToEdit?.end_time ?? (initialHour != null ? `${String(initialHour + 1).padStart(2, "0")}:00` : "")
  );
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(eventToEdit?.programs ?? []);
  const [eventCategory, setEventCategory] = useState(eventToEdit?.category ?? "");
  const [eventColor, setEventColor] = useState(eventToEdit?.color ?? EVENT_COLORS[0].value);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [recurrence, setRecurrence] = useState(eventToEdit?.recurrence ?? "None");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(eventToEdit?.recurrence_end_date ?? "");
  const [description, setDescription] = useState(eventToEdit?.description ?? "");
  const [location, setLocation] = useState(eventToEdit?.location ?? "");
  const [attachmentTab, setAttachmentTab] = useState<"link" | "file">("link");
  const [attachmentLinks, setAttachmentLinks] = useState<string[]>(eventToEdit?.attachment_links ?? []);
  const [attachmentLinkInput, setAttachmentLinkInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [rsvpEnabled, setRsvpEnabled] = useState(eventToEdit?.rsvp_enabled ?? false);
  const [reminderEmail, setReminderEmail] = useState(eventToEdit?.reminder_email ?? false);
  const [reminderInApp, setReminderInApp] = useState(eventToEdit?.reminder_in_app ?? false);
  const [reminderTiming, setReminderTiming] = useState(eventToEdit?.reminder_timing ?? "30 min before");
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [dateError, setDateError] = useState("");

  function toggleGroup(g: string) {
    setSelectedGroups((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  function toggleProgram(p: string) {
    setSelectedPrograms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function addLink() {
    const trimmed = attachmentLinkInput.trim();
    if (trimmed) {
      setAttachmentLinks((prev) => [...prev, trimmed]);
      setAttachmentLinkInput("");
    }
  }

  async function handleSubmit() {
    let valid = true;
    if (!eventName.trim()) {
      setTitleError("Event name is required");
      valid = false;
    } else {
      setTitleError("");
    }
    if (!eventDate) {
      setDateError("Date is required");
      valid = false;
    } else {
      setDateError("");
    }
    if (!valid) return;

    const payload = {
      title: eventName.trim(),
      event_date: eventDate,
      is_all_day: isAllDay,
      start_time: isAllDay ? null : startTime || null,
      end_time: isAllDay ? null : endTime || null,
      description: description || undefined,
      location: location || undefined,
      shared_with: selectedGroups,
      programs: selectedPrograms,
      category: eventCategory || undefined,
      color: eventColor,
      recurrence,
      recurrence_end_date: recurrenceEndDate || null,
      attachment_links: attachmentLinks,
      rsvp_enabled: rsvpEnabled,
      reminder_email: reminderEmail,
      reminder_in_app: reminderInApp,
      reminder_timing: reminderTiming,
    };

    setSaving(true);

    if (isEditMode && eventToEdit) {
      const result = await updateCalendarEvent({ ...payload, id: eventToEdit.id });
      setSaving(false);
      if (result.success && result.event) {
        onUpdate?.(result.event);
        onClose();
      } else {
        setTitleError(result.message || "Failed to update event");
      }
    } else {
      const result = await saveCalendarEvent({ ...payload, created_by: currentUser?.id });
      setSaving(false);
      if (result.success && result.event) {
        onSave?.(result.event);
        onClose();
      } else {
        setTitleError(result.message || "Failed to save event");
      }
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.10)" }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Panel */}
      <motion.div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "440px",
          backgroundColor: "white",
          borderLeft: `1px solid ${colors.border}`,
          boxShadow: "-12px 0 40px rgba(0,0,0,0.07)",
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${colors.divider}` }}
        >
          <div>
            <h2
              className={`text-base font-bold leading-none ${merriweather.className}`}
              style={{ color: colors.mistyForest }}
            >
              {isEditMode ? "Edit Event" : "New Event"}
            </h2>
            {initialDate && (
              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                {MONTHS[initialDate.getMonth()]} {initialDate.getDate()},{" "}
                {initialDate.getFullYear()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-60"
            style={{
              backgroundColor: colors.warmLinen,
              border: `1px solid ${colors.border}`,
              cursor: "pointer",
            }}
          >
            <X className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-auto px-6 py-6 space-y-5">
          {/* Event name */}
          <Field label="Event name">
            <input
              type="text"
              placeholder="e.g. Swimming Lessons"
              value={eventName}
              onChange={(e) => { setEventName(e.target.value); if (titleError) setTitleError(""); }}
              className="w-full px-3.5 py-2.5 text-sm outline-none"
              style={{ ...inputStyle, borderColor: titleError ? "#ef4444" : undefined }}
              onFocus={(e) => (e.target.style.borderColor = titleError ? "#ef4444" : colors.mistyForest)}
              onBlur={(e) => (e.target.style.borderColor = titleError ? "#ef4444" : colors.border)}
            />
            {titleError && (
              <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{titleError}</p>
            )}
          </Field>

          {/* Date */}
          <Field label="Date">
            <input
              type="date"
              value={eventDate}
              onChange={(e) => { setEventDate(e.target.value); if (dateError) setDateError(""); }}
              className="w-full px-3.5 py-2.5 text-sm outline-none"
              style={{ ...inputStyle, borderColor: dateError ? "#ef4444" : undefined }}
              onFocus={(e) => (e.target.style.borderColor = dateError ? "#ef4444" : colors.mistyForest)}
              onBlur={(e) => (e.target.style.borderColor = dateError ? "#ef4444" : colors.border)}
            />
            {dateError && (
              <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{dateError}</p>
            )}
          </Field>

          {/* All-day toggle */}
          <Field label="Schedule">
            <ToggleSwitch
              checked={isAllDay}
              onChange={setIsAllDay}
              label="All-day event"
            />
          </Field>

          {/* Time range — hidden when all-day */}
          <AnimatePresence>
          {!isAllDay && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: "hidden" }}
            >
            <Field label="Time">
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-sm outline-none"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
                  onBlur={(e) => (e.target.style.borderColor = colors.border)}
                />
                <span className="text-xs font-medium" style={{ color: colors.textTertiary }}>
                  to
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-sm outline-none"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
                  onBlur={(e) => (e.target.style.borderColor = colors.border)}
                />
              </div>
            </Field>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Description */}
          <Field label="Description">
            <textarea
              placeholder="Add a description..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
            />
          </Field>

          {/* Location */}
          <Field label="Location">
            <input
              type="text"
              placeholder="e.g. Main Gym, Room 14"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
            />
          </Field>

          {/* Share with */}
          <Field label="Share with">
            <div className="flex flex-wrap gap-2">
              {SHARE_GROUPS.map((g) => {
                const sel = selectedGroups.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGroup(g)}
                    className="px-3 py-1.5 text-xs font-medium transition-all duration-150"
                    style={{
                      backgroundColor: sel ? colors.pastelSage : colors.softCloud,
                      color: sel ? colors.mistyForest : colors.textSecondary,
                      border: `1px solid ${sel ? colors.pastelSage : colors.border}`,
                      borderRadius: radius.full,
                      cursor: "pointer",
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Program multiselect */}
          <Field label="Program">
            <div className="flex flex-wrap gap-2">
              {PROGRAM_PILLS.map((p) => {
                const sel = selectedPrograms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => toggleProgram(p)}
                    className="px-3 py-1.5 text-xs font-medium transition-all duration-150"
                    style={{
                      backgroundColor: sel ? colors.pastelSage : colors.softCloud,
                      color: sel ? colors.mistyForest : colors.textSecondary,
                      border: `1px solid ${sel ? colors.pastelSage : colors.border}`,
                      borderRadius: radius.full,
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Event category */}
          <Field label="Event category">
            <select
              value={eventCategory}
              onChange={(e) => setEventCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
            >
              <option value="">Select a category...</option>
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          {/* Event color */}
          <Field label="Event color">
            <div className="flex items-center gap-2 flex-wrap">
              {EVENT_COLORS.map((c) => {
                const selected = eventColor === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setEventColor(c.value)}
                    title={c.label}
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: radius.full,
                      backgroundColor: c.value,
                      border: selected ? `2.5px solid ${colors.textPrimary}` : "2.5px solid transparent",
                      outline: selected ? `2px solid white` : "none",
                      outlineOffset: "-4px",
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                      transition: "transform 120ms, border-color 120ms",
                      transform: selected ? "scale(1.18)" : "scale(1)",
                    }}
                  />
                );
              })}
            </div>
          </Field>

          {/* More options toggle */}
          <button
            onClick={() => setShowMoreOptions((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70 w-full"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.textTertiary,
              padding: 0,
            }}
          >
            <motion.span
              animate={{ rotate: showMoreOptions ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex" }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
            {showMoreOptions ? "Fewer options" : "More options"}
          </button>

          <AnimatePresence>
          {showMoreOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
              className="space-y-5"
            >

          {/* Recurring event */}
          <Field label="Recurring event">
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
            >
              {RECURRENCE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <AnimatePresence>
              {recurrence !== "None" && (
                <motion.div
                  className="mt-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: "hidden" }}
                >
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm outline-none"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
                    onBlur={(e) => (e.target.style.borderColor = colors.border)}
                  />
                  <p className="text-[10px] mt-1" style={{ color: colors.textTertiary }}>
                    End date for recurring series
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Field>

          {/* Attachments */}
          <Field label="Attachments">
            <div className="space-y-3">
              {/* Tab switcher */}
              <div
                className="flex p-0.5"
                style={{
                  backgroundColor: colors.warmLinen,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.md,
                }}
              >
                {(["link", "file"] as const).map((tab) => {
                  const active = attachmentTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setAttachmentTab(tab)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-all duration-150"
                      style={{
                        backgroundColor: active ? "white" : "transparent",
                        color: active ? colors.textPrimary : colors.textTertiary,
                        borderRadius: "10px",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: active ? shadows.soft : "none",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {tab === "link" ? (
                        <><Link2 className="w-3 h-3" /> Add Link</>
                      ) : (
                        <><Upload className="w-3 h-3" /> Upload File</>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Link tab */}
              <AnimatePresence mode="wait">
                {attachmentTab === "link" && (
                  <motion.div
                    key="link"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Paste a link..."
                        value={attachmentLinkInput}
                        onChange={(e) => setAttachmentLinkInput(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 text-sm outline-none"
                        style={inputStyle}
                        onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
                        onBlur={(e) => (e.target.style.borderColor = colors.border)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addLink();
                          }
                        }}
                      />
                      <button
                        onClick={addLink}
                        className="px-3 py-2.5 text-xs font-medium transition-opacity hover:opacity-75"
                        style={{
                          backgroundColor: colors.pastelSage,
                          color: colors.mistyForest,
                          borderRadius: radius.md,
                          border: "none",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        Add
                      </button>
                    </div>

                    {attachmentLinks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {attachmentLinks.map((link, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 px-2.5 py-1"
                            style={{
                              backgroundColor: colors.softCloud,
                              border: `1px solid ${colors.border}`,
                              borderRadius: radius.full,
                              maxWidth: "220px",
                            }}
                          >
                            <Link2 className="w-2.5 h-2.5 flex-shrink-0" style={{ color: colors.textTertiary }} />
                            <span
                              className="text-xs truncate"
                              style={{ color: colors.textSecondary }}
                            >
                              {link}
                            </span>
                            <button
                              onClick={() =>
                                setAttachmentLinks((prev) => prev.filter((_, i) => i !== idx))
                              }
                              style={{
                                border: "none",
                                backgroundColor: "transparent",
                                cursor: "pointer",
                                padding: 0,
                                flexShrink: 0,
                              }}
                            >
                              <X className="w-3 h-3" style={{ color: colors.textTertiary }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* File tab */}
                {attachmentTab === "file" && (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []).map((f) => f.name);
                        setAttachedFiles((prev) => [...prev, ...files]);
                        e.target.value = "";
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-6 flex flex-col items-center justify-center gap-2 transition-colors duration-150 hover:bg-gray-50"
                      style={{
                        backgroundColor: colors.warmLinen,
                        border: `1.5px dashed ${colors.border}`,
                        borderRadius: radius.md,
                        cursor: "pointer",
                      }}
                    >
                      <Upload className="w-4 h-4" style={{ color: colors.textTertiary }} />
                      <span className="text-xs" style={{ color: colors.textSecondary }}>
                        Click to browse files
                      </span>
                    </button>

                    {attachedFiles.length > 0 && (
                      <div className="space-y-1">
                        {attachedFiles.map((name, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-3 py-2"
                            style={{
                              backgroundColor: colors.softCloud,
                              border: `1px solid ${colors.border}`,
                              borderRadius: radius.md,
                            }}
                          >
                            <span
                              className="text-xs truncate"
                              style={{ color: colors.textSecondary }}
                            >
                              {name}
                            </span>
                            <button
                              onClick={() =>
                                setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
                              }
                              style={{
                                border: "none",
                                backgroundColor: "transparent",
                                cursor: "pointer",
                                padding: 0,
                                flexShrink: 0,
                              }}
                            >
                              <X className="w-3 h-3" style={{ color: colors.textTertiary }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Field>

          {/* RSVP / Attendance */}
          <Field label="RSVP / Attendance">
            <ToggleSwitch
              checked={rsvpEnabled}
              onChange={setRsvpEnabled}
              label="Allow parents to RSVP"
            />
          </Field>

          {/* Reminders */}
          <Field label="Reminders">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderEmail}
                    onChange={(e) => setReminderEmail(e.target.checked)}
                    style={{ accentColor: colors.mistyForest }}
                  />
                  <span className="text-xs" style={{ color: colors.textSecondary }}>
                    Email
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderInApp}
                    onChange={(e) => setReminderInApp(e.target.checked)}
                    style={{ accentColor: colors.mistyForest }}
                  />
                  <span className="text-xs" style={{ color: colors.textSecondary }}>
                    In-app
                  </span>
                </label>
              </div>
              <AnimatePresence>
                {(reminderEmail || reminderInApp) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: "hidden" }}
                  >
                    <select
                      value={reminderTiming}
                      onChange={(e) => setReminderTiming(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm outline-none"
                      style={inputStyle}
                    >
                      {REMINDER_TIMING_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Field>

          {/* Created by */}
          {currentUser && (
            <Field label="Created by">
              <div
                className="flex items-center gap-3 px-3.5 py-2.5"
                style={{
                  backgroundColor: colors.softCloud,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.md,
                }}
              >
                <div
                  className="flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: radius.full,
                    backgroundColor: colorForId(currentUser.id),
                  }}
                >
                  {initialsFor(currentUser.full_name)}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {currentUser.full_name}
                  </p>
                  <p className="text-[10px] capitalize" style={{ color: colors.textTertiary }}>
                    {currentUser.role.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </Field>
          )}

            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex gap-2 flex-shrink-0"
          style={{ borderTop: `1px solid ${colors.divider}` }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-70"
            style={{
              backgroundColor: colors.warmLinen,
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-90"
            style={{
              backgroundColor: colors.mistyForest,
              color: "white",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : isEditMode ? "Save Changes" : "Add Event"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  backgroundColor: colors.softCloud,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  color: colors.textPrimary,
  transition: "border-color 150ms",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-xs font-medium mb-1.5 uppercase tracking-wide"
        style={{ color: colors.textTertiary }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Overlap Panel ─────────────────────────────────────────────────────────────

function OverlapPanel({
  events,
  usersMap,
  onClose,
  onViewEvent,
}: {
  events: CalendarEvent[];
  usersMap: Record<string, string>;
  onClose: () => void;
  onViewEvent: (ev: CalendarEvent) => void;
}) {
  const first = events[0];
  const timeLabel = first?.start_time
    ? `${formatTime(first.start_time)}${first.end_time ? ` – ${formatTime(first.end_time)}` : ""}`
    : "";

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.10)" }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "380px",
          backgroundColor: "white",
          borderLeft: `1px solid ${colors.border}`,
          boxShadow: "-12px 0 40px rgba(0,0,0,0.07)",
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <div>
            {timeLabel && (
              <p className="text-xs font-medium mb-0.5" style={{ color: colors.textSecondary }}>
                {timeLabel}
              </p>
            )}
            <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
              {events.length} events
            </h2>
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: colors.textSecondary }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Event list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {events.map((ev) => {
            const creatorName = ev.created_by ? usersMap[ev.created_by] : null;
            const evTime = ev.start_time
              ? `${formatTime(ev.start_time)}${ev.end_time ? ` – ${formatTime(ev.end_time)}` : ""}`
              : "All day";
            return (
              <button
                key={ev.id}
                onClick={() => onViewEvent(ev)}
                className="w-full text-left rounded-lg px-3 py-3 transition-opacity hover:opacity-90 relative"
                style={{ backgroundColor: ev.color }}
              >
                {/* Badges */}
                {(ev.shared_with ?? []).length > 0 && (
                  <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                    {(ev.shared_with ?? []).map((g) => (
                      <span
                        key={g}
                        className="leading-none"
                        style={{
                          fontSize: "9px",
                          fontWeight: 600,
                          color: SHARE_COLORS[g] ?? ev.color,
                          backgroundColor: "white",
                          borderRadius: "3px",
                          padding: "2px 5px",
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {/* Title */}
                <p className="text-sm font-semibold text-white leading-tight">{ev.title}</p>
                {/* Time + category */}
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>{evTime}</p>
                  {ev.category && (
                    <p className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                      {ev.category}
                    </p>
                  )}
                </div>
                {/* Creator */}
                {creatorName && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className="inline-flex items-center justify-center text-[8px] font-bold leading-none"
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.30)",
                        color: "white",
                        border: "1.5px solid rgba(255,255,255,0.55)",
                        flexShrink: 0,
                      }}
                    >
                      {initialsFor(creatorName)}
                    </span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.75)" }}>
                      {creatorName}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

// ─── Event Detail Panel ────────────────────────────────────────────────────────

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function EventDetailPanel({
  event,
  usersMap,
  onClose,
  onEdit,
  onDelete,
  currentUser,
}: {
  event: CalendarEvent;
  usersMap: Record<string, string>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  currentUser?: { id: string; full_name: string; role: string } | null;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = !!currentUser && currentUser.id === event.created_by;

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteCalendarEvent(event.id);
    if (result.success) {
      onDelete();
    } else {
      setDeleting(false);
      console.error("Failed to delete event:", result.error);
    }
  }

  const [eventDate] = event.event_date.split("T");
  const [year, month, day] = eventDate.split("-").map(Number);
  const dateLabel = `${MONTHS[month - 1]} ${day}, ${year}`;

  const timeLabel = event.is_all_day
    ? "All day"
    : event.start_time
    ? `${formatTime(event.start_time)}${event.end_time ? ` – ${formatTime(event.end_time)}` : ""}`
    : null;

  const creatorName = event.created_by ? usersMap[event.created_by] : null;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.10)" }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "420px",
          backgroundColor: "white",
          borderLeft: `1px solid ${colors.border}`,
          boxShadow: "-12px 0 40px rgba(0,0,0,0.07)",
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
      >
        {/* Color bar + header */}
        <div
          className="flex items-start justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${colors.divider}` }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="flex-shrink-0 mt-0.5"
              style={{
                width: "10px",
                height: "10px",
                borderRadius: radius.full,
                backgroundColor: event.color,
                marginTop: "5px",
              }}
            />
            <div className="min-w-0">
              <h2
                className={`text-base font-bold leading-snug ${merriweather.className}`}
                style={{ color: colors.textPrimary }}
              >
                {event.title}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                {dateLabel}
                {timeLabel ? ` · ${timeLabel}` : ""}
              </p>
              {event.category && (
                <span
                  className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: `${event.color}22`,
                    color: event.color,
                    borderRadius: radius.full,
                    border: `1px solid ${event.color}44`,
                  }}
                >
                  {event.category}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-60 flex-shrink-0"
            style={{
              backgroundColor: colors.warmLinen,
              border: `1px solid ${colors.border}`,
              cursor: "pointer",
            }}
          >
            <X className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
          {event.description && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: colors.textTertiary }}>
                Description
              </p>
              <p className="text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
                {event.description}
              </p>
            </div>
          )}

          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: colors.textTertiary }} />
              <p className="text-sm" style={{ color: colors.textPrimary }}>{event.location}</p>
            </div>
          )}

          {(event.shared_with ?? []).length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Users className="w-3.5 h-3.5" style={{ color: colors.textTertiary }} />
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                  Shared with
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(event.shared_with ?? []).map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: colors.pastelSage,
                      color: colors.mistyForest,
                      borderRadius: radius.full,
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(event.programs ?? []).length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: colors.textTertiary }}>
                Program
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(event.programs ?? []).map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: colors.softCloud,
                      color: colors.textSecondary,
                      borderRadius: radius.full,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {event.recurrence && event.recurrence !== "None" && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.textTertiary }} />
              <p className="text-sm" style={{ color: colors.textPrimary }}>
                Repeats {event.recurrence.toLowerCase()}
                {event.recurrence_end_date ? ` until ${event.recurrence_end_date}` : ""}
              </p>
            </div>
          )}

          {(event.attachment_links ?? []).length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Link2 className="w-3.5 h-3.5" style={{ color: colors.textTertiary }} />
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                  Attachments
                </p>
              </div>
              <div className="flex flex-col gap-1">
                {(event.attachment_links ?? []).map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs truncate hover:underline"
                    style={{ color: colors.mistyForest }}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}

          {(event.reminder_email || event.reminder_in_app) && (
            <div className="flex items-start gap-2">
              <Bell className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: colors.textTertiary }} />
              <p className="text-sm" style={{ color: colors.textPrimary }}>
                Reminder {event.reminder_timing ?? "30 min before"}
                {event.reminder_email && event.reminder_in_app
                  ? " (email + in-app)"
                  : event.reminder_email
                  ? " (email)"
                  : " (in-app)"}
              </p>
            </div>
          )}

          {event.rsvp_enabled && (
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{
                backgroundColor: colors.pastelSage,
                borderRadius: radius.md,
              }}
            >
              <Users className="w-3.5 h-3.5" style={{ color: colors.mistyForest }} />
              <p className="text-xs font-medium" style={{ color: colors.mistyForest }}>
                RSVP enabled for parents
              </p>
            </div>
          )}

          {creatorName && (
            <div className="flex items-center gap-2.5 pt-1">
              <div
                className="flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: radius.full,
                  backgroundColor: colorForId(event.created_by!),
                }}
              >
                {initialsFor(creatorName)}
              </div>
              <p className="text-xs" style={{ color: colors.textTertiary }}>
                Created by <span style={{ color: colors.textSecondary, fontWeight: 500 }}>{creatorName}</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {isOwner && (
          <div
            className="px-6 py-4 flex-shrink-0 space-y-2"
            style={{ borderTop: `1px solid ${colors.divider}` }}
          >
            {!confirmDelete && (
              <>
                <button
                  onClick={onEdit}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: colors.mistyForest,
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Event
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                    border: "1px solid #fca5a5",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Event
                </button>
              </>
            )}
            {confirmDelete && (
              <div>
                <p className="text-sm text-center mb-2" style={{ color: colors.textSecondary }}>
                  Are you sure you want to delete this event?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: "#b91c1c",
                      color: "white",
                      border: "none",
                      cursor: deleting ? "not-allowed" : "pointer",
                      opacity: deleting ? 0.6 : 1,
                    }}
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: colors.warmLinen,
                      color: colors.textSecondary,
                      border: `1px solid ${colors.border}`,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TeacherCalendarClient({
  currentUser,
  initialEvents = [],
  usersMap = {},
}: {
  currentUser?: { full_name: string; role: string; id: string } | null;
  initialEvents?: CalendarEvent[];
  usersMap?: Record<string, string>;
}) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [viewEvent, setViewEvent] = useState<CalendarEvent | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ProgramKey>("summer");
  const [view, setView] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(programs.summer.start)
  );
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);
  const [addEventTime, setAddEventTime] = useState<number | null>(null);
  const [overlapEvents, setOverlapEvents] = useState<CalendarEvent[] | null>(null);

  const program = programs[selectedProgram];
  const today = new Date();

  const atMonthStart =
    currentDate.getFullYear() === program.start.getFullYear() &&
    currentDate.getMonth() === program.start.getMonth();
  const atMonthEnd =
    currentDate.getFullYear() === program.end.getFullYear() &&
    currentDate.getMonth() === program.end.getMonth();

  const weekStart = startOfWeek(currentDate);
  const weekEnd = addDays(weekStart, 4);
  const atWeekStart = weekStart <= program.start;
  const atWeekEnd = weekEnd >= program.end;

  function handleProgramSelect(key: ProgramKey) {
    setSelectedProgram(key);
    setCurrentDate(new Date(programs[key].start));
  }

  function handlePrev() {
    if (view === "monthly" && !atMonthStart) setCurrentDate((d) => addMonths(d, -1));
    if (view === "weekly" && !atWeekStart) setCurrentDate((d) => addDays(d, -7));
  }

  function handleNext() {
    if (view === "monthly" && !atMonthEnd) setCurrentDate((d) => addMonths(d, 1));
    if (view === "weekly" && !atWeekEnd) setCurrentDate((d) => addDays(d, 7));
  }

  function openAddEvent(date?: Date, hour?: number) {
    setAddEventDate(date ?? null);
    setAddEventTime(hour ?? null);
    setAddEventOpen(true);
  }

  const navLabel =
    view === "monthly"
      ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : (() => {
          const ws = startOfWeek(currentDate);
          const we = addDays(ws, 4);
          const sm = MONTHS[ws.getMonth()].slice(0, 3);
          const em = MONTHS[we.getMonth()].slice(0, 3);
          return ws.getMonth() === we.getMonth()
            ? `${sm} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`
            : `${sm} ${ws.getDate()} – ${em} ${we.getDate()}, ${we.getFullYear()}`;
        })();

  const prevDisabled = view === "monthly" ? atMonthStart : atWeekStart;
  const nextDisabled = view === "monthly" ? atMonthEnd : atWeekEnd;

  const monthDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const ws = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(ws, i));

  return (
    <>
      {/* Full-bleed layout that cancels the main's padding */}
      <div
        className="flex h-full"
        style={{ minHeight: 0 }}
      >
        {/* ── Left Panel ── */}
        <aside
          className="flex-shrink-0 flex flex-col pt-7 pb-6"
          style={{
            width: "168px",
            borderRight: `1px solid ${colors.border}`,
            backgroundColor: colors.warmLinen,
          }}
        >
          <p
            className="px-4 text-[10px] font-semibold uppercase tracking-[0.12em] mb-3"
            style={{ color: colors.textTertiary }}
          >
            Programs
          </p>
          <nav className="space-y-0.5 px-2">
            {(
              Object.entries(programs) as [
                ProgramKey,
                (typeof programs)[ProgramKey]
              ][]
            ).map(([key, prog]) => {
              const active = selectedProgram === key;
              return (
                <button
                  key={key}
                  onClick={() => handleProgramSelect(key)}
                  className="w-full text-left px-3 py-2 text-sm transition-all duration-150"
                  style={{
                    backgroundColor: active ? colors.pastelSage : "transparent",
                    color: active ? colors.mistyForest : colors.textSecondary,
                    fontWeight: active ? 600 : 400,
                    borderRadius: radius.sm,
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {prog.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Calendar Area ── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: "white" }}>
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{
              backgroundColor: "white",
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            {/* Left: nav + label */}
            <div className="flex items-center gap-1">
              <NavButton onClick={handlePrev} disabled={prevDisabled} aria-label="Previous">
                <ChevronLeft className="w-4 h-4" />
              </NavButton>
              <NavButton onClick={handleNext} disabled={nextDisabled} aria-label="Next">
                <ChevronRight className="w-4 h-4" />
              </NavButton>
              <span
                className="ml-2 text-sm font-semibold"
                style={{ color: colors.textPrimary }}
              >
                {navLabel}
              </span>
            </div>

            {/* Right: Add Event + view toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAddEvent()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: colors.mistyForest,
                  color: "white",
                  border: "none",
                  borderRadius: radius.md,
                  cursor: "pointer",
                  boxShadow: shadows.soft,
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Event
              </button>

              {/* Segmented control */}
              <div
                className="flex p-0.5"
                style={{
                  backgroundColor: colors.warmLinen,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.md,
                }}
              >
                {(["monthly", "weekly"] as ViewMode[]).map((v) => {
                  const active = view === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className="px-3.5 py-1 text-sm font-medium transition-all duration-150 capitalize"
                      style={{
                        backgroundColor: active ? "white" : "transparent",
                        color: active ? colors.textPrimary : colors.textTertiary,
                        borderRadius: "10px",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: active ? shadows.soft : "none",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Calendar body — flush, no padding */}
          <div className="flex-1 overflow-hidden">
            {view === "monthly" ? (
              <MonthlyGrid
                days={monthDays}
                currentMonth={currentDate.getMonth()}
                today={today}
                onAddEvent={openAddEvent}
                onViewEvent={setViewEvent}
                events={events}
              />
            ) : (
              <WeeklyGrid
                weekDays={weekDays}
                today={today}
                onAddEvent={openAddEvent}
                onViewEvent={setViewEvent}
                onViewOverlap={setOverlapEvents}
                events={events}
                usersMap={usersMap}
              />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {addEventOpen && (
          <AddEventPanel
            onClose={() => {
              setAddEventOpen(false);
              setAddEventTime(null);
            }}
            onSave={(event) => setEvents((prev) => [...prev, event])}
            initialDate={addEventDate}
            initialHour={addEventTime}
            currentUser={currentUser}
          />
        )}
        {overlapEvents && !viewEvent && !editEvent && (
          <OverlapPanel
            events={overlapEvents}
            usersMap={usersMap}
            onClose={() => setOverlapEvents(null)}
            onViewEvent={(ev) => { setOverlapEvents(null); setViewEvent(ev); }}
          />
        )}
        {viewEvent && !editEvent && (
          <EventDetailPanel
            event={viewEvent}
            usersMap={usersMap}
            currentUser={currentUser}
            onClose={() => setViewEvent(null)}
            onEdit={() => {
              setEditEvent(viewEvent);
              setViewEvent(null);
            }}
            onDelete={() => {
              setEvents((prev) => prev.filter((e) => e.id !== viewEvent.id));
              setViewEvent(null);
            }}
          />
        )}
        {editEvent && (
          <AddEventPanel
            onClose={() => setEditEvent(null)}
            onUpdate={(updated) => {
              setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
              setEditEvent(null);
            }}
            eventToEdit={editEvent}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Nav Button ────────────────────────────────────────────────────────────────

function NavButton({
  onClick,
  disabled,
  children,
  "aria-label": ariaLabel,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  "aria-label": string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="p-1.5 rounded-lg transition-all duration-150"
      style={{
        backgroundColor: "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        color: colors.textSecondary,
      }}
    >
      {children}
    </button>
  );
}

// ─── Monthly Grid ──────────────────────────────────────────────────────────────

function MonthlyGrid({
  days,
  currentMonth,
  today,
  onAddEvent,
  onViewEvent,
  events,
}: {
  days: Date[];
  currentMonth: number;
  today: Date;
  onAddEvent: (date: Date) => void;
  onViewEvent: (event: CalendarEvent) => void;
  events: CalendarEvent[];
}) {
  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Day name header */}
      <div
        className="grid grid-cols-7 flex-shrink-0"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: colors.textTertiary }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1" style={{ alignContent: "start" }}>
        {days.map((day, i) => {
          const inMonth = day.getMonth() === currentMonth;
          const isToday = isSameDay(day, today);
          const dateStr = formatDateInput(day);
          const dayEvents = events.filter((e) => e.event_date === dateStr);
          const visibleEvents = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visibleEvents.length;
          return (
            <div
              key={i}
              className="group relative p-2 flex flex-col transition-colors duration-100 hover:bg-gray-50"
              style={{
                minHeight: "128px",
                borderRight: (i + 1) % 7 === 0 ? "none" : `1px solid ${colors.border}`,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <span
                className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold mb-1 transition-colors"
                style={{
                  borderRadius: radius.full,
                  backgroundColor: isToday ? colors.mistyForest : "transparent",
                  color: isToday ? "white" : inMonth ? colors.textPrimary : colors.textTertiary,
                  opacity: inMonth ? 1 : 0.4,
                }}
              >
                {day.getDate()}
              </span>

              {/* Event pills */}
              {inMonth && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {visibleEvents.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); onViewEvent(ev); }}
                      className="truncate px-1.5 py-0.5 text-[10px] font-medium leading-tight text-left transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: ev.color,
                        color: "white",
                        borderRadius: "4px",
                        border: "none",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      {ev.title}
                    </button>
                  ))}
                  {overflow > 0 && (
                    <span
                      className="text-[10px] px-1"
                      style={{ color: colors.textTertiary }}
                    >
                      +{overflow} more
                    </span>
                  )}
                </div>
              )}

              {/* Add button — appears on hover */}
              {inMonth && (
                <button
                  onClick={() => onAddEvent(day)}
                  className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center w-5 h-5"
                  style={{
                    backgroundColor: colors.pastelSage,
                    color: colors.mistyForest,
                    borderRadius: radius.sm,
                    border: "none",
                    cursor: "pointer",
                  }}
                  title={`Add event on ${MONTHS[day.getMonth()]} ${day.getDate()}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Weekly Grid ───────────────────────────────────────────────────────────────

const SHARE_COLORS: Record<string, string> = {
  "Teachers": "#5B9BBF",
  "Parents": "#C2717A",
};

function WeeklyGrid({
  weekDays,
  today,
  onAddEvent,
  onViewEvent,
  onViewOverlap,
  events,
  usersMap,
}: {
  weekDays: Date[];
  today: Date;
  onAddEvent: (date: Date, hour?: number) => void;
  onViewEvent: (event: CalendarEvent) => void;
  onViewOverlap: (events: CalendarEvent[]) => void;
  events: CalendarEvent[];
  usersMap: Record<string, string>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const todayInWeek = weekDays.some((d) => isSameDay(d, today));
  const currentTimeTop =
    todayInWeek && now.getHours() >= 7 && now.getHours() < 22
      ? (now.getHours() - 7 + now.getMinutes() / 60) * HOUR_HEIGHT
      : null;

  useEffect(() => {
    if (scrollRef.current) {
      const offset = Math.max(0, (now.getHours() - 7 - 1.5) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = offset;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const GUTTER = 52; // px — time label column width

  return (
    // Single scrollable container — header is sticky inside it
    <div ref={scrollRef} className="h-full overflow-y-auto">
      {/* ── Sticky day header ── */}
      <div
        className="sticky top-0 z-10 flex bg-white"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        {/* Gutter spacer */}
        <div
          style={{
            width: `${GUTTER}px`,
            flexShrink: 0,
            borderRight: `1px solid ${colors.border}`,
          }}
        />
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          const dateStr = formatDateInput(day);
          const allDayEvents = events.filter((e) => e.event_date === dateStr && e.is_all_day);
          return (
            <div
              key={i}
              className="flex-1 py-3 flex flex-col items-center gap-1 relative group"
              style={{
                borderRight: i === 4 ? "none" : `1px solid ${colors.border}`,
                backgroundColor: isToday ? "#f8fbf9" : "white",
              }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: isToday ? colors.mistyForest : colors.textTertiary }}
              >
                {WEEK_DAYS[i]}
              </span>
              <div
                className="flex items-center justify-center w-8 h-8 text-sm font-semibold"
                style={{
                  borderRadius: radius.full,
                  backgroundColor: isToday ? colors.mistyForest : "transparent",
                  color: isToday ? "white" : colors.textPrimary,
                }}
              >
                {day.getDate()}
              </div>
              {allDayEvents.length > 0 && (
                <div className="w-full px-1 flex flex-col gap-0.5">
                  {allDayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="truncate px-1.5 py-0.5 text-[9px] font-medium"
                      style={{
                        backgroundColor: ev.color,
                        color: "white",
                        borderRadius: "3px",
                      }}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => onAddEvent(day)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center w-5 h-5"
                style={{
                  backgroundColor: colors.pastelSage,
                  color: colors.mistyForest,
                  borderRadius: radius.sm,
                  border: "none",
                  cursor: "pointer",
                }}
                title={`Add event on ${MONTHS[day.getMonth()]} ${day.getDate()}`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Time grid ── */}
      <div
        className="flex relative"
        style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
      >
        {/* Time label gutter */}
        <div
          className="flex-shrink-0 relative"
          style={{ width: `${GUTTER}px`, borderRight: `1px solid ${colors.border}` }}
        >
          {HOURS.map((h, i) => (
            <div
              key={h}
              className="absolute flex items-center justify-end pr-2"
              style={{
                top: `${i * HOUR_HEIGHT}px`,
                width: `${GUTTER}px`,
              }}
            >
              {i > 0 && (
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: colors.textTertiary,
                    transform: "translateY(-50%)",
                    display: "block",
                  }}
                >
                  {h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Day columns — flex (not grid) to match header exactly */}
        <div className="flex-1 flex relative">
          {/* Current time indicator */}
          {currentTimeTop !== null && (
            <div
              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
              style={{ top: `${currentTimeTop}px` }}
            >
              <div
                className="rounded-full flex-shrink-0"
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#ef4444",
                  marginLeft: "-4px",
                }}
              />
              <div
                className="flex-1"
                style={{ height: "1.5px", backgroundColor: "#ef4444" }}
              />
            </div>
          )}

          {weekDays.map((day, colIdx) => {
            const isToday = isSameDay(day, today);
            const dateStr = formatDateInput(day);
            const timedEvents = events.filter(
              (e) => e.event_date === dateStr && !e.is_all_day && e.start_time
            );
            return (
              <div
                key={colIdx}
                className="flex-1 relative"
                style={{
                  borderRight: colIdx === 4 ? "none" : `1px solid ${colors.border}`,
                  backgroundColor: isToday ? "#f8fbf9" : "white",
                }}
              >
                {HOURS.map((h, rowIdx) => (
                  <button
                    key={rowIdx}
                    onClick={() => onAddEvent(day, h)}
                    className="group relative hover:bg-[#e8f0ec] transition-colors duration-100"
                    style={{
                      display: "block",
                      width: "100%",
                      height: `${HOUR_HEIGHT}px`,
                      border: "none",
                      padding: 0,
                      borderBottom:
                        rowIdx === HOURS.length - 1
                          ? "none"
                          : `1px solid ${colors.border}`,
                      backgroundColor: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none"
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.mistyForest,
                        fontSize: "18px",
                        fontWeight: 300,
                        lineHeight: 1,
                      }}
                    >
                      +
                    </span>
                  </button>
                ))}
                {/* Timed event blocks */}
                {getOverlapClusters(timedEvents).map((cluster) => {
                  const ev = cluster[0];
                  const [sh, sm] = (ev.start_time ?? "").split(":").map(Number);
                  const startMinutes = sh * 60 + (sm || 0);
                  const gridStart = 7 * 60;
                  const topPx = ((startMinutes - gridStart) / 60) * HOUR_HEIGHT;
                  let basePx = HOUR_HEIGHT;
                  if (ev.end_time) {
                    const [eh, em] = ev.end_time.split(":").map(Number);
                    const endMinutes = eh * 60 + (em || 0);
                    basePx = Math.max(22, ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT);
                  }

                  const isMulti = cluster.length > 1;
                  const CARD_H = 56;
                  const MORE_BAR_H = 14;
                  const needsMoreBar = cluster.length > 2;
                  const moreCount = cluster.length - 2;
                  const heightPx = isMulti
                    ? Math.max(basePx, 2 * CARD_H + 1 + (needsMoreBar ? MORE_BAR_H : 0))
                    : basePx;
                  const singleShowMeta = !isMulti && basePx >= 52;

                  const renderCard = (cardEv: CalendarEvent, cardTop: number, cardHeight: number | undefined, cardBottom: number | undefined, cardRadius: string) => {
                    const cardCreator = cardEv.created_by ? usersMap[cardEv.created_by] : null;
                    const showMeta = cardHeight != null ? cardHeight >= 52 : (cardBottom != null ? (heightPx - cardTop - cardBottom) >= 52 : singleShowMeta);
                    return (
                      <button
                        key={cardEv.id}
                        onClick={(e) => { e.stopPropagation(); onViewEvent(cardEv); }}
                        className="absolute px-1.5 py-1 overflow-hidden text-left transition-opacity hover:opacity-85"
                        style={{
                          top: cardTop,
                          bottom: cardBottom,
                          height: cardHeight,
                          left: 0,
                          right: "20px",
                          backgroundColor: cardEv.color,
                          borderRadius: cardRadius,
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-start",
                        }}
                      >
                        {showMeta && (cardEv.shared_with ?? []).length > 0 && (
                          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                            {(cardEv.shared_with ?? []).map((g) => (
                              <span
                                key={g}
                                className="leading-none"
                                style={{
                                  fontSize: "8px",
                                  fontWeight: 600,
                                  color: SHARE_COLORS[g] ?? cardEv.color,
                                  backgroundColor: "white",
                                  borderRadius: "3px",
                                  padding: "1px 4px",
                                }}
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] font-semibold leading-tight truncate" style={{ color: "white" }}>
                          {cardEv.title}
                        </p>
                        {showMeta && cardEv.category && (
                          <p className="truncate leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.80)", fontSize: "8px", fontWeight: 500 }}>
                            {cardEv.category}
                          </p>
                        )}
                        {showMeta && cardCreator && (
                          <span
                            className="inline-flex items-center justify-center text-[8px] font-bold leading-none"
                            style={{
                              position: "absolute",
                              bottom: "4px",
                              right: "4px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              backgroundColor: "rgba(255,255,255,0.30)",
                              color: "white",
                              border: "1.5px solid rgba(255,255,255,0.55)",
                              flexShrink: 0,
                            }}
                          >
                            {initialsFor(cardCreator)}
                          </span>
                        )}
                      </button>
                    );
                  };

                  return (
                    <div
                      key={ev.id}
                      style={{
                        position: "absolute",
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        left: "2px",
                        right: "2px",
                        zIndex: 10,
                      }}
                    >
                      {/* Card 1 */}
                      {isMulti
                        ? renderCard(cluster[0], 0, CARD_H, undefined, needsMoreBar ? "5px 5px 0 0" : "5px 5px 0 0")
                        : renderCard(cluster[0], 0, undefined, 0, "5px")}

                      {/* Card 2 (multi only) */}
                      {isMulti && renderCard(
                        cluster[1],
                        CARD_H + 1,
                        needsMoreBar ? CARD_H : undefined,
                        needsMoreBar ? undefined : 0,
                        needsMoreBar ? "0" : "0 0 5px 5px"
                      )}

                      {/* "View X more" bar — only when >2 events */}
                      {needsMoreBar && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewOverlap(cluster); }}
                          className="absolute flex items-center justify-center transition-colors hover:brightness-95"
                          style={{
                            bottom: 0,
                            left: 0,
                            right: "20px",
                            height: `${MORE_BAR_H}px`,
                            backgroundColor: cluster[1].color,
                            opacity: 0.75,
                            borderRadius: "0 0 0 5px",
                            border: "none",
                            borderTop: "1px solid rgba(255,255,255,0.3)",
                            cursor: "pointer",
                            fontSize: "8px",
                            fontWeight: 600,
                            color: "white",
                            letterSpacing: "0.02em",
                          }}
                        >
                          View {moreCount} more
                        </button>
                      )}

                      {/* Add event bar — right side */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddEvent(day, sh); }}
                        title="Add event at this time"
                        className="absolute flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                        style={{
                          top: 0,
                          bottom: 0,
                          right: 0,
                          width: "18px",
                          backgroundColor: "#f3f4f6",
                          borderRadius: "0 5px 5px 0",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                          lineHeight: 1,
                        }}
                      >
                        +
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
