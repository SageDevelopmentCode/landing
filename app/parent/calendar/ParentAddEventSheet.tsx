"use client";

/**
 * Add / edit event form, after mobile `features/calendar/garden/AddEventSheet`.
 * Same 4 steps and copy as `shared/parent/parentCalendarAddEvent.ts`, same server actions and payloads.
 * It renders inside the calendar `GardenSheet` (garden/CalendarSheet): its progress header and footer
 * buttons portal into the sheet's toolbar / footer slots.
 */
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import {
  PARENT_CALENDAR_ADD_EVENT_STEPS,
  defaultParentCalendarEventFormValues,
  type ParentCalendarEventFormValues,
} from "@/shared/parent/parentCalendarAddEvent";
import { saveParentCalendarEvent } from "@/app/actions/saveParentCalendarEvent";
import { updateParentCalendarEvent } from "@/app/actions/updateParentCalendarEvent";
import { usePortalFeedback, celebrate } from "@/app/parent/_garden/feedback";
import { Segmented } from "@/app/parent/_garden/tabs";
import { Spinner, StepProgress, btnCoralSm, btnGhostSm, btnInkSm } from "@/app/parent/_garden/ui";
import { formatEventTime, toYmd } from "@/app/parent/_garden/format";
import { MonthGrid } from "./garden/CalendarParts";
import { MONTH_NAMES, addDays, formatFullDate, isValidYmd, minutesToTime, parseYmd, timeToMinutes } from "./garden/calendarUtils";

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

type EditableEvent = Pick<ParentCalendarEventRecord, "id" | "title" | "event_date" | "is_all_day" | "start_time" | "end_time" | "location" | "description">;

const TOTAL = PARENT_CALENDAR_ADD_EVENT_STEPS.length;
const STEP_LABELS = ["Name", "Date", "Time", "Details"];

