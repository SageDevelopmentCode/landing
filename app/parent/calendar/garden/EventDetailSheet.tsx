"use client";

/**
 * Event detail content for the calendar sheet, after mobile `EventDetailSheet`.
 * Rendered inside the single calendar `GardenSheet` (see CalendarSheet).
 */
import Link from "next/link";
import { Bell, CalendarDays, MapPin, Paperclip, RefreshCw, Users } from "lucide-react";
import type { ReactNode } from "react";
import { isFieldFridayCalendarEvent } from "@/shared/parent/calendar";
import { Arrow, Spinner, btnCoralSm, btnGhostSm, btnInkSm } from "@/app/parent/_garden/ui";
import { formatEventTime } from "@/app/parent/_garden/format";
import { attachmentName, formatDateWithYear, formatFullDate, tint, type CalendarEvent } from "./calendarUtils";

function Row({ icon, tintClass, children }: { icon: ReactNode; tintClass: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-start gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tintClass}`} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </div>
  );
}

const label = "text-[11px] font-extrabold uppercase tracking-wide text-[var(--sf-soft)]/80";
const primary = "text-[15px] font-bold text-[var(--sf-ink)]";

export function EventDetailBody({ event, mine }: { event: CalendarEvent; mine: boolean }) {
  const attachments = event.attachment_links ?? [];
  const hasRecurrence = !!event.recurrence && event.recurrence !== "None";
  const hasReminder = event.reminder_email || event.reminder_in_app;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <span className="h-1.5 w-12 rounded-full" style={{ backgroundColor: event.color }} aria-hidden="true" />
      {event.category || mine || (event.programs ?? []).length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {event.category ? (
            <span className="rounded-full px-3 py-1 text-xs font-extrabold text-[var(--sf-ink)]" style={{ backgroundColor: tint(event.color, "33") }}>
              {event.category}
            </span>
          ) : null}
          {mine ? <span className="rounded-full bg-[var(--sf-mint)] px-3 py-1 text-xs font-extrabold text-[var(--sf-sage-deep)]">🌱 You shared this</span> : null}
          {(event.programs ?? []).map((p) => (
            <span key={p} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--sf-soft)] ring-1 ring-[var(--sf-ink)]/10">
              {p}
            </span>
          ))}
        </div>
      ) : null}

      <Row icon={<CalendarDays className="h-[18px] w-[18px] text-[#2d5d86]" />} tintClass="bg-[var(--sf-sky)]">
        <p className={primary}>{formatFullDate(event.event_date)}</p>
        <p className="text-[13px] font-semibold text-[var(--sf-soft)]">{formatEventTime(event)}</p>
      </Row>

      {event.location ? (
        <Row icon={<MapPin className="h-[18px] w-[18px] text-[#a2552e]" />} tintClass="bg-[var(--sf-peach)]">
          <p className={label}>Location</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${primary} underline decoration-[var(--sf-ink)]/20 underline-offset-4 hover:decoration-[var(--sf-sage)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)] rounded`}
          >
            {event.location}
            <span className="sr-only"> (opens Maps in a new tab)</span>
          </a>
        </Row>
      ) : null}

      {event.description ? (
        <div className="rounded-[20px] bg-white px-4 py-3.5 ring-1 ring-[var(--sf-ink)]/[0.06]">
          <p className={`${label} mb-1.5`}>Description</p>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-[var(--sf-soft)]">{event.description}</p>
        </div>
      ) : null}

      {hasRecurrence ? (
        <Row icon={<RefreshCw className="h-[18px] w-[18px] text-[var(--sf-sage-deep)]" />} tintClass="bg-[var(--sf-mint)]">
          <p className={label}>Recurrence</p>
          <p className={primary}>
            Repeats {event.recurrence!.toLowerCase()}
            {event.recurrence_end_date ? ` until ${formatDateWithYear(event.recurrence_end_date)}` : ""}
          </p>
        </Row>
      ) : null}

      {attachments.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className={label}>Attachments</p>
          {attachments.map((url, i) => (
            <a
              key={`${url}-${i}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2.5 rounded-2xl bg-white px-3.5 text-sm font-bold text-[var(--sf-sage-deep)] ring-1 ring-[var(--sf-ink)]/[0.08] transition hover:bg-[var(--sf-mint)]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--sf-sky)]"
            >
              <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{attachmentName(url, i)}</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
        </div>
      ) : null}

      {hasReminder ? (
        <Row icon={<Bell className="h-[18px] w-[18px] text-[#7a5b00]" />} tintClass="bg-[var(--sf-butter)]">
          <p className={label}>Reminder</p>
          <p className={primary}>
            {event.reminder_timing ?? "30 min before"}
            {event.reminder_email && event.reminder_in_app ? " · email + in-app" : event.reminder_email ? " · email" : " · in-app"}
          </p>
        </Row>
      ) : null}

      {event.rsvp_enabled ? (
        <p className="flex items-center gap-2.5 rounded-[18px] bg-[var(--sf-mint)]/60 px-4 py-3 text-sm font-extrabold text-[var(--sf-sage-deep)]">
          <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
          RSVP enabled for parents
        </p>
      ) : null}

      {isFieldFridayCalendarEvent(event) ? (
        <div className="mt-1 flex flex-col items-center gap-1.5">
          <span className="sf-hand text-lg leading-none text-[var(--sf-sage-deep)]" aria-hidden="true">
            sign up here →
          </span>
          <Link href="/parent/billing" className={`${btnCoralSm} w-full min-h-[52px] text-base`}>
            Register now!
            <Arrow />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** Sheet footer for an event the parent created. */
export function EventDetailActions({ onEdit, onDelete, deleting }: { onEdit: () => void; onDelete: () => void; deleting?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <button type="button" onClick={onEdit} className={`${btnInkSm} min-h-12 flex-1`}>
        Edit event
      </button>
      <button type="button" onClick={onDelete} disabled={deleting} className={`${btnGhostSm} min-h-12 flex-1 text-[var(--sf-coral-deep)]`}>
        {deleting ? <Spinner /> : null}
        {deleting ? "Removing…" : "Delete event"}
      </button>
    </div>
  );
}
