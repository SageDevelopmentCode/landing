// Garden UI for the parent calendar. Data + handlers come from
// useParentCalendar (c) and feedback from useCalendarFeedback (fb).
import {
  Display,
  Garden,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSegmented,
  GardenSkeleton,
  HandNote,
  PressableScale,
  StickyNote,
  gardenCard,
  gardenShadow,
  haptic,
} from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  useReducedMotion,
} from "react-native-reanimated";
import {
  type CalendarEvent,
  DOW_LETTER,
  DOW_SHORT,
  formatEventTime,
  formatShortDay,
  monthCells,
  parseYMD,
  toYMD,
  ymdOf,
} from "../calendarUtils";
import type { ParentCalendar } from "../useParentCalendar";
import type { CalendarFeedback } from "./useCalendarFeedback";

export const GUTTER = 18;

// ─────────────────────────────────────────────────────────────────────────────
// Hero: month/week label, chevrons, view toggle, Today
// ─────────────────────────────────────────────────────────────────────────────
export function CalendarHero({ c }: { c: ParentCalendar }) {
  const unit = c.viewMode === "monthly" ? "month" : "week";
  return (
    <View style={hero.wrap}>
      <View style={hero.row}>
        <View style={{ flex: 1 }}>
          <HandNote size={19}>{c.viewMode === "monthly" ? "this month at school" : "this week at school"}</HandNote>
          <Display size={30} numberOfLines={1}>
            {c.headerLabel}
          </Display>
        </View>
        <GardenIconButton
          icon="chevron-back"
          label={`Previous ${unit}`}
          onPress={() => c.navigate(-1)}
        />
        <GardenIconButton
          icon="chevron-forward"
          label={`Next ${unit}`}
          onPress={() => c.navigate(1)}
        />
      </View>
      <View style={hero.controls}>
        <GardenSegmented
          style={{ flex: 1 }}
          accessibilityLabel="Calendar view"
          value={c.viewMode}
          onChange={c.setViewMode}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "weekly", label: "Weekly" },
          ]}
        />
        {!c.isShowingToday ? (
          <Animated.View entering={FadeIn.duration(180)}>
            <PressableScale
              onPress={c.goToday}
              accessibilityLabel="Jump to today"
              style={hero.today}
            >
              <Ionicons name="sunny" size={15} color="#7a5a00" />
              <Text style={hero.todayText} maxFontSizeMultiplier={1.3}>
                Today
              </Text>
            </PressableScale>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const hero = StyleSheet.create({
  wrap: { paddingHorizontal: GUTTER, paddingTop: 10, paddingBottom: 14, gap: 14 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  today: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.butter,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: Garden.butterDeep,
  },
  todayText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: "#5c4500" },
});

// ─────────────────────────────────────────────────────────────────────────────
// "Next up" sticky note — the single most time-relevant thing
// ─────────────────────────────────────────────────────────────────────────────
export function NextUpNote({ c }: { c: ParentCalendar }) {
  const evt = c.nextEvent;
  if (!evt) return null;
  const isToday = evt.event_date === c.todayYMD;
  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={{ paddingHorizontal: 22, marginBottom: 18, marginTop: 4 }}>
      <StickyNote tilt={-1.2}>
        <HandNote size={18} color="#7a5a00">
          {isToday ? "today at Sage Field" : "coming up next"}
        </HandNote>
        <PressableScale
          pressedScale={0.98}
          onPress={() => c.openEvent(evt)}
          accessibilityLabel={`${evt.title}, ${formatShortDay(evt.event_date)}, ${formatEventTime(evt)}`}
          accessibilityHint="Shows event details"
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <View style={{ flex: 1 }}>
            <Text style={note.title} numberOfLines={2} maxFontSizeMultiplier={1.3}>
              {evt.title}
            </Text>
            <Text style={note.meta} maxFontSizeMultiplier={1.3}>
              {isToday ? formatEventTime(evt) : `${formatShortDay(evt.event_date)} · ${formatEventTime(evt)}`}
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="#7a5a00" />
        </PressableScale>
      </StickyNote>
    </Animated.View>
  );
}

