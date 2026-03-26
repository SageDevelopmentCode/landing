"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X, Link2, Upload } from "lucide-react";
import { Merriweather } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { colors, radius, shadows } from "../design-system";

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

type ProgramKey = "summer" | "school";
type ViewMode = "monthly" | "weekly";

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
const HOUR_HEIGHT = 64; // px per hour slot

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
  initialDate,
  initialHour,
  currentUser,
}: {
  onClose: () => void;
  initialDate?: Date | null;
  initialHour?: number | null;
  currentUser?: { full_name: string; role: string; id: string } | null;
}) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [eventCategory, setEventCategory] = useState("");
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0].value);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [recurrence, setRecurrence] = useState("None");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [attachmentTab, setAttachmentTab] = useState<"link" | "file">("link");
  const [attachmentLinks, setAttachmentLinks] = useState<string[]>([]);
  const [attachmentLinkInput, setAttachmentLinkInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [rsvpEnabled, setRsvpEnabled] = useState(false);
  const [reminderEmail, setReminderEmail] = useState(false);
  const [reminderInApp, setReminderInApp] = useState(false);
  const [reminderTiming, setReminderTiming] = useState("30 min before");
  const [internalNotes, setInternalNotes] = useState("");

  const initialStartTime =
    initialHour != null ? `${String(initialHour).padStart(2, "0")}:00` : "";
  const initialEndTime =
    initialHour != null ? `${String(initialHour + 1).padStart(2, "0")}:00` : "";

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
              New Event
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
              className="w-full px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
            />
          </Field>

          {/* Date */}
          <Field label="Date">
            <input
              type="date"
              defaultValue={initialDate ? formatDateInput(initialDate) : ""}
              className="w-full px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
            />
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
                  defaultValue={initialStartTime}
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
                  defaultValue={initialEndTime}
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

          {/* Internal notes */}
          <Field label="Internal notes">
            <textarea
              placeholder="Internal only — not visible to parents or students"
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = colors.mistyForest)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
            />
            <p className="text-[10px] mt-1" style={{ color: colors.textTertiary }}>
              Internal only — not visible to parents or students
            </p>
          </Field>

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
            className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-90"
            style={{
              backgroundColor: colors.mistyForest,
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add Event
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

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CalendarClient({
  currentUser,
}: {
  currentUser?: { full_name: string; role: string; id: string } | null;
}) {
  const [selectedProgram, setSelectedProgram] = useState<ProgramKey>("summer");
  const [view, setView] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(programs.summer.start)
  );
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);
  const [addEventTime, setAddEventTime] = useState<number | null>(null);

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
        className="-mx-3 sm:-mx-4 lg:-mx-6 flex h-full"
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
              />
            ) : (
              <WeeklyGrid
                weekDays={weekDays}
                today={today}
                onAddEvent={openAddEvent}
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
            initialDate={addEventDate}
            initialHour={addEventTime}
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
}: {
  days: Date[];
  currentMonth: number;
  today: Date;
  onAddEvent: (date: Date) => void;
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
// Header is sticky *inside* the scroll container so it shares the exact same
// width as the body — this prevents the scrollbar from causing misalignment.

function WeeklyGrid({
  weekDays,
  today,
  onAddEvent,
}: {
  weekDays: Date[];
  today: Date;
  onAddEvent: (date: Date, hour?: number) => void;
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
                    className="hover:bg-gray-50 transition-colors duration-100"
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
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
