"use client";

/**
 * Parent calendar on the portal Garden system, mirroring mobile `app/(tabs)/calendar.tsx`:
 * hero → "next up" sticky note → board (month grid / week strip, hourly grid at lg) → agenda.
 * Parts live in ./garden/; the add / edit form is ./ParentAddEventSheet.
 */
import { useMemo, useState } from "react";
import PortalShell from "@/app/parent/_garden/PortalShell";
import { usePortalFeedback } from "@/app/parent/_garden/feedback";
import { useNow } from "@/app/parent/_garden/time";
import { toYmd } from "@/app/parent/_garden/format";
import { Skeleton, SkeletonList } from "@/app/parent/_garden/states";
import type { ParentCalendarEventRecord } from "./ParentAddEventSheet";
import {
  AddEventButton,
  Agenda,
  CalendarHero,
  CategoryLegend,
  MonthGrid,
  NextUpNote,
  WeekStrip,
  WeekTimeGrid,
} from "./garden/CalendarParts";
import CalendarSheet, { nextFormSession, type SheetMode } from "./garden/CalendarSheet";
import {
  MONTH_NAMES,
  PROGRAMS,
  addDays,
  anchorFor,
  groupByDate,
  inProgram,
  parseYmd,
  programFor,
  sameMonth,
  sortEvents,
  startOfWeek,
  weekDaysOf,
  weekLabel,
  type CalendarEvent,
  type ProgramKey,
  type ViewMode,
} from "./garden/calendarUtils";

function normalizeCalendarEvent(e: ParentCalendarEventRecord | CalendarEvent): CalendarEvent {
  return {
    ...e,
    event_date: e.event_date.split("T")[0],
    attachment_links: e.attachment_links ?? [],
    created_by: e.created_by ?? null,
  } as CalendarEvent;
}

type Props = {
  initialEvents?: CalendarEvent[];
  userId?: string;
  /** Admin "view as parent": browse only, writes are blocked. */
  readOnlyPreview?: boolean;
};

export default function ParentCalendarClient(props: Props) {
  return (
    <PortalShell>
      <CalendarPage {...props} />
    </PortalShell>
  );
}

