"use client";

/**
 * The calendar's one `GardenSheet`: event detail and the add / edit form share it, so
 * "Edit" swaps the content in place (with Back) instead of stacking a second sheet.
 * Owns the "Discard changes?" and "Delete event?" confirms and the delete feedback.
 */
import { useEffect, useRef, useState } from "react";
import GardenSheet from "@/app/parent/_garden/sheet";
import ConfirmDialog from "@/app/parent/_garden/ConfirmDialog";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { deleteParentCalendarEvent } from "@/app/actions/deleteParentCalendarEvent";
import ParentAddEventSheet, { type ParentCalendarEventRecord } from "../ParentAddEventSheet";
import { EventDetailActions, EventDetailBody } from "./EventDetailSheet";
import type { CalendarEvent } from "./calendarUtils";

/**
 * A confirm and the sheet each lock page scroll and restore focus when they unmount. If they close
 * together, the confirm can unmount last and restore a stale lock (and focus a removed element), so
 * the sheet only closes once the confirm has left the page. Polls; gives up after 3s.
 */
function whenDialogsAtMost(n: number, fn: () => void): () => void {
  let cancelled = false;
  const start = performance.now();
  const tick = () => {
    if (cancelled) return;
    if (document.querySelectorAll('[role="dialog"]').length <= n || performance.now() - start > 3000) fn();
    else window.setTimeout(tick, 50);
  };
  window.setTimeout(tick, 50);
  return () => {
    cancelled = true;
  };
}

let sessionCounter = 0;
/** A fresh id per form open, so the form state resets every time. */
export function nextFormSession() {
  sessionCounter += 1;
  return sessionCounter;
}

export type SheetMode =
  | { kind: "detail"; event: CalendarEvent }
  | {
      kind: "form";
      session: number;
      eventToEdit: CalendarEvent | null;
      initialDate: string | null;
      initialHour: number | null;
      /** Event to return to on Back (editing from its detail view). */
      backTo: CalendarEvent | null;
    };

export default function CalendarSheet({
  open,
  mode,
  setMode,
  onClose,
  userId,
  todayYmd,
  readOnlyPreview,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  mode: SheetMode | null;
  setMode: (m: SheetMode) => void;
  onClose: () => void;
  userId?: string;
  todayYmd: string;
  readOnlyPreview?: boolean;
  onSaved: (record: ParentCalendarEventRecord, wasEdit: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const { runSave, blockedByPreview } = usePortalFeedback(readOnlyPreview);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discard, setDiscard] = useState<(() => void) | null>(null);
  const [toDelete, setToDelete] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toolbarEl, setToolbarEl] = useState<HTMLDivElement | null>(null);
  const [footerEl, setFooterEl] = useState<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<(evt: CalendarEvent) => Promise<void>>(async () => {});

  const modeKey = !mode ? "none" : mode.kind === "detail" ? `d:${mode.event.id}:${mode.event.title}` : `f:${mode.session}`;

  // When the content swaps inside an open sheet, the clicked button unmounts: keep focus in the sheet.
  useEffect(() => {
    if (mode?.kind === "detail") bodyRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the content changes
  }, [modeKey]);

  /** Run `then` right away, or after "Discard changes?" when the form has unsaved edits. */
  function guard(then: () => void) {
    if (saving) return;
    if (mode?.kind === "form" && dirty) {
      setDiscard(() => then);
      return;
    }
    then();
  }

  function leaveForm() {
    if (mode?.kind !== "form") return;
    const back = mode.backTo;
    guard(() => {
      setDirty(false);
      if (back) setMode({ kind: "detail", event: back });
      else onClose();
    });
  }

  function requestClose() {
    guard(() => {
      setDirty(false);
      onClose();
    });
  }

  async function runDelete(evt: CalendarEvent) {
    setDeleting(true);
    const ok = await runSave({
      loadingTitle: "Deleting event…",
      successTitle: "Event deleted",
      successMessage: evt.title,
      errorTitle: "Could not delete",
      retry: () => void deleteRef.current(evt),
      fn: async () => {
        const r = await deleteParentCalendarEvent({ id: evt.id });
        return { ok: r.success, error: r.message };
      },
    });
    setDeleting(false);
    setToDelete(null);
    if (ok) whenDialogsAtMost(1, () => onDeleted(evt.id));
  }

  // Safety net for the stacked-overlay race above: once everything here is closed and no dialog is
  // left on the page, make sure page scroll is unlocked.
  const anyOpen = open || !!discard || !!toDelete;
  useEffect(() => {
    if (anyOpen) return;
    return whenDialogsAtMost(0, () => {
      if (document.querySelector('[role="dialog"]')) return;
      if (document.body.style.overflow === "hidden") document.body.style.overflow = "";
    });
  }, [anyOpen]);

  useEffect(() => {
    deleteRef.current = runDelete;
  });

  const isMine = (e: CalendarEvent) => !!userId && !readOnlyPreview && e.created_by === userId;

  let title = "";
  let icon = "📅";
  let body = null;
  let footer = null;
  let toolbar = null;
  let onBack: (() => void) | undefined;

  if (mode?.kind === "detail") {
    const evt = mode.event;
    title = evt.title;
    body = <EventDetailBody event={evt} mine={isMine(evt)} />;
    if (isMine(evt)) {
      footer = (
        <EventDetailActions
          deleting={deleting}
          onEdit={() => {
            if (blockedByPreview()) return;
            setDirty(false);
            setMode({ kind: "form", session: nextFormSession(), eventToEdit: evt, initialDate: evt.event_date, initialHour: null, backTo: evt });
          }}
          onDelete={() => {
            if (blockedByPreview()) return;
            setToDelete(evt);
          }}
        />
      );
    }
  } else if (mode?.kind === "form") {
    const isEdit = !!mode.eventToEdit;
    title = isEdit ? "Edit event" : "Add to calendar";
    icon = isEdit ? "✏️" : "🌼";
    toolbar = <div ref={setToolbarEl} />;
    footer = <div ref={setFooterEl} />;
    onBack = mode.backTo ? leaveForm : undefined;
    body = (
      <ParentAddEventSheet
        key={mode.session}
        eventToEdit={mode.eventToEdit}
        initialDate={mode.initialDate}
        initialHour={mode.initialHour}
        todayYmd={todayYmd}
        readOnlyPreview={readOnlyPreview}
        toolbarEl={toolbarEl}
        footerEl={footerEl}
        onSaved={(record, wasEdit) => {
          setDirty(false);
          onSaved(record, wasEdit);
        }}
        onCancel={leaveForm}
        onDirtyChange={setDirty}
        onSavingChange={setSaving}
      />
    );
  }

  return (
    <>
      <GardenSheet
        open={open && !!mode}
        onClose={requestClose}
        title={title}
        icon={icon}
        toolbar={toolbar}
        footer={footer}
        onBack={onBack}
        backLabel="Back to event"
      >
        <div ref={bodyRef} tabIndex={-1} className="outline-none">
          {body}
        </div>
      </GardenSheet>

      <ConfirmDialog
        open={!!discard}
        onClose={() => setDiscard(null)}
        onConfirm={() => {
          const then = discard;
          setDiscard(null);
          whenDialogsAtMost(1, () => then?.());
        }}
        title="Discard changes?"
        body="Your event details haven't been saved yet."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="neutral"
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && void runDelete(toDelete)}
        title="Delete event?"
        body="This will remove the event from the calendar for all parents."
        confirmLabel="Delete"
        busyLabel="Deleting…"
        busy={deleting}
      />
    </>
  );
}
