// Garden UI for the staff Attendance screen: program rail, day bar, progress,
// search, roster rows (one primary action each) and the Month Plan view.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenEmpty,
  GardenErrorCard,
  GardenField,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  GardenTints,
  HandNote,
  MIN_TAP,
  Pill,
  PressableScale,
  gardenCard,
  gardenEnter,
  gardenLayout,
  haptic,
  type GardenTint,
} from "@/components/garden";
import { StatusPill } from "@/features/staff-home/garden/StaffHomeParts";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition, useReducedMotion } from "react-native-reanimated";
import {
  PROGRAMS,
  formatDateLabel,
  formatDayHeader,
  getMonthLabel,
  shortName,
  type DayHeadcount,
  type ProgramHeadcount,
} from "../attendanceData";
import { rowStatus, type RosterProgram, type RosterRow, type StaffAttendance } from "../useStaffAttendance";
import type { StaffAttendanceFeedback } from "./useStaffAttendanceFeedback";

export const GUTTER = 18;
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export const PROGRAM_TINT: Record<(typeof PROGRAMS)[number]["key"], GardenTint> = {
  month_plan: "sky",
  school_year: "sage",
  aftercare: "lav",
  field_friday: "mint",
};

// ─────────────────────────────────────────────────────────────────────────────
// Hero + program rail
// ─────────────────────────────────────────────────────────────────────────────
export function AttendanceHero({ a, fb }: { a: StaffAttendance; fb: StaffAttendanceFeedback }) {
  return (
    <View style={{ paddingTop: 10, gap: 12, paddingBottom: 14 }}>
      <View style={{ paddingHorizontal: GUTTER }}>
        <Display size={34}>Attendance</Display>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        contentContainerStyle={{ gap: 8, paddingHorizontal: GUTTER }}
      >
        {PROGRAMS.map((p) => {
          const on = a.activeProgram === p.key;
          const t = GardenTints[PROGRAM_TINT[p.key]];
          return (
            <PressableScale
              key={p.key}
              haptics={false}
              onPress={() => fb.switchProgram(p.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={p.label}
              style={[ui.programChip, { backgroundColor: on ? t.fg : t.bg, borderColor: on ? t.fg : "transparent" }]}
            >
              <Ionicons name={p.icon as IoniconName} size={16} color={on ? Garden.white : t.fg} />
              <Text style={[ui.programText, { color: on ? Garden.white : t.fg }]} maxFontSizeMultiplier={1.3}>
                {p.label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Day bar
// ─────────────────────────────────────────────────────────────────────────────
function DayBar({ a, program }: { a: StaffAttendance; program: RosterProgram }) {
  const date = a.dates[program];
  const isFriday = program === "field_friday";
  const atHome = date === a.homeDate(program);
  const isToday = date === a.today;
  const badge = isFriday ? (atHome ? "This Friday" : null) : isToday ? "Today" : null;
  const long = (() => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  })();
  const nav = (delta: 1 | -1) => {
    if (!a.canShift(program, delta)) return;
    haptic.select();
    a.shiftDate(program, delta);
  };
  return (
    <View style={ui.dayBar}>
      <PressableScale
        onPress={() => nav(-1)}
        haptics={false}
        disabled={!a.canShift(program, -1)}
        accessibilityLabel={isFriday ? "Previous Friday" : "Previous day"}
        style={[ui.navBtn, !a.canShift(program, -1) && { opacity: 0.3 }]}
      >
        <Ionicons name="chevron-back" size={20} color={Garden.ink} />
      </PressableScale>
      <PressableScale
        onPress={() => a.openCalendar(program)}
        pressedScale={0.97}
        accessibilityLabel={`Showing ${long}${badge ? `, ${badge}` : ""}. Opens the calendar`}
        style={ui.dayCenter}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Display size={22} numberOfLines={1}>
            {formatDateLabel(date)}
          </Display>
          <Ionicons name="calendar-outline" size={16} color={Garden.soft} />
        </View>
        {badge ? <Pill tint="sage">{badge}</Pill> : null}
      </PressableScale>
      <PressableScale
        onPress={() => nav(1)}
        haptics={false}
        disabled={!a.canShift(program, 1)}
        accessibilityLabel={isFriday ? "Next Friday" : "Next day"}
        style={[ui.navBtn, !a.canShift(program, 1) && { opacity: 0.3 }]}
      >
        <Ionicons name="chevron-forward" size={20} color={Garden.ink} />
      </PressableScale>
      {!atHome ? (
        <Animated.View entering={FadeIn}>
          <PressableScale
            onPress={() => {
              haptic.select();
              a.goToToday(program);
            }}
            haptics={false}
            accessibilityLabel={isFriday ? "Back to this Friday" : "Back to today"}
            style={ui.todayBtn}
          >
            <Ionicons name="return-up-back" size={14} color={Garden.white} />
            <Text style={ui.todayText}>{isFriday ? "This Friday" : "Today"}</Text>
          </PressableScale>
        </Animated.View>
      ) : null}
    </View>
  );
}

function Progress({ a, program }: { a: StaffAttendance; program: RosterProgram }) {
  const s = a.stats[program];
  if (a.loading[program] || s.total === 0) return null;
  const done = s.total - s.unmarked;
  const note = s.unmarked === 0 ? `all ${s.total} marked ✓` : `${s.unmarked} of ${s.total} still to mark`;
  return (
    <View style={{ paddingHorizontal: GUTTER, gap: 6, marginTop: 4 }}>
      <View style={ui.metaRow}>
        <Text style={ui.count} maxFontSizeMultiplier={1.3}>
          {s.checkedIn} of {s.total} present
        </Text>
        <HandNote size={16} color={s.unmarked === 0 ? Garden.sageDeep : Garden.butterDeep}>
          {note}
        </HandNote>
      </View>
      <View style={ui.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View layout={LinearTransition} style={[ui.fill, { width: `${Math.round((done / s.total) * 100)}%` }]} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Roster rows
// ─────────────────────────────────────────────────────────────────────────────
function RosterRowView({
  a,
  fb,
  program,
  row,
  last,
}: {
  a: StaffAttendance;
  fb: StaffAttendanceFeedback;
  program: RosterProgram;
  row: RosterRow;
  last: boolean;
}) {
  const status = rowStatus(program, row);
  const busy = !!a.pending[a.lockKey(program, row.student_id)];
  const name = shortName(row.name);
  const unpaidPresent = program === "school_year" && (status === "present" || status === "picked_up") && !row.hasEnrollment;
  const a11y = [
    name,
    status === "unmarked" ? "Unmarked" : status === "picked_up" ? `Picked up by ${row.record?.picked_up_by_name}` : status === "absent" ? "Absent" : "Present",
    row.hasEnrollment ? "Paid" : "Unpaid",
    row.grade,
    row.has_allergies === "yes" ? "has allergies" : null,
  ]
    .filter(Boolean)
    .join(", ");

  let actionEl: React.ReactNode;
  if (status === "unmarked" || status === "absent") {
    actionEl = (
      <GardenButton
        label={program === "aftercare" ? "Check In" : "Mark Present"}
        loadingLabel="Saving…"
        loading={busy}
        tone="sage"
        size="sm"
        icon="checkmark-circle-outline"
        onPress={() => void fb.togglePresent(program, row)}
      />
    );
  } else if (status === "present") {
    actionEl = (
      <GardenButton
        label="Record Pickup"
        tone="outline"
        size="sm"
        icon="car-outline"
        disabled={busy}
        onPress={() => void fb.openPickup(program, row)}
      />
    );
  } else {
    actionEl = (
      <PressableScale
        onPress={() => void fb.openPickupDetails(program, row)}
        accessibilityLabel={`Picked up by ${row.record?.picked_up_by_name}. View pickup details`}
        style={ui.pickedChip}
      >
        <Ionicons name="car" size={14} color={GardenTints.mint.fg} />
        <Text style={ui.pickedText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {row.record?.picked_up_by_name}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={GardenTints.mint.fg} />
      </PressableScale>
    );
  }

  return (
    <Animated.View layout={gardenLayout()}>
      <PressableScale
        pressedScale={0.98}
        onPress={() => a.openActions(program, row)}
        accessibilityLabel={a11y}
        accessibilityHint="Opens attendance actions and the profile"
        style={[ui.row, !last && ui.divider]}
      >
        <View style={{ width: 44, height: 44 }}>
          <GardenAvatar name={row.name} uri={row.profile_image_url} seed={row.student_id} size={44} />
          {row.has_allergies === "yes" ? (
            <View style={ui.allergy}>
              <Ionicons name="medical" size={9} color={Garden.white} />
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={ui.name} numberOfLines={1} maxFontSizeMultiplier={1.35}>
              {name}
            </Text>
            {row.program === "homeschool_drop_in" ? (
              <Ionicons name="home" size={13} color={Garden.sageDeep} accessibilityLabel="Homeschool drop-in" />
            ) : null}
            {unpaidPresent ? (
              <Ionicons name="alert-circle" size={14} color={Garden.coralDeep} accessibilityLabel="Present but unpaid" />
            ) : null}
          </View>
          <View style={ui.pills}>
            {status !== "unmarked" ? <StatusPill status={status} /> : null}
            <View style={[ui.pill, { backgroundColor: row.hasEnrollment ? GardenTints.sage.bg : GardenTints.coral.bg }]}>
              <Text
                style={[ui.pillText, { color: row.hasEnrollment ? GardenTints.sage.fg : GardenTints.coral.fg }]}
                maxFontSizeMultiplier={1.3}
              >
                {row.hasEnrollment ? "Paid" : "Unpaid"}
              </Text>
            </View>
            {row.grade ? (
              <Text style={ui.grade} maxFontSizeMultiplier={1.3}>
                {row.grade}
              </Text>
            ) : null}
          </View>
        </View>
        {actionEl}
      </PressableScale>
    </Animated.View>
  );
}

function RosterSkeleton() {
  return (
    <View style={ui.panel}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={[ui.row, i < 4 && ui.divider]}>
          <GardenSkeleton width={44} height={44} radius={22} />
          <View style={{ flex: 1, gap: 8 }}>
            <GardenSkeleton width="50%" height={14} radius={6} />
            <GardenSkeleton width="40%" height={18} radius={9} />
          </View>
          <GardenSkeleton width={112} height={38} radius={19} />
        </View>
      ))}
    </View>
  );
}

export function RosterView({
  a,
  fb,
  program,
}: {
  a: StaffAttendance;
  fb: StaffAttendanceFeedback;
  program: RosterProgram;
}) {
  const list = a.filtered[program];
  const total = a.rows[program].length;
  const q = a.search[program];
  let body: React.ReactNode;
  if (a.loading[program]) body = <RosterSkeleton />;
  else if (a.errors[program] && total === 0) {
    body = (
      <GardenErrorCard
        title="Couldn't load this day's students"
        onRetry={() => void fb.retry()}
        retrying={fb.retrying}
      />
    );
  } else if (list.length === 0) {
    body = q.trim() ? (
      <GardenEmpty
        emoji="🔍"
        title="No students match your search"
        actionLabel="Clear search"
        onAction={() => a.setSearch(program, "")}
        tint="sky"
      />
    ) : (
      <GardenEmpty emoji="📋" title="No enrolled students" tint="mint" />
    );
  } else {
    body = (
      <Animated.View layout={LinearTransition} style={ui.panel}>
        {list.map((row, i) => (
          <RosterRowView key={row.student_id} a={a} fb={fb} program={program} row={row} last={i === list.length - 1} />
        ))}
      </Animated.View>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      <DayBar a={a} program={program} />
      <Progress a={a} program={program} />
      {total > 0 || q ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenField
            icon="search"
            clearable
            value={q}
            onChangeText={(t) => a.setSearch(program, t)}
            placeholder="Search students…"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search students"
          />
        </View>
      ) : null}
      <View style={{ paddingHorizontal: GUTTER }}>{body}</View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Month Plan
// ─────────────────────────────────────────────────────────────────────────────
function AvatarStack({ hc }: { hc: ProgramHeadcount }) {
  const shown = hc.students.slice(0, 3);
  const overflow = hc.count - shown.length;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {shown.map((s, i) => (
        <View key={s.student_id} style={[ui.stackItem, i > 0 && { marginLeft: -10 }]}>
          <GardenAvatar name={s.name} uri={s.profile_image_url} seed={s.student_id} size={30} />
        </View>
      ))}
      {overflow > 0 ? (
        <View style={[ui.stackMore, shown.length > 0 && { marginLeft: -8 }]}>
          <Text style={ui.stackMoreText}>+{overflow}</Text>
        </View>
      ) : null}
    </View>
  );
}

function PlanBlock({
  label,
  program,
  hc,
  onPress,
}: {
  label: string;
  program: RosterProgram;
  hc: ProgramHeadcount;
  onPress: () => void;
}) {
  const t = GardenTints[PROGRAM_TINT[program]];
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={onPress}
      accessibilityLabel={`${label}, ${hc.count} enrolled. Opens the roster`}
      style={[ui.block, { backgroundColor: t.bg }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[ui.blockTitle, { color: t.fg }]} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
        <Text style={ui.blockCount} maxFontSizeMultiplier={1.3}>
          {hc.count} enrolled
        </Text>
      </View>
      <AvatarStack hc={hc} />
      <Ionicons name="chevron-forward" size={16} color={t.fg} />
    </PressableScale>
  );
}

function DaySection({ a, day, index }: { a: StaffAttendance; day: DayHeadcount; index: number }) {
  const reduce = useReducedMotion();
  const [y, m, d] = day.date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const isToday = day.date === a.today;
  return (
    <Animated.View
      entering={reduce ? undefined : gardenEnter(index, { max: 8 })}
      style={[ui.daySection, isToday && { borderColor: Garden.sage, borderWidth: 2 }]}
    >
      <View style={ui.dayHead}>
        <View style={ui.dateChip}>
          <Text style={ui.dateMon}>{dt.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</Text>
          <Text style={ui.dateDay}>{d}</Text>
        </View>
        <Text style={ui.dayTitle} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
          {formatDayHeader(day.date)}
        </Text>
        {isToday ? <Pill tint="sage">Today</Pill> : null}
      </View>
      <View style={{ gap: 8 }}>
        {day.field_friday ? (
          <PlanBlock
            label="Friday Enrichment"
            program="field_friday"
            hc={day.field_friday}
            onPress={() => a.openDay("field_friday", day.date)}
          />
        ) : null}
        {day.school_year ? (
          <PlanBlock
            label="School Year 26–27"
            program="school_year"
            hc={day.school_year}
            onPress={() => a.openDay("school_year", day.date)}
          />
        ) : null}
        {day.aftercare ? (
          <PlanBlock
            label="Extended Learning"
            program="aftercare"
            hc={day.aftercare}
            onPress={() => a.openDay("aftercare", day.date)}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

export function MonthPlanView({ a, fb }: { a: StaffAttendance; fb: StaffAttendanceFeedback }) {
  const canPrev = a.planMonthIndex > 1;
  const canNext = a.planMonthIndex < 10;
  const go = (delta: 1 | -1) => {
    haptic.select();
    a.setPlanMonthIndex((i) => Math.min(10, Math.max(1, i + delta)));
  };
  let body: React.ReactNode;
  if (a.headcountsLoading) {
    body = (
      <View style={{ gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[ui.daySection, { gap: 10 }]}>
            <GardenSkeleton width="40%" height={18} radius={8} />
            <GardenSkeleton width="100%" height={58} radius={18} />
            <GardenSkeleton width="100%" height={58} radius={18} />
          </View>
        ))}
      </View>
    );
  } else if (a.headcountsError) {
    body = <GardenErrorCard title="Couldn't load the month plan" onRetry={() => void fb.retry()} retrying={fb.retrying} />;
  } else {
    body = (
      <View style={{ gap: 12 }}>
        {a.headcounts.map((day, i) => (
          <DaySection key={day.date} a={a} day={day} index={i} />
        ))}
      </View>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      <View style={ui.dayBar}>
        <PressableScale
          onPress={() => canPrev && go(-1)}
          haptics={false}
          disabled={!canPrev}
          accessibilityLabel="Previous month"
          style={[ui.navBtn, !canPrev && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-back" size={20} color={Garden.ink} />
        </PressableScale>
        <PressableScale
          onPress={() => a.monthSheetRef.current?.present()}
          pressedScale={0.97}
          accessibilityLabel={`Showing ${getMonthLabel(a.planMonthIndex)}. Opens the month picker`}
          style={ui.dayCenter}
        >
          <Display size={22} numberOfLines={1}>
            {getMonthLabel(a.planMonthIndex)}
          </Display>
          <Ionicons name="chevron-down" size={16} color={Garden.soft} />
        </PressableScale>
        <PressableScale
          onPress={() => canNext && go(1)}
          haptics={false}
          disabled={!canNext}
          accessibilityLabel="Next month"
          style={[ui.navBtn, !canNext && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-forward" size={20} color={Garden.ink} />
        </PressableScale>
      </View>
      <View style={{ paddingHorizontal: GUTTER }}>{body}</View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
export const ui = StyleSheet.create({
  programChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.pill,
    borderWidth: 1.5,
  },
  programText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5 },

  dayBar: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: GUTTER - 6 },
  navBtn: { width: MIN_TAP, height: MIN_TAP, borderRadius: MIN_TAP / 2, alignItems: "center", justifyContent: "center" },
  dayCenter: {
    flex: 1,
    minHeight: MIN_TAP,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.sage,
  },
  todayText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.white },
  metaRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  count: { fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: Garden.soft },
  track: { height: 6, borderRadius: 3, backgroundColor: "#f1e7d8", overflow: "hidden" },
  fill: { height: 6, borderRadius: 3, backgroundColor: Garden.sage },

  panel: { ...gardenCard, borderRadius: 22, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 66,
    backgroundColor: Garden.white,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: "#f5eee3" },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink, flexShrink: 1 },
  pills: { flexDirection: "row", gap: 5, flexWrap: "wrap", alignItems: "center" },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: GardenRadii.pill },
  pillText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5 },
  grade: { fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.muted },
  allergy: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Garden.danger,
    borderWidth: 2,
    borderColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  pickedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 130,
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: GardenRadii.pill,
    backgroundColor: GardenTints.mint.bg,
  },
  pickedText: { flexShrink: 1, fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: GardenTints.mint.fg },

  daySection: { ...gardenCard, borderRadius: 22, padding: 12, gap: 10, borderWidth: 1, borderColor: Garden.line },
  dayHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateChip: {
    width: 44,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: GardenTints.sky.bg,
  },
  dateMon: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10, letterSpacing: 0.6, color: GardenTints.sky.fg },
  dateDay: { fontFamily: GardenFonts.display, fontSize: 19, lineHeight: 22, color: Garden.ink },
  dayTitle: { flex: 1, fontFamily: GardenFonts.display, fontSize: 16, color: Garden.ink },
  block: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  blockTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14 },
  blockCount: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.soft },
  stackItem: { borderRadius: 17, borderWidth: 2, borderColor: Garden.white },
  stackMore: {
    height: 30,
    minWidth: 30,
    paddingHorizontal: 6,
    borderRadius: 15,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  stackMoreText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5, color: Garden.soft },
});
