// Calendar data, navigation and writes, shared by the parent calendar and the
// view-only staff calendar (mode "staff"). UI lives in ./garden.
// Handlers return { ok, error? } and never show UI themselves — the Garden
// feedback hook reacts to the results.
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteParentCalendarEvent,
  type ParentCalendarEventRecord,
} from "@/lib/calendar-actions";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import {
  addDays,
  type CalendarEvent,
  isValidYMD,
  MONTH_NAMES,
  monthKey,
  monthKeyOfYMD,
  monthRange,
  normalizeEvent,
  parseYMD,
  sortEvents,
  toYMD,
  weekDaysOf,
  weekLabel,
} from "./calendarUtils";

const FETCH_TAG = "parent-calendar-fetch";
const SELECT =
  "id,title,event_date,is_all_day,start_time,end_time,color,category,shared_with,programs,description,location,attachment_links,created_by";

/** Thrown (and surfaced on the error card) when there's no signed-in user. */
export const NOT_SIGNED_IN = "Not authenticated";

export type ViewMode = "monthly" | "weekly";
export type Result = { ok: boolean; error?: string };
export type CalendarMode = "parent" | "staff";
export type CalendarOptions = {
  /** "staff" is view-only: no add/edit/delete, no register CTA. */
  mode?: CalendarMode;
  /** Tag passed to notifyError when a load fails. */
  fetchErrorTag?: string;
};