function CalendarPage({ initialEvents = [], userId, readOnlyPreview = false }: Props) {
  const canManageEvents = !!userId && !readOnlyPreview;
  const { blockedByPreview } = usePortalFeedback(readOnlyPreview);
  // Browser clock only (null on the server), so "today" never mismatches after hydration.
  const now = useNow(60_000);
  const [events, setEvents] = useState<CalendarEvent[]>(() => sortEvents(initialEvents.map(normalizeCalendarEvent)));
  const [viewMode, setViewModeState] = useState<ViewMode>("weekly");
  const [nav, setNav] = useState<{ program: ProgramKey; anchor: Date } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null);

  const eventsByDate = useMemo(() => groupByDate(events), [events]);
  const categoryEntries = useMemo(
    () => Array.from(new Map(events.filter((e) => e.category && e.color).map((e) => [e.category!, e.color])).entries()).slice(0, 5),
    [events],
  );

  if (!now) return <CalendarSkeleton />;

  const todayYmd = toYmd(now);
  const program = nav?.program ?? programFor(now);
  const anchor = nav?.anchor ?? anchorFor(program, now);
  const P = PROGRAMS[program];
  const weekDays = weekDaysOf(anchor);
  const weekYmds = weekDays.map(toYmd);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const ws = startOfWeek(anchor);
  const prevDisabled = viewMode === "monthly" ? sameMonth(anchor, P.start) : ws <= P.start;
  const nextDisabled = viewMode === "monthly" ? sameMonth(anchor, P.end) : addDays(ws, 6) >= P.end;

  const todayInAProgram = inProgram("school", now) || inProgram("summer", now);
  const isShowingToday = inProgram(program, now) && (viewMode === "monthly" ? sameMonth(anchor, now) : weekYmds.includes(todayYmd));

  const headerLabel = viewMode === "monthly" ? `${MONTH_NAMES[month]} ${year}` : `${weekLabel(weekDays)}, ${weekDays[6].getFullYear()}`;

  const listEvents = selectedDate
    ? (eventsByDate[selectedDate] ?? [])
    : viewMode === "weekly"
      ? events.filter((e) => weekYmds.includes(e.event_date))
      : events.filter((e) => sameMonth(parseYmd(e.event_date), anchor));
  const listLabel = selectedDate
    ? parseYmd(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : viewMode === "weekly"
      ? "Events this week"
      : `All events — ${MONTH_NAMES[month]}`;
  const nextEvent = events.find((e) => e.event_date >= todayYmd) ?? null;

  // ── Navigation ────────────────────────────────────────────────────────────
  function navigate(dir: -1 | 1) {
    if (dir < 0 ? prevDisabled : nextDisabled) return;
    setSelectedDate(null);
    setNav({ program, anchor: viewMode === "monthly" ? new Date(year, month + dir, 1) : addDays(anchor, dir * 7) });
  }

  function setViewMode(mode: ViewMode) {
    setViewModeState(mode);
    setSelectedDate(null);
    // Keep the week on today when today is in the visible month.
    if (mode === "weekly" && now && sameMonth(anchor, now) && inProgram(program, now)) setNav({ program, anchor: now });
  }

  function setProgram(key: ProgramKey) {
    if (!now) return;
    setSelectedDate(null);
    setNav({ program: key, anchor: anchorFor(key, now) });
  }

  function goToday() {
    if (!now) return;
    const key = programFor(now);
    setNav({ program: key, anchor: now });
    setSelectedDate(toYmd(now));
  }

  function selectDay(ymd: string) {
    setSelectedDate((cur) => (cur === ymd ? null : ymd));
  }

  // ── Sheets ────────────────────────────────────────────────────────────────
  function openEvent(evt: CalendarEvent) {
    setSheetMode({ kind: "detail", event: evt });
    setSheetOpen(true);
  }

  function openAdd(date?: string, hour?: number) {
    if (blockedByPreview() || !canManageEvents) return;
    setSheetMode({
      kind: "form",
      session: nextFormSession(),
      eventToEdit: null,
      initialDate: date ?? selectedDate ?? todayYmd,
      initialHour: hour ?? null,
      backTo: null,
    });
    setSheetOpen(true);
  }

  function handleSaved(record: ParentCalendarEventRecord) {
    const saved = normalizeCalendarEvent(record);
    setEvents((prev) => sortEvents([...prev.filter((e) => e.id !== saved.id), saved]));
    // Jump to where the event lives so the parent sees it land.
    const d = parseYmd(saved.event_date);
    const key: ProgramKey | null = inProgram(program, d) ? program : inProgram("school", d) ? "school" : inProgram("summer", d) ? "summer" : null;
    if (key) {
      setNav({ program: key, anchor: d });
      setSelectedDate(saved.event_date);
    }
    setSheetMode({ kind: "detail", event: saved });
  }

  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSheetOpen(false);
    // The row that opened the sheet is gone: land focus on the agenda heading.
    window.setTimeout(() => {
      if (document.activeElement === document.body || !document.activeElement) document.getElementById("calendar-agenda")?.focus();
    }, 450);
  }

  const isMine = (e: CalendarEvent) => canManageEvents && !!e.created_by && e.created_by === userId;
  const board =
    viewMode === "monthly" ? (
      <div className="w-full">
        <MonthGrid
          year={year}
          month={month}
          todayYmd={todayYmd}
          selected={selectedDate}
          onSelect={selectDay}
          eventsByDate={eventsByDate}
          onOpenEvent={openEvent}
          onAddDay={canManageEvents ? (ymd) => openAdd(ymd) : undefined}
          label={`${MONTH_NAMES[month]} ${year}`}
        />
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        <WeekStrip days={weekDays} todayYmd={todayYmd} selected={selectedDate} onSelect={selectDay} eventsByDate={eventsByDate} label={`Week of ${weekLabel(weekDays)}`} />
        <WeekTimeGrid
          days={weekDays}
          todayYmd={todayYmd}
          now={now}
          selected={selectedDate}
          eventsByDate={eventsByDate}
          onOpenEvent={openEvent}
          onSelectDay={(ymd) => setSelectedDate(ymd)}
          onAddAt={canManageEvents ? (ymd, hour) => openAdd(ymd, hour) : undefined}
        />
      </div>
    );

  return (
    <div className="flex w-full flex-col gap-8 px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-10">
      <CalendarHero
        label={headerLabel}
        viewMode={viewMode}
        onViewMode={setViewMode}
        program={program}
        onProgram={setProgram}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        prevDisabled={prevDisabled}
        nextDisabled={nextDisabled}
        showToday={!isShowingToday && todayInAProgram}
        onToday={goToday}
        addButton={canManageEvents ? <AddEventButton onClick={() => openAdd()} /> : undefined}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
        {nextEvent ? (
          <div className="px-1 lg:col-start-2 lg:row-start-1 lg:border-l lg:border-[var(--sf-ink)]/[0.07] lg:pl-10">
            <NextUpNote event={nextEvent} todayYmd={todayYmd} onOpen={openEvent} />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {board}
          <CategoryLegend entries={categoryEntries} />
        </div>
        <div className="min-w-0 lg:col-start-2 lg:self-stretch lg:border-l lg:border-[var(--sf-ink)]/[0.07] lg:pl-10">
          <Agenda
            title={listLabel}
            events={listEvents}
            selectedDate={selectedDate}
            viewMode={viewMode}
            todayYmd={todayYmd}
            onClearSelection={() => setSelectedDate(null)}
            onOpen={openEvent}
            isMine={isMine}
            onAdd={canManageEvents ? () => openAdd() : undefined}
          />
        </div>
      </div>

      <CalendarSheet
        open={sheetOpen}
        mode={sheetMode}
        setMode={setSheetMode}
        onClose={() => setSheetOpen(false)}
        userId={userId}
        todayYmd={todayYmd}
        readOnlyPreview={readOnlyPreview}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

/** Server render and hydration: the board depends on the browser's "today". */
function CalendarSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8 px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-10" role="status" aria-live="polite">
      <span className="sr-only">Loading calendar…</span>
      <div className="flex flex-col gap-4">
        <h1 className="sr-only">Calendar</h1>
        <Skeleton className="h-12 w-64 sm:h-14 sm:w-80" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-11 w-48 rounded-full" />
          <Skeleton className="h-11 w-56 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <Skeleton className="h-[320px] w-full rounded-none lg:h-[520px]" />
        <SkeletonList rows={3} rowClassName="h-[68px]" />
      </div>
    </div>
  );
}