const note = StyleSheet.create({
  title: { fontFamily: GardenFonts.display, fontSize: 21, lineHeight: 24, color: Garden.ink },
  meta: { fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: "#5c4500", marginTop: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Month grid (also used, compact, as the date picker in the add sheet)
// ─────────────────────────────────────────────────────────────────────────────
export function MonthGrid({
  year,
  month,
  todayYMD,
  selectedDate,
  eventsByDate,
  onSelect,
  compact,
  dimPast,
}: {
  year: number;
  month: number;
  todayYMD: string;
  selectedDate: string | null;
  eventsByDate?: Record<string, CalendarEvent[]>;
  onSelect: (ymd: string) => void;
  compact?: boolean;
  dimPast?: boolean;
}) {
  const cells = monthCells(year, month);
  const circle = compact ? 34 : 36;
  return (
    <View>
      <View style={grid.dowRow}>
        {DOW_SHORT.map((d, i) => (
          <Text
            key={d}
            maxFontSizeMultiplier={1.2}
            style={[grid.dow, (i === 0 || i === 6) && { color: Garden.muted }]}
          >
            {compact ? DOW_LETTER[i] : d}
          </Text>
        ))}
      </View>
      <View style={grid.grid}>
        {cells.map((day, idx) => {
          const weekend = idx % 7 === 0 || idx % 7 === 6;
          if (day === null) return <View key={`e${idx}`} style={[grid.cell, weekend && grid.weekend]} />;
          const ymd = ymdOf(year, month, day);
          const isToday = ymd === todayYMD;
          const isSel = ymd === selectedDate;
          const dayEvts = eventsByDate?.[ymd] ?? [];
          const colors = [...new Set(dayEvts.map((e) => e.color))];
          const past = dimPast && ymd < todayYMD;
          const label = `${parseYMD(ymd).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}${isToday ? ", today" : ""}${dayEvts.length ? `, ${dayEvts.length} event${dayEvts.length === 1 ? "" : "s"}` : ""}`;
          return (
            <Pressable
              key={ymd}
              onPress={() => {
                haptic.select();
                onSelect(ymd);
              }}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSel }}
              style={({ pressed }) => [
                grid.cell,
                { minHeight: compact ? 44 : 52 },
                weekend && grid.weekend,
                pressed && { opacity: 0.6 },
              ]}
            >
              <View
                style={[
                  { width: circle, height: circle, borderRadius: circle / 2, alignItems: "center", justifyContent: "center" },
                  isToday && !isSel && grid.todayRing,
                  isSel && grid.selected,
                ]}
              >
                <Text
                  maxFontSizeMultiplier={1.25}
                  style={[
                    grid.dayText,
                    weekend && { color: Garden.soft },
                    past && { color: "#c2bcb0" },
                    isToday && { color: Garden.coralDeep, fontFamily: GardenFonts.bodyHeavy },
                    isSel && { color: Garden.white, fontFamily: GardenFonts.bodyHeavy },
                  ]}
                >
                  {day}
                </Text>
              </View>
              {!compact ? (
                <View style={grid.dots}>
                  {colors.slice(0, 3).map((col) => (
                    <View key={col} style={[grid.dot, { backgroundColor: col }]} />
                  ))}
                  {dayEvts.length > 3 ? <Text style={grid.more}>+</Text> : null}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const grid = StyleSheet.create({
  dowRow: { flexDirection: "row", marginBottom: 4 },
  dow: {
    flex: 1,
    textAlign: "center",
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11.5,
    color: Garden.soft,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 3 },
  weekend: { backgroundColor: "rgba(243,234,220,0.55)" },
  todayRing: { borderWidth: 2, borderColor: Garden.coral },
  selected: { backgroundColor: Garden.sageDeep },
  dayText: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  dots: { flexDirection: "row", gap: 3, height: 8, marginTop: 3, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  more: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10, lineHeight: 10, color: Garden.muted },
});

// ─────────────────────────────────────────────────────────────────────────────
// Week strip: 7 day pills with event dots
// ─────────────────────────────────────────────────────────────────────────────
function WeekStrip({ c }: { c: ParentCalendar }) {
  return (
    <View style={wk.row} accessibilityRole="tablist">
      {c.weekDays.map((d, i) => {
        const ymd = toYMD(d);
        const isToday = ymd === c.todayYMD;
        const isSel = ymd === c.selectedDate;
        const weekend = i === 0 || i === 6;
        const dayEvts = c.eventsByDate[ymd] ?? [];
        const colors = [...new Set(dayEvts.map((e) => e.color))];
        return (
          <PressableScale
            key={ymd}
            haptics="select"
            onPress={() => c.selectDay(ymd)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSel }}
            accessibilityLabel={`${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${isToday ? ", today" : ""}, ${dayEvts.length ? `${dayEvts.length} event${dayEvts.length === 1 ? "" : "s"}` : "no events"}`}
            style={[
              wk.pill,
              weekend && wk.weekend,
              isToday && !isSel && wk.today,
              isSel && wk.selected,
            ]}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              style={[wk.letter, isSel && { color: "rgba(255,255,255,0.85)" }, isToday && !isSel && { color: Garden.coralDeep }]}
            >
              {DOW_LETTER[i]}
            </Text>
            <Text
              maxFontSizeMultiplier={1.2}
              style={[wk.num, weekend && !isSel && { color: Garden.soft }, isSel && { color: Garden.white }, isToday && !isSel && { color: Garden.coralDeep }]}
            >
              {d.getDate()}
            </Text>
            <View style={wk.dots}>
              {colors.slice(0, 3).map((col) => (
                <View key={col} style={[wk.dot, { backgroundColor: isSel ? Garden.white : col }]} />
              ))}
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const wk = StyleSheet.create({
  row: { flexDirection: "row", gap: 5 },
  pill: {
    flex: 1,
    minHeight: 76,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  weekend: { backgroundColor: "#f7efe2" },
  today: { borderColor: Garden.coral, borderWidth: 2 },
  selected: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  letter: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: Garden.muted },
  num: { fontFamily: GardenFonts.display, fontSize: 20, color: Garden.ink },
  dots: { flexDirection: "row", gap: 2, height: 6, alignItems: "center" },
  dot: { width: 5, height: 5, borderRadius: 3 },
});

// ─────────────────────────────────────────────────────────────────────────────
// The calendar card: swipe to change month/week, gentle slide on change
// ─────────────────────────────────────────────────────────────────────────────
export function CalendarBoard({ c, fb }: { c: ParentCalendar; fb: CalendarFeedback }) {
  const reduce = useReducedMotion();
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .failOffsetY([-14, 14])
    .onEnd((e) => {
      if (Math.abs(e.translationX) > Math.abs(e.translationY * 1.5)) {
        if (e.translationX < -40) {
          haptic.select();
          c.navigate(1);
        } else if (e.translationX > 40) {
          haptic.select();
          c.navigate(-1);
        }
      }
    });

  if (c.error) {
    return (
      <View style={{ paddingHorizontal: GUTTER, marginBottom: 22 }}>
        <GardenErrorCard
          title="We couldn't load the calendar"
          onRetry={() => void fb.retryLoad()}
          retrying={fb.retrying}
        />
      </View>
    );
  }

  const rangeKey = c.viewMode === "monthly" ? `${c.year}-${c.month}` : toYMD(c.weekDays[0]);
  const entering = reduce
    ? undefined
    : (c.navDir > 0 ? FadeInRight : FadeInLeft).duration(220);

  return (
    <GestureDetector gesture={swipe}>
      <View style={[board.wrap, c.viewMode === "monthly" ? board.card : null]}>
        <Animated.View key={`${c.viewMode}-${rangeKey}`} entering={entering}>
          {c.viewMode === "monthly" ? (
            <MonthGrid
              year={c.year}
              month={c.month}
              todayYMD={c.todayYMD}
              selectedDate={c.selectedDate}
              eventsByDate={c.eventsByDate}
              onSelect={c.selectDay}
            />
          ) : (
            <WeekStrip c={c} />
          )}
        </Animated.View>
        {c.loading ? (
          <View pointerEvents="none" style={board.loadingDot}>
            <GardenSkeleton width={46} height={6} radius={3} />
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const board = StyleSheet.create({
  wrap: { marginHorizontal: GUTTER, marginBottom: 22 },
  card: { ...gardenCard, borderRadius: 26, padding: 10, overflow: "hidden" },
  loadingDot: { position: "absolute", bottom: 4, alignSelf: "center" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Agenda: events grouped by day
// ─────────────────────────────────────────────────────────────────────────────
function AgendaRow({ c, evt }: { c: ParentCalendar; evt: CalendarEvent }) {
  const d = parseYMD(evt.event_date);
  const mine = c.canManage(evt);
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={() => c.openEvent(evt)}
      accessibilityLabel={`${evt.title}, ${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, ${formatEventTime(evt)}`}
      accessibilityHint="Shows event details"
      style={ag.row}
    >
      <View style={[ag.date, { backgroundColor: evt.color + "22" }]}>
        <Text style={[ag.mo, { color: evt.color }]} maxFontSizeMultiplier={1.2}>
          {d.toLocaleDateString("en-US", { month: "short" })}
        </Text>
        <Text style={[ag.day, { color: evt.color }]} maxFontSizeMultiplier={1.2}>
          {d.getDate()}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={ag.title} numberOfLines={2} maxFontSizeMultiplier={1.35}>
          {evt.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Text style={ag.meta} maxFontSizeMultiplier={1.35}>
            {d.toLocaleDateString("en-US", { weekday: "short" })} · {formatEventTime(evt)}
          </Text>
          {mine ? (
            <View style={ag.mine}>
              <Text style={ag.mineText} maxFontSizeMultiplier={1.2}>
                yours
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {evt.category ? (
        <View style={[ag.cat, { backgroundColor: evt.color + "22" }]}>
          <Text style={[ag.catText, { color: evt.color }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
            {evt.category}
          </Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={Garden.muted} />
    </PressableScale>
  );
}

export function Agenda({ c, fb }: { c: ParentCalendar; fb: CalendarFeedback }) {
  if (c.error) return null;
  if (c.loading && c.listEvents.length === 0) return <AgendaSkeleton />;

  const groups: { ymd: string; items: CalendarEvent[] }[] = [];
  for (const e of c.listEvents) {
    const last = groups[groups.length - 1];
    if (last && last.ymd === e.event_date) last.items.push(e);
    else groups.push({ ymd: e.event_date, items: [e] });
  }
  const count = c.listEvents.length;

  return (
    <View style={{ marginBottom: 26 }}>
      <View style={ag.header}>
        <View style={{ flex: 1 }}>
          <Display size={22}>{c.listLabel}</Display>
          {count > 0 ? <HandNote size={16}>tap any event for details</HandNote> : null}
        </View>
        {c.selectedDate ? (
          <Pressable
            onPress={() => {
              haptic.select();
              c.selectDay(c.selectedDate!);
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Show all events"
            style={({ pressed }) => [ag.clear, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="close" size={14} color={Garden.sageDeep} />
            <Text style={ag.clearText}>{c.viewMode === "weekly" ? "Whole week" : "Whole month"}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: GUTTER, gap: 10 }}>
        {count === 0 ? (
          <Animated.View entering={FadeIn.duration(200)}>
            <GardenEmpty
              emoji="📅"
              title="No events scheduled"
              tint="sky"
              actionLabel="Add your event!"
              onAction={() => fb.openAdd(c.selectedDate ?? undefined)}
            />
          </Animated.View>
        ) : (
          groups.map((g, gi) => (
            <Animated.View key={g.ymd} entering={FadeInDown.delay(Math.min(gi, 6) * 50).springify().damping(18)} style={{ gap: 8 }}>
              {!c.selectedDate && groups.length > 1 ? (
                <View style={ag.dayHead}>
                  <Text style={ag.dayHeadText} maxFontSizeMultiplier={1.3}>
                    {formatShortDay(g.ymd)}
                  </Text>
                  {g.ymd === c.todayYMD ? (
                    <View style={ag.todayTag}>
                      <Text style={ag.todayTagText}>Today</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {g.items.map((e) => (
                <AgendaRow key={e.id} c={c} evt={e} />
              ))}
            </Animated.View>
          ))
        )}
      </View>
    </View>
  );
}

function AgendaSkeleton() {
  return (
    <View style={{ paddingHorizontal: GUTTER, gap: 10, marginBottom: 26 }}>
      <GardenSkeleton width="55%" height={22} radius={8} />
      {[0, 1, 2].map((i) => (
        <GardenSkeleton key={i} width="100%" height={66} radius={20} />
      ))}
    </View>
  );
}

const ag = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: GUTTER, marginBottom: 12, gap: 12 },
  clear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: GardenRadii.pill,
    backgroundColor: "#e1eee3",
  },
  clearText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: Garden.sageDeep },
  dayHead: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  dayHeadText: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    color: Garden.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  todayTag: { backgroundColor: "#fde3df", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  todayTagText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10.5, color: "#b9554a" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    minHeight: 66,
    ...gardenCard,
    borderRadius: 20,
  },
  date: { width: 46, borderRadius: 14, alignItems: "center", paddingVertical: 6 },
  mo: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10.5, textTransform: "uppercase" },
  day: { fontFamily: GardenFonts.display, fontSize: 20, lineHeight: 22 },
  title: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  meta: { fontFamily: GardenFonts.body, fontSize: 12.5, color: Garden.soft },
  mine: { backgroundColor: "#e1eee3", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 },
  mineText: { fontFamily: GardenFonts.hand, fontSize: 13, color: Garden.sageDeep },
  cat: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 90 },
  catText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10.5 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Floating "Add your event!" pill (thumb zone, above the tab bar)
// ─────────────────────────────────────────────────────────────────────────────
export function AddEventFab({ fb }: { fb: CalendarFeedback }) {
  return (
    <Animated.View entering={FadeInDown.delay(250).springify()} style={fab.wrap} pointerEvents="box-none">
      <PressableScale
        onPress={() => fb.openAdd()}
        accessibilityLabel="Add your event"
        accessibilityHint="Opens a short form to share an event with other families"
        haptics={false}
        style={fab.btn}
      >
        <Ionicons name="add-circle" size={22} color={Garden.white} />
        <Text style={fab.label} numberOfLines={1} maxFontSizeMultiplier={1.25}>
          Add your event!
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

const fab = StyleSheet.create({
  wrap: { position: "absolute", right: GUTTER, bottom: BottomTabInset + 14 },
  btn: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.coralDeep,
    borderBottomWidth: 4,
    borderBottomColor: "#c0594d",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...gardenShadow,
  },
  label: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.white },
});