export function useParentCalendar({ mode = "parent", fetchErrorTag }: CalendarOptions = {}) {
  const isStaff = mode === "staff";
  const errorTag = fetchErrorTag ?? (isStaff ? "staff-calendar-fetch" : FETCH_TAG);
  const router = useRouter();
  const { isReadOnlyPreview } = useAuth();
  const { selectDate, addEvent } = useLocalSearchParams<{
    selectDate?: string;
    addEvent?: string;
  }>();

  const [anchor, setAnchor] = useState(() => new Date());
  const [viewMode, setViewModeState] = useState<ViewMode>("weekly");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  /** Events cached per "YYYY-MM". A key present = that month is loaded. */
  const [cache, setCache] = useState<Record<string, CalendarEvent[]>>({});
  /** Blocking load errors per "YYYY-MM" (only for months with nothing cached). */
  const [failed, setFailed] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [todayYMD, setTodayYMD] = useState(() => toYMD(new Date()));
  /** +1 forward / -1 back — drives the slide direction of the grid. */
  const [navDir, setNavDir] = useState<1 | -1>(1);

  // Add / edit sheet
  const detailSheetRef = useRef<BottomSheetModal>(null);
  const addSheetRef = useRef<BottomSheetModal>(null);
  const [addInitialDate, setAddInitialDate] = useState<string | null>(null);
  const [eventToEdit, setEventToEdit] = useState<ParentCalendarEventRecord | null>(null);
  /** Bumped on every open so the add sheet resets its form. */
  const [addSession, setAddSession] = useState(0);

  // Per-month request sequence: only the newest response for a month lands.
  const seqRef = useRef(0);
  const monthSeqRef = useRef<Record<string, number>>({});
  const cacheRef = useRef(cache);
  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  // ── Derived ranges ─────────────────────────────────────────────────────────
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const weekDays = useMemo(() => weekDaysOf(anchor), [anchor]);
  const weekYMDs = useMemo(() => weekDays.map(toYMD), [weekDays]);

  const visibleMonths = useMemo(() => {
    if (viewMode === "monthly") return [monthKey(anchor)];
    return [...new Set(weekDays.map(monthKey))];
  }, [viewMode, anchor, weekDays]);
  const visibleKey = visibleMonths.join("|");

  const error = useMemo(
    () => visibleMonths.map((k) => (k in cache ? undefined : failed[k])).find(Boolean) ?? null,
    [visibleMonths, cache, failed],
  );
  const loading = !error && visibleMonths.some((k) => !(k in cache));

  const events = useMemo(
    () => sortEvents(visibleMonths.flatMap((k) => cache[k] ?? [])),
    [visibleMonths, cache],
  );

  const eventsByDate = useMemo(() => {
    const acc: Record<string, CalendarEvent[]> = {};
    for (const k of Object.keys(cache)) {
      for (const e of cache[k]) (acc[e.event_date] ??= []).push(e);
    }
    for (const d of Object.keys(acc)) acc[d] = sortEvents(acc[d]);
    return acc;
  }, [cache]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchMonths = useCallback(async (keys: string[], quiet = false): Promise<Result> => {
    if (keys.length === 0) return { ok: true };
    const sorted = [...keys].sort();
    const myId = ++seqRef.current;
    for (const k of sorted) monthSeqRef.current[k] = myId;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(NOT_SIGNED_IN);
      setCurrentUserId(user.id);

      const { data, error: qErr } = await supabase
        .schema("calendar")
        .from("events")
        .select(SELECT)
        .gte("event_date", monthRange(sorted[0]).start)
        .lte("event_date", monthRange(sorted[sorted.length - 1]).end)
        .order("event_date", { ascending: true });
      if (qErr) throw qErr;

      const buckets: Record<string, CalendarEvent[]> = {};
      for (const k of sorted) buckets[k] = [];
      for (const raw of (data ?? []) as CalendarEvent[]) {
        const e = normalizeEvent(raw);
        const k = monthKeyOfYMD(e.event_date);
        if (buckets[k]) buckets[k].push(e);
      }
      // A newer request for a month wins: stale responses never land.
      const live = sorted.filter((k) => monthSeqRef.current[k] === myId);
      setCache((prev) => {
        const next = { ...prev };
        for (const k of live) next[k] = buckets[k];
        return next;
      });
      setFailed((prev) => {
        if (!live.some((k) => k in prev)) return prev;
        const next = { ...prev };
        for (const k of live) delete next[k];
        return next;
      });
      return { ok: true };
    } catch (e) {
      if (!quiet) notifyError(errorTag, e);
      const msg = e instanceof Error ? e.message : "Couldn't load events";
      // Only surface a blocking error for months that are still this request's
      // to answer and have nothing on screen yet.
      const blocked = sorted.filter(
        (k) => monthSeqRef.current[k] === myId && !(k in cacheRef.current),
      );
      if (!quiet && blocked.length) {
        setFailed((prev) => {
          const next = { ...prev };
          for (const k of blocked) next[k] = msg;
          return next;
        });
      }
      return { ok: false, error: msg };
    }
  }, [errorTag]);

  // Load whatever the visible range is missing; quietly prefetch neighbours.
  useEffect(() => {
    const missing = visibleMonths.filter((k) => !(k in cacheRef.current));
    void (async () => {
      if (missing.length) await fetchMonths(missing);
      const before = monthKey(new Date(year, month - 1, 1));
      const after = monthKey(new Date(year, month + 1, 1));
      const neighbours = [before, after].filter((k) => !(k in cacheRef.current));
      if (neighbours.length) void fetchMonths(neighbours, true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the visible range
  }, [visibleKey]);

  /** Re-runs the visible range without flipping back to skeletons. */
  const reload = useCallback(async (): Promise<Result> => {
    setTodayYMD(toYMD(new Date()));
    return fetchMonths(visibleMonths);
  }, [fetchMonths, visibleMonths]);

  const retryLoad = useCallback(async (): Promise<Result> => {
    setFailed((prev) => {
      const next = { ...prev };
      for (const k of visibleMonths) delete next[k];
      return next;
    });
    return fetchMonths(visibleMonths);
  }, [fetchMonths, visibleMonths]);

  // Refresh quietly whenever the tab regains focus (picks up new events).
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void reloadRef.current();
      focusedOnce.current = true;
    }, []),
  );

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = useCallback(
    (dir: -1 | 1) => {
      setNavDir(dir);
      setSelectedDate(null);
      setAnchor((cur) =>
        viewMode === "monthly"
          ? new Date(cur.getFullYear(), cur.getMonth() + dir, 1)
          : addDays(cur, dir * 7),
      );
    },
    [viewMode],
  );

  const goToday = useCallback(() => {
    const now = new Date();
    setNavDir(now < anchor ? -1 : 1);
    setAnchor(now);
    setTodayYMD(toYMD(now));
    setSelectedDate(toYMD(now));
  }, [anchor]);

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setViewModeState(mode);
      setSelectedDate(null);
      // Keep the week anchored on today when it's inside the visible month.
      if (mode === "weekly" && monthKey(new Date()) === monthKey(anchor)) setAnchor(new Date());
    },
    [anchor],
  );

  const selectDay = useCallback((ymd: string) => {
    setSelectedDate((cur) => (cur === ymd ? null : ymd));
  }, []);

  const isShowingToday = useMemo(() => {
    if (viewMode === "monthly") return monthKey(anchor) === monthKeyOfYMD(todayYMD);
    return weekYMDs.includes(todayYMD);
  }, [viewMode, anchor, todayYMD, weekYMDs]);

  // ── Deep link: ?selectDate=YYYY-MM-DD ──────────────────────────────────────
  useEffect(() => {
    if (!selectDate || !isValidYMD(selectDate)) return;
    setAnchor(parseYMD(selectDate));
    setSelectedDate(selectDate);
    router.setParams({ selectDate: undefined });
  }, [selectDate, router]);

  // ── Detail sheet ───────────────────────────────────────────────────────────
  const openEvent = useCallback((evt: CalendarEvent) => {
    setSelectedEvent(evt);
    detailSheetRef.current?.present();
  }, []);

  /** Field Friday "Register now!" CTA — parents only. */
  const canRegister = !isStaff;
  const register = useCallback(() => {
    if (isStaff) return;
    detailSheetRef.current?.dismiss();
    router.push("/(tabs)/tuition");
  }, [router, isStaff]);

  /** Staff calendar is view-only, so staff never manage events here. */
  const canManage = useCallback(
    (evt: CalendarEvent | null) =>
      !isStaff && !!evt && !!currentUserId && evt.created_by === currentUserId,
    [currentUserId, isStaff],
  );

  // ── Back (staff only — the parent calendar is a tab) ──────────────────────
  const backHref = isStaff ? "/(staff)/home" : null;
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace((backHref ?? "/(tabs)/home") as never);
  }, [router, backHref]);

  // ── Add / edit ─────────────────────────────────────────────────────────────
  const openAddEvent = useCallback(
    (dateYmd?: string) => {
      if (isStaff) return;
      setEventToEdit(null);
      setAddInitialDate(dateYmd ?? selectedDate ?? todayYMD);
      setAddSession((n) => n + 1);
      detailSheetRef.current?.dismiss();
      setSelectedEvent(null);
      addSheetRef.current?.present();
    },
    [selectedDate, todayYMD, isStaff],
  );

  const openEditEvent = useCallback((evt: CalendarEvent) => {
    if (isStaff) return;
    setEventToEdit(evt as ParentCalendarEventRecord);
    setAddInitialDate(evt.event_date);
    setAddSession((n) => n + 1);
    detailSheetRef.current?.dismiss();
    addSheetRef.current?.present();
  }, [isStaff]);

  /** Called by the add sheet after the server saved the event. */
  const applySavedEvent = useCallback(
    (record: ParentCalendarEventRecord) => {
      const evt = normalizeEvent({
        ...record,
        attachment_links: record.attachment_links ?? [],
      }) as CalendarEvent;
      setCache((prev) => {
        const next: Record<string, CalendarEvent[]> = {};
        // Remove from any month it used to live in (date may have changed).
        for (const k of Object.keys(prev)) next[k] = prev[k].filter((e) => e.id !== evt.id);
        const k = monthKeyOfYMD(evt.event_date);
        if (next[k]) next[k] = sortEvents([...next[k], evt]);
        return next;
      });
      // Jump to where the event lives so the parent sees it land.
      const d = parseYMD(evt.event_date);
      setNavDir(d < anchor ? -1 : 1);
      setAnchor(d);
      setSelectedDate(evt.event_date);
      setSelectedEvent(evt);
      // Wait for the add sheet to finish closing before presenting detail.
      setTimeout(() => detailSheetRef.current?.present(), 250);
    },
    [anchor],
  );

  const deleteEvent = useCallback(async (evt: CalendarEvent): Promise<Result> => {
    if (isStaff) return { ok: false, error: "The staff calendar is view-only." };
    try {
      await deleteParentCalendarEvent(evt.id);
      setCache((prev) => {
        const next: Record<string, CalendarEvent[]> = {};
        for (const k of Object.keys(prev)) next[k] = prev[k].filter((e) => e.id !== evt.id);
        return next;
      });
      detailSheetRef.current?.dismiss();
      setSelectedEvent(null);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : undefined };
    }
  }, [isStaff]);

  // ── Deep link: ?addEvent=1 (Home "Share an event") ─────────────────────────
  // Note: clearing the param re-runs this effect, so the pending open must not
  // be cancelled by that re-run — only by unmount.
  const openAddRef = useRef(openAddEvent);
  useEffect(() => {
    openAddRef.current = openAddEvent;
  }, [openAddEvent]);
  const pendingAddRef = useRef<{ cancel: () => void } | null>(null);
  useEffect(() => {
    if (!addEvent) return;
    router.setParams({ addEvent: undefined });
    if (isReadOnlyPreview || isStaff) return;
    pendingAddRef.current?.cancel();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const task = InteractionManager.runAfterInteractions(() => {
      // Let any sheet that launched us (e.g. the Home intro) finish closing.
      timer = setTimeout(() => openAddRef.current(), 120);
    });
    pendingAddRef.current = {
      cancel: () => {
        task.cancel();
        if (timer) clearTimeout(timer);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once per param
  }, [addEvent]);
  useEffect(() => () => pendingAddRef.current?.cancel(), []);

  // ── Labels ─────────────────────────────────────────────────────────────────
  const headerLabel = viewMode === "monthly" ? `${MONTH_NAMES[month]} ${year}` : weekLabel(weekDays);

  const listEvents = useMemo(() => {
    if (selectedDate) return eventsByDate[selectedDate] ?? [];
    if (viewMode === "weekly") {
      const set = new Set(weekYMDs);
      return events.filter((e) => set.has(e.event_date));
    }
    return events.filter((e) => monthKeyOfYMD(e.event_date) === monthKey(anchor));
  }, [selectedDate, eventsByDate, viewMode, weekYMDs, events, anchor]);

  const listLabel = selectedDate
    ? parseYMD(selectedDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : viewMode === "weekly"
      ? "Events this week"
      : `All events — ${MONTH_NAMES[month]}`;

  /** Soonest event on or after today among everything loaded. */
  const nextEvent = useMemo(() => {
    const all = sortEvents(Object.values(cache).flat());
    return all.find((e) => e.event_date >= todayYMD) ?? null;
  }, [cache, todayYMD]);

  return {
    router,
    mode,
    isStaff,
    isReadOnlyPreview,
    backHref,
    goBack,
    // view
    anchor,
    year,
    month,
    viewMode,
    setViewMode,
    navDir,
    weekDays,
    weekYMDs,
    headerLabel,
    listLabel,
    listEvents,
    events,
    eventsByDate,
    nextEvent,
    todayYMD,
    selectedDate,
    selectDay,
    navigate,
    goToday,
    isShowingToday,
    // data
    loading,
    error,
    reload,
    retryLoad,
    currentUserId,
    // detail
    detailSheetRef,
    selectedEvent,
    setSelectedEvent,
    openEvent,
    register,
    canRegister,
    canManage,
    deleteEvent,
    // add / edit
    addSheetRef,
    addInitialDate,
    eventToEdit,
    setEventToEdit,
    addSession,
    openAddEvent,
    openEditEvent,
    applySavedEvent,
  };
}

export type ParentCalendar = ReturnType<typeof useParentCalendar>;