function eventToFormValues(event: EditableEvent): ParentCalendarEventFormValues {
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

function initialValues(eventToEdit: EditableEvent | null, initialDate: string | null, initialHour: number | null): ParentCalendarEventFormValues {
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
}

function durationLabel(start: string, end: string): string | null {
  const d = timeToMinutes(end) - timeToMinutes(start);
  if (!(d > 0)) return null;
  const h = Math.floor(d / 60);
  const m = d % 60;
  return [h ? `${h} hr` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}

const inputCls =
  "min-h-12 w-full rounded-2xl bg-white px-4 py-3 text-[15px] font-semibold text-[var(--sf-ink)] outline-none ring-2 ring-[var(--sf-ink)]/10 transition placeholder:font-medium placeholder:text-[var(--sf-soft)]/60 focus:ring-[var(--sf-sage)]";
const fieldLabel = "mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-[var(--sf-soft)]";
const chip = (on: boolean) =>
  `inline-flex min-h-11 items-center rounded-full px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer ${
    on ? "bg-[var(--sf-sage-deep)] text-white shadow-[0_3px_0_0_#33473b]" : "bg-white text-[var(--sf-ink)] ring-2 ring-[var(--sf-ink)]/10 hover:-translate-y-0.5 hover:ring-[var(--sf-ink)]/25"
  }`;

export type AddEventFormProps = {
  eventToEdit: EditableEvent | null;
  initialDate: string | null;
  initialHour: number | null;
  todayYmd: string;
  readOnlyPreview?: boolean;
  /** Sheet slots the form portals its progress header and footer buttons into. */
  toolbarEl: HTMLElement | null;
  footerEl: HTMLElement | null;
  onSaved: (record: ParentCalendarEventRecord, wasEdit: boolean) => void;
  /** Cancel on step 1 (the sheet decides whether to ask "Discard changes?"). */
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onSavingChange: (saving: boolean) => void;
};

export default function ParentAddEventSheet({
  eventToEdit,
  initialDate,
  initialHour,
  todayYmd,
  readOnlyPreview,
  toolbarEl,
  footerEl,
  onSaved,
  onCancel,
  onDirtyChange,
  onSavingChange,
}: AddEventFormProps) {
  const isEdit = !!eventToEdit;
  const { runSave, blockedByPreview } = usePortalFeedback(readOnlyPreview);
  const [initial] = useState(() => initialValues(eventToEdit, initialDate, initialHour));
  const [form, setForm] = useState<ParentCalendarEventFormValues>(initial);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formId = useId();
  const qId = useId();
  const hintId = useId();
  const errId = useId();
  const stepRef = useRef<HTMLDivElement>(null);
  const shownStep = useRef(0);
  const submitRef = useRef<() => Promise<void>>(async () => {});

  const step = PARENT_CALENDAR_ADD_EVENT_STEPS[stepIdx];
  const isLast = stepIdx === TOTAL - 1;

  // Move focus into each new step (the old field unmounts), so Enter → next step keeps flowing.
  useEffect(() => {
    // Idempotent (StrictMode re-runs effects): only a real step change moves focus to the new step.
    if (shownStep.current === stepIdx) {
      // On a fresh open the sheet records its trigger, then focuses `[data-autofocus]` itself.
      // Only when swapped in from the detail view (its Edit button just unmounted) do we take focus.
      const active = document.activeElement;
      if (!active || active === document.body) stepRef.current?.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
      return;
    }
    shownStep.current = stepIdx;
    const target =
      stepRef.current?.querySelector<HTMLElement>('input:not([type="date"]), textarea, [role="radio"][tabindex="0"]') ??
      stepRef.current?.querySelector<HTMLElement>("button, input");
    target?.focus({ preventScroll: true });
  }, [stepIdx]);

  function patch(partial: Partial<ParentCalendarEventFormValues>) {
    const next = { ...form, ...partial };
    setForm(next);
    onDirtyChange(JSON.stringify(next) !== JSON.stringify(initial));
    setError("");
  }

  function validateCurrentStep(): boolean {
    if (step.id === "title" && !form.title.trim()) {
      setError("Please add a name for your event.");
      return false;
    }
    if (step.id === "date" && (!form.event_date || !isValidYmd(form.event_date))) {
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

  async function handleSubmit() {
    if (saving || !validateCurrentStep()) return;
    if (blockedByPreview()) return;
    setSaving(true);
    onSavingChange(true);
    const payload = {
      title: form.title.trim(),
      event_date: form.event_date,
      is_all_day: form.is_all_day,
      start_time: form.is_all_day ? null : form.start_time,
      end_time: form.is_all_day ? null : form.end_time,
      description: form.description.trim() || undefined,
      location: form.location.trim() || undefined,
    };
    const out: { saved?: ParentCalendarEventRecord; message?: string } = {};
    const ok = await runSave({
      successTitle: isEdit ? "Event updated" : "Added to calendar 🎉",
      successMessage: isEdit ? payload.title : "Other Sagefield families can see it now.",
      errorTitle: isEdit ? "Couldn't save changes" : "Couldn't add your event",
      retry: () => void submitRef.current(),
      fn: async () => {
        const result =
          isEdit && eventToEdit
            ? await updateParentCalendarEvent({ ...payload, id: eventToEdit.id })
            : await saveParentCalendarEvent(payload);
        if (result.success && result.event) {
          out.saved = result.event as ParentCalendarEventRecord;
          return { ok: true };
        }
        out.message = result.message;
        return { ok: false, error: result.message };
      },
    });
    setSaving(false);
    onSavingChange(false);
    if (ok && out.saved) {
      if (!isEdit) void celebrate();
      onDirtyChange(false);
      onSaved(out.saved, isEdit);
    } else {
      // Keep everything the parent typed; say what went wrong.
      setError(out.message || "Something went wrong. Please try again.");
    }
  }

  useEffect(() => {
    submitRef.current = handleSubmit;
  });

  function goNext() {
    if (!validateCurrentStep()) return;
    if (!isLast) setStepIdx((i) => i + 1);
    else void handleSubmit();
  }

  function goBack() {
    setError("");
    if (stepIdx > 0) setStepIdx((i) => i - 1);
    else onCancel();
  }

  function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    goNext();
  }

  const primaryLabel = isLast ? (isEdit ? "Save changes" : "Add to calendar") : "Next";
  const describedBy = [step.hint ? hintId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  const a11y = { "aria-labelledby": qId, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined } as const;

  const toolbar = (
    <div className="flex flex-col gap-2">
      <p className="sf-hand text-lg leading-none text-[var(--sf-sage-deep)]">
        Step {stepIdx + 1} of {TOTAL}
      </p>
      <StepProgress current={stepIdx + 1} total={TOTAL} labels={STEP_LABELS} />
    </div>
  );

  const footer = (
    <div className="flex items-center gap-3">
      <button type="button" onClick={goBack} disabled={saving} className={`${btnGhostSm} min-h-12 flex-1`}>
        {stepIdx === 0 ? null : <ArrowLeft className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />}
        {stepIdx === 0 ? "Cancel" : "Back"}
      </button>
      <button
        type="submit"
        form={formId}
        disabled={saving}
        aria-busy={saving || undefined}
        className={`${isLast ? btnCoralSm : btnInkSm} min-h-12 flex-[1.6]`}
      >
        {saving ? <Spinner /> : null}
        {saving ? "Saving…" : primaryLabel}
        {!saving ? (
          isLast ? (
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
          )
        ) : null}
      </button>
    </div>
  );

  return (
    <>
      {toolbarEl ? createPortal(toolbar, toolbarEl) : null}
      {footerEl ? createPortal(footer, footerEl) : null}
      <form id={formId} onSubmit={onFormSubmit} noValidate className="flex flex-col gap-5 pb-2">
        <PreviewCard form={form} />

        <div ref={stepRef} key={step.id} className="flex flex-col gap-4">
          <div>
            <h3 id={qId} className="sf-display text-[1.65rem] leading-tight">
              {step.question}
            </h3>
            {step.hint ? (
              <p id={hintId} className="mt-1 text-[14.5px] font-semibold leading-snug text-[var(--sf-soft)]">
                {step.hint}
              </p>
            ) : null}
          </div>

          {step.id === "title" ? (
            <input
              type="text"
              data-autofocus
              placeholder="e.g. Neighborhood playdate"
              value={form.title}
              maxLength={120}
              onChange={(e) => patch({ title: e.target.value })}
              className={inputCls}
              enterKeyHint="next"
              {...a11y}
            />
          ) : null}

          {step.id === "date" ? <DateStep value={form.event_date} todayYmd={todayYmd} onPick={(ymd) => patch({ event_date: ymd })} a11y={a11y} /> : null}

          {step.id === "time" ? <TimeStep form={form} patch={patch} /> : null}

          {step.id === "details" ? (
            <div className="flex flex-col gap-4">
              <label className="block">
                <span className={fieldLabel}>Location (optional)</span>
                <span className="relative block">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sf-soft)]/70" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Where is it?"
                    value={form.location}
                    onChange={(e) => patch({ location: e.target.value })}
                    className={`${inputCls} pl-10`}
                    enterKeyHint="done"
                  />
                </span>
              </label>
              <label className="block">
                <span className={fieldLabel}>Notes (optional)</span>
                <textarea
                  rows={4}
                  placeholder="Anything other parents should know?"
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  className={`${inputCls} min-h-[112px] resize-none`}
                />
              </label>
            </div>
          ) : null}

          {error ? (
            <p id={errId} role="alert" className="flex items-start gap-2 rounded-2xl bg-[var(--sf-butter)]/70 px-4 py-3 text-sm font-bold text-[#6b4f00]">
              <span aria-hidden="true">⚠️</span>
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </>
  );
}

// ─── Live preview ────────────────────────────────────────────────────────────
function PreviewCard({ form }: { form: ParentCalendarEventFormValues }) {
  const d = isValidYmd(form.event_date) ? parseYmd(form.event_date) : null;
  const title = form.title.trim();
  return (
    <div className="flex items-center gap-3 rounded-[20px] border-2 border-dashed border-[#e3d6c2] bg-white p-3" aria-hidden="true">
      <span className={`flex w-12 shrink-0 flex-col items-center rounded-[14px] py-1.5 ${d ? "bg-[#6B8F9C]/15" : "bg-[#f1e7d8]"}`}>
        <span className="text-[10.5px] font-extrabold uppercase text-[var(--sf-soft)]">{d ? d.toLocaleDateString("en-US", { month: "short" }) : "—"}</span>
        <span className="sf-display text-xl leading-none">{d ? d.getDate() : "?"}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className={`line-clamp-2 block text-[15px] font-extrabold leading-snug ${title ? "text-[var(--sf-ink)]" : "text-[var(--sf-soft)]/60"}`}>
          {title || "e.g. Neighborhood playdate"}
        </span>
        <span className="block truncate text-[12.5px] font-semibold text-[var(--sf-soft)]">
          {d ? `${d.toLocaleDateString("en-US", { weekday: "short" })} · ` : ""}
          {formatEventTime({ is_all_day: form.is_all_day, start_time: form.start_time, end_time: form.end_time })}
          {form.location.trim() ? ` · ${form.location.trim()}` : ""}
        </span>
      </span>
      <span className="sf-hand shrink-0 text-sm text-[var(--sf-soft)]/70">preview</span>
    </div>
  );
}

// ─── Date step ───────────────────────────────────────────────────────────────
function DateStep({
  value,
  todayYmd,
  onPick,
  a11y,
}: {
  value: string;
  todayYmd: string;
  onPick: (ymd: string) => void;
  a11y: Record<string, unknown>;
}) {
  const today = parseYmd(todayYmd);
  const sat = addDays(today, (6 - today.getDay() + 7) % 7 || 7);
  const quick = [
    { label: "Today", ymd: todayYmd },
    { label: "Tomorrow", ymd: toYmd(addDays(today, 1)) },
    { label: "This Saturday", ymd: toYmd(sat) },
  ];
  const [month, setMonth] = useState(() => {
    const d = parseYmd(isValidYmd(value) ? value : todayYmd);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const y = month.getFullYear();
  const m = month.getMonth();
  const pick = (ymd: string) => {
    onPick(ymd);
    if (!isValidYmd(ymd)) return;
    const d = parseYmd(ymd);
    if (d.getMonth() !== m || d.getFullYear() !== y) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const navBtn =
    "flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-[var(--sf-ink)]/10 transition hover:bg-[var(--sf-butter)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] cursor-pointer";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick dates">
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => pick(q.ymd)}
            aria-pressed={value === q.ymd}
            aria-label={`${q.label}, ${formatFullDate(q.ymd)}`}
            className={chip(value === q.ymd)}
          >
            {q.label}
          </button>
        ))}
      </div>
      <div className="rounded-[24px] bg-white p-3 ring-1 ring-[var(--sf-ink)]/[0.07]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setMonth(new Date(y, m - 1, 1))} aria-label="Previous month" className={navBtn}>
            <ChevronLeft className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
          </button>
          <p className="text-[15px] font-extrabold" aria-live="polite">{`${MONTH_NAMES[m]} ${y}`}</p>
          <button type="button" onClick={() => setMonth(new Date(y, m + 1, 1))} aria-label="Next month" className={navBtn}>
            <ChevronRight className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
        <MonthGrid year={y} month={m} todayYmd={todayYmd} selected={value || null} onSelect={pick} variant="picker" dimPast label={`Choose a date, ${MONTH_NAMES[m]} ${y}`} />
      </div>
      <label className="block">
        <span className={fieldLabel}>Or type a date</span>
        <input type="date" value={value} onChange={(e) => pick(e.target.value)} className={inputCls} {...a11y} aria-labelledby={undefined} aria-label="Event date" />
      </label>
      {isValidYmd(value) ? (
        <p className="flex items-center gap-2 text-sm font-extrabold text-[var(--sf-sage-deep)]">
          <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
          {formatFullDate(value)}
        </p>
      ) : null}
    </div>
  );
}

// ─── Time step ───────────────────────────────────────────────────────────────
function TimeStep({ form, patch }: { form: ParentCalendarEventFormValues; patch: (p: Partial<ParentCalendarEventFormValues>) => void }) {
  const dur = durationLabel(form.start_time, form.end_time);
  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label="Event timing"
        fullWidth
        value={form.is_all_day ? "all" : "timed"}
        onChange={(v) => patch({ is_all_day: v === "all" })}
        options={[
          { value: "all", label: "All day" },
          { value: "timed", label: "Set a time" },
        ]}
      />
      {form.is_all_day ? (
        <div className="flex items-center gap-3 rounded-[20px] bg-[var(--sf-butter)]/60 px-4 py-3.5">
          <span className="text-2xl" aria-hidden="true">
            ☀️
          </span>
          <span className="text-[15px] font-extrabold text-[#5c4500]">All day</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block min-w-0">
              <span className={fieldLabel}>Starts</span>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => {
                  const t = e.target.value;
                  const s = timeToMinutes(t);
                  const en = timeToMinutes(form.end_time);
                  // Keep the end after the start: bump it to +1 hr when needed.
                  const end = !Number.isNaN(s) && (Number.isNaN(en) || en <= s) ? minutesToTime(Math.min(s + 60, 23 * 60 + 59)) : form.end_time;
                  patch({ start_time: t, end_time: end });
                }}
                className={inputCls}
              />
            </label>
            <label className="block min-w-0">
              <span className={fieldLabel}>Ends</span>
              <input type="time" value={form.end_time} onChange={(e) => patch({ end_time: e.target.value })} className={inputCls} />
            </label>
          </div>
          {dur ? <p className="sf-hand text-lg leading-none text-[var(--sf-sage-deep)]">that&apos;s {dur}</p> : null}
        </div>
      )}
    </div>
  );
}
