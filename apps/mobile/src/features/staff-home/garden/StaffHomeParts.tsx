// Garden building blocks for the staff Home. Same kit and tokens as the parent
// Home, tuned for a work tool: denser rows, one primary action per row, status
// always shown as colour + icon + text. Every part reads from useStaffHome()
// and routes writes through useStaffHomeFeedback(). See the
// sagefield-garden-mobile skill (staff.md).
import {
  CountBadge,
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenRadii,
  GardenSectionHeader,
  GardenSkeleton,
  GardenTints,
  HandNote,
  MIN_TAP,
  Pill,
  PressableScale,
  gardenCard,
  gardenLayout,
  gardenPopIn,
  gardenShadowSm,
  haptic,
  type GardenTint,
} from "@/components/garden";
import { getGreeting } from "@/components/HomeHeroHeader";
import { getTeacherColors } from "@/lib/group-by-teacher";
import { CONFERENCE_TEACHERS } from "@/lib/parent-teacher-conference";
import { SCHOOL_YEAR_START } from "@/lib/school-year-attendance";
import type { SchoolYearTodayStudent } from "@/lib/school-year-today-students";
import {
  CONFERENCE_COUNTDOWN_STYLES,
  filterActiveConferenceBookings,
  filterBookingsByTeacher,
  formatConferenceFormatLabel,
  formatUpcomingRelativeDay,
  getAlertBooking,
  getConferenceCountdown,
  getConferenceMinutesUntil,
  getUpcomingBookings,
  UPCOMING_CONFERENCE_DAYS,
  type ConferenceTeacherFilter,
  type StaffConferenceBooking,
} from "@/lib/staff-conference-bookings";
import {
  formatBirthdayRelativeDay,
  UPCOMING_BIRTHDAY_DAYS,
  type StaffBirthday,
} from "@/lib/staff-upcoming-birthdays";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import {
  STATUS_FILTER_CHIPS,
  emptyTeacherRosterSummary,
  formatEventTime,
  formatTodayDate,
  isStudentCheckedIn,
  parseYMD,
  roleLabel,
  shiftDay,
  shortName,
  getStudentDayStatus,
  type StaffUpcomingCalendarEvent,
  type StudentDayStatus,
  type StudentStatusFilter,
  type TeacherRosterSummary,
  type TeacherRosterSummaryBucket,
} from "../staffHomeUtils";
import type { StaffHome } from "../useStaffHome";
import type { StaffHomeFeedback } from "./useStaffHomeFeedback";

export const GUTTER = 18;
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

/** Status → tint, icon and label. Colour is never the only signal. */
export const STATUS_META: Record<
  StudentDayStatus,
  { label: string; tint: GardenTint; icon: IoniconName }
> = {
  unmarked: { label: "Unmarked", tint: "butter", icon: "ellipse-outline" },
  present: { label: "Present", tint: "sage", icon: "checkmark-circle" },
  picked_up: { label: "Picked Up", tint: "mint", icon: "car" },
  absent: { label: "Absent", tint: "coral", icon: "moon" },
};

export function StatusPill({ status }: { status: StudentDayStatus }) {
  const meta = STATUS_META[status];
  const t = GardenTints[meta.tint];
  return (
    <Animated.View key={status} entering={gardenPopIn()} style={[ui.pill, { backgroundColor: t.bg }]}>
      <Ionicons name={meta.icon} size={12} color={t.fg} />
      <Text style={[ui.pillText, { color: t.fg }]} maxFontSizeMultiplier={1.3}>
        {meta.label}
      </Text>
    </Animated.View>
  );
}

export function UnpaidPill() {
  return (
    <View style={[ui.pill, { backgroundColor: GardenTints.coral.bg }]}>
      <Text style={[ui.pillText, { color: GardenTints.coral.fg }]} maxFontSizeMultiplier={1.3}>
        Unpaid
      </Text>
    </View>
  );
}

/** Avatar with the red allergy badge used on rows and sheets. */
export function StudentAvatar({
  student,
  size = 44,
}: {
  student: Pick<SchoolYearTodayStudent, "student_id" | "name" | "profile_image_url" | "has_allergies">;
  size?: number;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <GardenAvatar name={student.name} uri={student.profile_image_url} seed={student.student_id} size={size} />
      {student.has_allergies === "yes" ? (
        <View style={ui.allergyBadge}>
          <Ionicons name="medical" size={9} color={Garden.white} />
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────
export function StaffHero({ h }: { h: StaffHome }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <View style={hero.wrap}>
      <View style={{ flex: 1 }}>
        <HandNote size={20} color={Garden.sageDeep}>
          {getGreeting()},
        </HandNote>
        <Display size={36} numberOfLines={1}>
          {h.firstName || h.fullName || " "}
        </Display>
        <View style={hero.pills}>
          {h.role ? (
            <Pill tint={h.role === "super_admin" ? "lav" : "sage"}>{roleLabel(h.role)}</Pill>
          ) : null}
          <Pill tint="butter">☀️ {today}</Pill>
        </View>
      </View>
      <PressableScale
        onPress={() => h.avatarSheetRef.current?.present()}
        accessibilityLabel="Your profile"
        style={hero.avatar}
      >
        {h.profileImageUrl ? (
          <Image source={{ uri: h.profileImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={hero.initials}>{h.initials}</Text>
        )}
      </PressableScale>
    </View>
  );
}

const hero = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 12,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Garden.mint,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Garden.white,
    marginTop: 4,
    ...gardenShadowSm,
  },
  initials: { fontFamily: GardenFonts.display, fontSize: 16, color: Garden.sageDeep },
});

// ─────────────────────────────────────────────────────────────────────────────
// Alerts: pickup reminder + campus tours
// ─────────────────────────────────────────────────────────────────────────────
export function StaffAlerts({ h }: { h: StaffHome }) {
  const showPickup = h.unpickedStudents.length > 0;
  if (!showPickup && !h.showTourBanner) return null;
  const isSuperAdmin = h.role === "super_admin";
  const d = new Date();

  const tourBody = (
    <>
      <View style={tk.stub}>
        <Text style={tk.stubWk}>{d.toLocaleDateString("en-US", { weekday: "short" })}</Text>
        <Text style={tk.stubDay}>{d.getDate()}</Text>
        <Text style={tk.stubMo}>{d.toLocaleDateString("en-US", { month: "short" })}</Text>
      </View>
      <View style={tk.perf} />
      <View style={{ flex: 1, paddingVertical: 14, paddingRight: 14, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={tk.title}>
            {h.todayTours.length === 1 ? "Campus tour today" : "Campus tours today"}
          </Text>
          {h.todayTours.length > 1 ? <Pill tint="sky">{h.todayTours.length}</Pill> : null}
        </View>
        <Text style={tk.line}>{h.todayToursSummary}</Text>
        {isSuperAdmin ? (
          <View style={tk.hintRow}>
            <Text style={tk.hint}>Tap to open Campus Tours</Text>
            <Ionicons name="arrow-forward" size={13} color="#2f5f8a" />
          </View>
        ) : null}
      </View>
    </>
  );

  return (
    <View style={{ paddingHorizontal: GUTTER, gap: 12, marginBottom: 22 }}>
      {showPickup ? (
        <Animated.View entering={FadeIn}>
          <PressableScale
            pressedScale={0.98}
            onPress={() => h.router.push("/(staff)/attendance" as any)}
            accessibilityLabel={`Pickup not recorded for ${h.unpickedStudents.length} students: ${h.unpickedNamePreview}. Tap to record pickup in Attendance`}
            style={al.card}
          >
            <View style={al.icon}>
              <Ionicons name="warning" size={20} color={Garden.coralDeep} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={al.title}>Pickup not recorded</Text>
                <CountBadge count={h.unpickedStudents.length} />
              </View>
              <Text style={al.body}>{h.unpickedNamePreview}</Text>
              <Text style={al.hint}>Tap to record pickup in Attendance</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={GardenTints.coral.fg} />
          </PressableScale>
        </Animated.View>
      ) : null}

      {h.showTourBanner ? (
        isSuperAdmin ? (
          <PressableScale
            pressedScale={0.98}
            onPress={() => h.router.push("/(staff)/admin/tours" as any)}
            accessibilityLabel={`${h.todayTours.length === 1 ? "Campus tour today" : "Campus tours today"}. ${h.todayToursSummary}. Tap to open Campus Tours`}
            style={tk.ticket}
          >
            {tourBody}
          </PressableScale>
        ) : (
          <View
            style={tk.ticket}
            accessible
            accessibilityLabel={`${h.todayTours.length === 1 ? "Campus tour today" : "Campus tours today"}. ${h.todayToursSummary}`}
          >
            {tourBody}
          </View>
        )
      ) : null}
    </View>
  );
}

const al = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: GardenTints.coral.bg,
    borderBottomWidth: 4,
    borderBottomColor: Garden.coral,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: GardenFonts.display, fontSize: 18, color: GardenTints.coral.fg },
  body: { fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.ink },
  hint: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: GardenTints.coral.fg },
});

const tk = StyleSheet.create({
  ticket: {
    flexDirection: "row",
    backgroundColor: Garden.white,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Garden.line,
    ...gardenShadowSm,
  },
  stub: {
    width: 72,
    backgroundColor: "#7aa7cf",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  stubWk: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: "rgba(255,255,255,0.9)", textTransform: "uppercase" },
  stubDay: { fontFamily: GardenFonts.display, fontSize: 30, color: Garden.white, lineHeight: 34 },
  stubMo: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: "rgba(255,255,255,0.9)", textTransform: "uppercase" },
  perf: {
    width: 0,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: Garden.line,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  title: { fontFamily: GardenFonts.display, fontSize: 18, color: Garden.ink, flexShrink: 1 },
  line: { fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.soft, lineHeight: 19 },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  hint: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: "#2f5f8a" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Day roster: date bar, progress note, status filter, teacher groups
// ─────────────────────────────────────────────────────────────────────────────
function DayBar({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  const isToday = h.selectedDate === h.todayActual;
  const go = (delta: 1 | -1) => {
    haptic.select();
    h.setSelectedDate((d) => shiftDay(d, delta));
  };
  const longDate = parseYMD(h.selectedDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <View style={day.bar}>
      <PressableScale
        onPress={() => go(-1)}
        haptics={false}
        accessibilityLabel="Previous day"
        style={day.navBtn}
      >
        <Ionicons name="chevron-back" size={20} color={Garden.ink} />
      </PressableScale>
      <View style={day.center} accessible accessibilityLabel={`Showing ${longDate}${isToday ? ", today" : ""}`}>
        <Display size={24} numberOfLines={1}>
          {formatTodayDate(h.selectedDate)}
        </Display>
        {isToday ? (
          <Pill tint="sage">Today</Pill>
        ) : (
          <PressableScale
            onPress={() => {
              haptic.select();
              h.setSelectedDate(h.todayActual);
            }}
            haptics={false}
            hitSlop={8}
            accessibilityLabel="Back to today"
            style={day.backToday}
          >
            <Ionicons name="return-up-back" size={13} color={Garden.white} />
            <Text style={day.backTodayText}>Today</Text>
          </PressableScale>
        )}
      </View>
      <PressableScale
        onPress={() => go(1)}
        haptics={false}
        accessibilityLabel="Next day"
        style={day.navBtn}
      >
        <Ionicons name="chevron-forward" size={20} color={Garden.ink} />
      </PressableScale>
      <PressableScale
        onPress={() => void fb.openAddStudent()}
        accessibilityLabel="Add student to this day's list"
        style={day.addBtn}
      >
        <Ionicons name="add" size={24} color={Garden.white} />
      </PressableScale>
    </View>
  );
}

function StatusFilters({ h }: { h: StaffHome }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={day.filters}
    >
      {STATUS_FILTER_CHIPS.map(({ key, label }) => {
        const active = h.statusFilter === key;
        const count = key === "all" ? h.todayStudents.length : h.statusCounts[key];
        const t =
          key === "all"
            ? { bg: Garden.white, fg: Garden.ink, solid: Garden.ink }
            : {
                ...GardenTints[STATUS_META[key].tint],
                solid: GardenTints[STATUS_META[key].tint].fg,
              };
        return (
          <PressableScale
            key={key}
            haptics="select"
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${label}, ${count}`}
            onPress={() => h.setStatusFilter(key as StudentStatusFilter)}
            hitSlop={{ top: 4, bottom: 4 }}
            style={[
              day.chip,
              { backgroundColor: active ? t.solid : t.bg, borderColor: active ? t.solid : Garden.line },
            ]}
          >
            <Text style={[day.chipText, { color: active ? Garden.white : t.fg }]} maxFontSizeMultiplier={1.3}>
              {label} · {count}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

function StudentRow({
  h,
  fb,
  student,
  last,
}: {
  h: StaffHome;
  fb: StaffHomeFeedback;
  student: SchoolYearTodayStudent;
  last: boolean;
}) {
  const status = getStudentDayStatus(student, h.selectedIsFriday);
  const record = h.getActiveAttendanceRecord(student);
  const isPresent = isStudentCheckedIn(record);
  const pickedUp = !!record?.picked_up_by_name;
  const isPaid = h.selectedIsFriday
    ? student.hasSchoolYearFridayEnrollment
    : student.hasSchoolYearEnrollment;
  const busy = !!h.pending[student.student_id];
  const name = shortName(student.name);

  return (
    <Animated.View layout={gardenLayout()}>
      <PressableScale
        pressedScale={0.98}
        onPress={() => h.openStudentActions(student)}
        accessibilityLabel={`${name}, ${STATUS_META[status].label}${isPaid ? "" : ", unpaid"}${student.has_allergies === "yes" ? ", has allergies" : ""}`}
        accessibilityHint="Opens attendance actions"
        style={[row.wrap, !last && row.divider]}
      >
        <StudentAvatar student={student} />
        <View style={row.info}>
          <View style={row.nameRow}>
            <Text style={row.name} numberOfLines={1} maxFontSizeMultiplier={1.35}>
              {name}
            </Text>
            {student.program === "homeschool_drop_in" ? (
              <Ionicons name="home" size={13} color={Garden.sageDeep} accessibilityLabel="Homeschool drop-in" />
            ) : null}
          </View>
          <View style={row.pills}>
            {status !== "unmarked" ? <StatusPill status={status} /> : null}
            {!isPaid ? <UnpaidPill /> : null}
          </View>
        </View>
        {!isPresent ? (
          <GardenButton
            label="Mark Present"
            loadingLabel="Saving…"
            loading={busy}
            tone="sage"
            size="sm"
            icon="checkmark-circle-outline"
            onPress={() => void fb.markPresent(student)}
          />
        ) : !pickedUp ? (
          <GardenButton
            label="Record Pickup"
            tone="outline"
            size="sm"
            icon="car-outline"
            disabled={busy}
            onPress={() => void fb.openPickup(student)}
          />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={Garden.muted} />
        )}
      </PressableScale>
    </Animated.View>
  );
}

function RosterSkeleton() {
  return (
    <View style={[row.group, { paddingVertical: 6 }]}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={[row.wrap, i < 4 && row.divider]}>
          <GardenSkeleton width={44} height={44} radius={22} />
          <View style={{ flex: 1, gap: 8 }}>
            <GardenSkeleton width="55%" height={14} radius={6} />
            <GardenSkeleton width="35%" height={18} radius={9} />
          </View>
          <GardenSkeleton width={112} height={38} radius={19} />
        </View>
      ))}
    </View>
  );
}

const GROUP_SUMMARY_KEYS: TeacherRosterSummaryBucket[] = ["present", "unmarked", "absent"];

function TeacherGroupAttendanceSummary({
  teacherName,
  summary,
}: {
  teacherName: string;
  summary: TeacherRosterSummary;
}) {
  const a11y = `${teacherName}, ${summary.present} present, ${summary.unmarked} unmarked, ${summary.absent} absent`;
  return (
    <View
      style={row.groupSummary}
      accessibilityRole="text"
      accessibilityLabel={a11y}
      accessible
    >
      {GROUP_SUMMARY_KEYS.map((key, index) => {
        const meta = STATUS_META[key];
        const t = GardenTints[meta.tint];
        const label = meta.label.toLowerCase();
        return (
          <View key={key} style={row.groupSummarySegment} importantForAccessibility="no-hide-descendants">
            {index > 0 ? (
              <Text style={row.groupSummarySep} accessibilityElementsHidden>
                {" · "}
              </Text>
            ) : null}
            {key === "present" ? (
              <View style={row.groupSummaryIconPair}>
                <Ionicons name={meta.icon} size={11} color={t.fg} accessibilityElementsHidden />
                <Text style={[row.groupSummaryText, { color: t.fg }]} maxFontSizeMultiplier={1.3}>
                  {summary[key]}
                </Text>
              </View>
            ) : (
              <Text style={[row.groupSummaryText, { color: t.fg }]} maxFontSizeMultiplier={1.3}>
                {summary[key]} {label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function RosterEmpty({ h }: { h: StaffHome }) {
  if (h.statusFilter !== "all") {
    const filterLabels: Record<StudentDayStatus, string> = {
      unmarked: "unmarked",
      present: "present",
      picked_up: "picked up",
      absent: "absent",
    };
    return (
      <GardenEmpty
        emoji="🔍"
        title={`No ${filterLabels[h.statusFilter]} students`}
        body="Try selecting a different filter."
        actionLabel="Show all"
        onAction={() => h.setStatusFilter("all")}
        tint="sky"
      />
    );
  }
  // Uses the *selected* day (it used to read today's weekday by mistake).
  const selectedDay = parseYMD(h.selectedDate);
  const dow = selectedDay.getDay();
  const isWeekend = dow === 0 || dow === 6;
  const beforeSchoolYear = selectedDay < SCHOOL_YEAR_START;
  return (
    <GardenEmpty
      emoji={isWeekend ? "🌤️" : beforeSchoolYear ? "🌱" : "📋"}
      tint={isWeekend ? "butter" : "mint"}
      title={
        isWeekend
          ? "No school today"
          : beforeSchoolYear
            ? "School year hasn't started yet"
            : "No students scheduled today"
      }
      body={
        isWeekend
          ? "Enjoy your weekend!"
          : beforeSchoolYear
            ? `School year begins ${SCHOOL_YEAR_START.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
            : "No paid enrollments found for today."
      }
    />
  );
}

export function DayRoster({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  const total = h.todayStudents.length;
  const unmarked = h.statusCounts.unmarked;
  const note = h.studentsLoading
    ? "loading the list…"
    : total === 0
      ? undefined
      : unmarked === 0
        ? `all ${total} marked ✓`
        : `${unmarked} of ${total} still to mark`;

  return (
    <View style={{ marginBottom: 28 }}>
      <DayBar h={h} fb={fb} />
      <View style={day.metaRow}>
        <Text style={day.count} maxFontSizeMultiplier={1.3}>
          {h.studentsLoading
            ? " "
            : `${h.filteredStudents.length} ${h.filteredStudents.length === 1 ? "student" : "students"}`}
        </Text>
        {note ? (
          <HandNote size={16} color={unmarked === 0 && total > 0 ? Garden.sageDeep : Garden.butterDeep}>
            {note}
          </HandNote>
        ) : null}
      </View>
      {total > 0 && !h.studentsLoading ? (
        <View style={day.progressTrack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Animated.View
            layout={LinearTransition}
            style={[day.progressFill, { width: `${Math.round(((total - unmarked) / total) * 100)}%` }]}
          />
        </View>
      ) : null}

      {!h.studentsLoading && total > 0 ? <StatusFilters h={h} /> : null}

      <View style={{ paddingHorizontal: GUTTER, gap: 14 }}>
        {h.studentsLoading ? (
          <RosterSkeleton />
        ) : h.studentsError && total === 0 ? (
          <GardenErrorCard
            title="Couldn't load today's students"
            onRetry={() => void fb.retry()}
            retrying={fb.retrying}
          />
        ) : h.filteredStudents.length === 0 ? (
          <RosterEmpty h={h} />
        ) : (
          h.teacherSections.map((section) => {
            const colors = getTeacherColors(section.teacherName);
            return (
              <Animated.View key={section.teacherName} layout={LinearTransition} style={row.group}>
                <View style={row.groupHeader}>
                  <View style={[row.groupDot, { backgroundColor: colors.accent }]} />
                  <Text style={row.groupTitle} numberOfLines={1} accessibilityRole="header">
                    {section.teacherName}
                  </Text>
                  <TeacherGroupAttendanceSummary
                    teacherName={section.teacherName}
                    summary={
                      h.teacherRosterSummaries.get(section.teacherName) ?? emptyTeacherRosterSummary()
                    }
                  />
                </View>
                {section.students.map((student, i) => (
                  <StudentRow
                    key={student.student_id}
                    h={h}
                    fb={fb}
                    student={student}
                    last={i === section.students.length - 1}
                  />
                ))}
              </Animated.View>
            );
          })
        )}
      </View>
    </View>
  );
}

const day = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: GUTTER - 6,
  },
  navBtn: {
    width: MIN_TAP,
    height: MIN_TAP,
    borderRadius: MIN_TAP / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", flexWrap: "wrap" },
  backToday: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Garden.sage,
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backTodayText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.white },
  addBtn: {
    width: MIN_TAP,
    height: MIN_TAP,
    borderRadius: MIN_TAP / 2,
    backgroundColor: Garden.sage,
    borderBottomWidth: 3,
    borderBottomColor: Garden.sageDeep,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: GUTTER,
    marginTop: 4,
  },
  count: { fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: Garden.soft },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#f1e7d8",
    marginHorizontal: GUTTER,
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Garden.sage },
  filters: { gap: 8, paddingHorizontal: GUTTER, paddingTop: 14, paddingBottom: 14 },
  chip: {
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 14,
    minHeight: 38,
    justifyContent: "center",
    borderWidth: 1,
  },
  chipText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5 },
});

const row = StyleSheet.create({
  group: { ...gardenCard, borderRadius: 22, overflow: "hidden" },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  groupDot: { width: 10, height: 10, borderRadius: 5 },
  groupTitle: { flex: 1, fontFamily: GardenFonts.display, fontSize: 16, color: Garden.ink },
  groupSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 0,
  },
  groupSummarySegment: { flexDirection: "row", alignItems: "center" },
  groupSummaryIconPair: { flexDirection: "row", alignItems: "center", gap: 3 },
  groupSummarySep: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5, color: Garden.muted },
  groupSummaryText: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5 },
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 66,
    backgroundColor: Garden.white,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: "#f5eee3" },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink, flexShrink: 1 },
  pills: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Health & Food quick access
// ─────────────────────────────────────────────────────────────────────────────
function QuickRow({
  icon,
  tint,
  label,
  badge,
  onPress,
  hint,
}: {
  icon: IoniconName;
  tint: GardenTint;
  label: string;
  badge: string;
  onPress: () => void;
  hint: string;
}) {
  const t = GardenTints[tint];
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={onPress}
      accessibilityLabel={`${label}, ${badge}`}
      accessibilityHint={hint}
      style={qa.row}
    >
      <View style={[qa.icon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={18} color={t.fg} />
      </View>
      <Text style={qa.label} numberOfLines={2}>
        {label}
      </Text>
      <View style={[qa.badge, { backgroundColor: t.fg }]}>
        <Text style={qa.badgeText} maxFontSizeMultiplier={1.2}>
          {badge}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Garden.muted} />
    </PressableScale>
  );
}

export function HealthFoodSection({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  const prefsLoading = h.activitiesLoading || h.weekActivityPrefsLoading;
  return (
    <View style={{ marginBottom: 28 }}>
      <GardenSectionHeader title="Health & Food" />
      <View style={{ paddingHorizontal: GUTTER, gap: 10 }}>
        {h.allergyCount > 0 ? (
          <QuickRow
            icon="medical"
            tint="coral"
            label="Allergies for Today"
            badge={String(h.allergyCount)}
            hint="Shows allergy and medical details"
            onPress={() => void fb.openAllergies()}
          />
        ) : null}
        <QuickRow
          icon="restaurant-outline"
          tint="butter"
          label="School Day Food Preferences"
          badge={h.schoolDayFoodLoading ? "…" : String(h.schoolDayFoodPrefs.length)}
          hint="Opens food preferences"
          onPress={() => h.schoolDayFoodSheetRef.current?.present()}
        />
        <QuickRow
          icon="clipboard-outline"
          tint="sage"
          label="Upcoming Activity Preferences"
          badge={prefsLoading ? "…" : h.weekActivityPrefBadge}
          hint="Opens this week's activity sign-ups"
          onPress={() => h.weekActivityPrefsSheetRef.current?.present()}
        />
      </View>
    </View>
  );
}

const qa = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
    ...gardenCard,
    borderRadius: 20,
  },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 14.5, color: Garden.ink },
  badge: { minWidth: 30, borderRadius: GardenRadii.pill, paddingHorizontal: 8, paddingVertical: 3, alignItems: "center" },
  badgeText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: Garden.white },
});

// ─────────────────────────────────────────────────────────────────────────────
// Parent-teacher conferences (conference teachers only)
// ─────────────────────────────────────────────────────────────────────────────
function parentShort(name: string | null | undefined): string {
  if (!name?.trim()) return "Parent";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function teacherFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

const CONF_FILTERS: { key: ConferenceTeacherFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mine", label: "Mine" },
  ...CONFERENCE_TEACHERS.map((t) => ({ key: t.id, label: teacherFirstName(t.name) })),
];

function ConferenceTicket({
  booking,
  isOwn,
  now,
  onPress,
}: {
  booking: StaffConferenceBooking;
  isOwn: boolean;
  now: Date;
  onPress: () => void;
}) {
  const d = new Date(`${booking.conferenceDate}T12:00:00`);
  const countdown = getConferenceCountdown(booking.conferenceDate, booking.timeSlot, now);
  const cs = CONFERENCE_COUNTDOWN_STYLES[countdown.urgency];
  const isInPerson = booking.format === "in_person";
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={onPress}
      accessibilityLabel={`Conference for ${booking.studentName}, ${countdown.label}, ${booking.timeSlot}, ${formatConferenceFormatLabel(booking.format)}${isOwn ? ", your conference" : `, with ${teacherFirstName(booking.teacherName)}`}`}
      style={tk.ticket}
    >
      <View style={[tk.stub, { backgroundColor: isOwn ? Garden.sage : "#b9b2a6" }]}>
        <Text style={tk.stubWk}>{d.toLocaleDateString("en-US", { weekday: "short" })}</Text>
        <Text style={tk.stubDay}>{d.getDate()}</Text>
        <Text style={tk.stubMo}>{d.toLocaleDateString("en-US", { month: "short" })}</Text>
      </View>
      <View style={tk.perf} />
      <View style={{ flex: 1, paddingVertical: 12, paddingRight: 12, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Text style={[tk.title, { fontSize: 17 }]} numberOfLines={1}>
            {booking.studentName}
          </Text>
          <View style={[ui.pill, { backgroundColor: cs.backgroundColor }]}>
            <Text style={[ui.pillText, { color: cs.color }]}>{countdown.label}</Text>
          </View>
        </View>
        {isOwn ? <Pill tint="sage" style={{ alignSelf: "flex-start" }}>Your conference</Pill> : null}
        <Text style={tk.line} numberOfLines={1}>
          Parent: {parentShort(booking.parentName)}
          {!isOwn ? ` · with ${teacherFirstName(booking.teacherName)}` : ""}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="time-outline" size={13} color={Garden.soft} />
          <Text style={tk.line}>{booking.timeSlot}</Text>
          <Pill tint={isInPerson ? "mint" : "sky"}>{formatConferenceFormatLabel(booking.format)}</Pill>
        </View>
      </View>
    </PressableScale>
  );
}

export function ConferenceSection({ h }: { h: StaffHome }) {
  const [expanded, setExpanded] = useState(false);
  const [teacherFilter, setTeacherFilter] = useState<ConferenceTeacherFilter>("all");
  const [now, setNow] = useState(() => new Date());
  const bookings = h.conferenceBookings;
  const loading = h.conferenceBookingsLoading;
  const currentTeacherId = h.userId;
  const todayYmd = h.todayActual;

  const activeBookings = useMemo(() => filterActiveConferenceBookings(bookings, now), [bookings, now]);
  const filteredBookings = useMemo(
    () => filterBookingsByTeacher(activeBookings, teacherFilter, currentTeacherId),
    [activeBookings, teacherFilter, currentTeacherId],
  );
  const needsFrequentRefresh = useMemo(
    () =>
      filteredBookings.some(
        (b) => getConferenceMinutesUntil(b.conferenceDate, b.timeSlot, now) < 24 * 60,
      ),
    [filteredBookings, now],
  );
  useEffect(() => {
    if (!needsFrequentRefresh) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [needsFrequentRefresh]);
  useEffect(() => {
    setExpanded(false);
  }, [teacherFilter]);

  if (!h.showConferenceSection || !h.userId) return null;

  const alertBooking = getAlertBooking(activeBookings, todayYmd, currentTeacherId);
  const upcoming = getUpcomingBookings(activeBookings, todayYmd);
  const remainingCount = Math.max(0, filteredBookings.length - 3);
  const visibleBookings = expanded ? filteredBookings : filteredBookings.slice(0, 3);
  const alertIsOwn = alertBooking != null && alertBooking.teacherId === currentTeacherId;
  const hasBookings = !loading && activeBookings.length > 0;

  return (
    <View style={{ marginBottom: 28 }}>
      <GardenSectionHeader
        title="Parent-Teacher Conferences"
        note={hasBookings ? `${activeBookings.length} booked` : undefined}
        actionLabel="Details"
        onAction={hasBookings ? () => h.ptcBookingsSheetRef.current?.presentList() : undefined}
      />
      {hasBookings ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole="tablist"
          contentContainerStyle={[day.filters, { paddingTop: 0 }]}
        >
          {CONF_FILTERS.map(({ key, label }) => {
            const active = teacherFilter === key;
            return (
              <PressableScale
                key={key}
                haptics="select"
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
                onPress={() => setTeacherFilter(key)}
                hitSlop={{ top: 4, bottom: 4 }}
                style={[
                  day.chip,
                  {
                    backgroundColor: active ? Garden.ink : Garden.white,
                    borderColor: active ? Garden.ink : Garden.line,
                  },
                ]}
              >
                <Text style={[day.chipText, { color: active ? Garden.white : Garden.ink }]}>{label}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={{ paddingHorizontal: GUTTER, gap: 10 }}>
        {loading ? (
          <>
            <GardenSkeleton width="100%" height={92} radius={22} />
            <GardenSkeleton width="100%" height={92} radius={22} />
          </>
        ) : activeBookings.length === 0 ? (
          <GardenEmpty emoji="🎟️" title="No conferences scheduled yet." tint="sky" />
        ) : filteredBookings.length === 0 ? (
          <GardenEmpty
            emoji="🔍"
            title="No conferences match this filter."
            tint="sky"
            actionLabel="Show all"
            onAction={() => setTeacherFilter("all")}
          />
        ) : (
          <>
            {alertBooking && teacherFilter === "all" ? (
              <View
                style={[
                  cf.alert,
                  { backgroundColor: alertIsOwn ? GardenTints.sage.bg : GardenTints.butter.bg },
                ]}
                accessibilityRole="alert"
              >
                <View style={cf.alertIcon}>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={alertIsOwn ? Garden.sageDeep : GardenTints.butter.fg}
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[cf.alertTitle, { color: alertIsOwn ? Garden.sageDeep : GardenTints.butter.fg }]}
                  >
                    Conference with {alertBooking.studentName}{" "}
                    {formatUpcomingRelativeDay(alertBooking.conferenceDate, todayYmd)} ·{" "}
                    {alertBooking.timeSlot} ({formatConferenceFormatLabel(alertBooking.format)})
                    {!alertIsOwn ? ` · ${teacherFirstName(alertBooking.teacherName)}` : ""}
                  </Text>
                  {upcoming.length > 1 ? (
                    <Text style={cf.alertSub}>
                      {upcoming.length - 1} more conference
                      {upcoming.length - 1 === 1 ? "" : "s"} in the next {UPCOMING_CONFERENCE_DAYS} days
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}
            {visibleBookings.map((booking) => (
              <Animated.View key={booking.id} entering={FadeIn} layout={LinearTransition}>
                <ConferenceTicket
                  booking={booking}
                  isOwn={booking.teacherId === currentTeacherId}
                  now={now}
                  onPress={() => h.ptcBookingsSheetRef.current?.presentDetail(booking.id)}
                />
              </Animated.View>
            ))}
            {remainingCount > 0 && !expanded ? (
              <GardenButton
                label={`View all (${remainingCount} more)`}
                tone="outline"
                size="sm"
                iconRight="chevron-down"
                onPress={() => setExpanded(true)}
                style={{ alignSelf: "center", marginTop: 4 }}
              />
            ) : null}
            {expanded ? (
              <GardenButton
                label="Show less"
                tone="outline"
                size="sm"
                iconRight="chevron-up"
                onPress={() => setExpanded(false)}
                style={{ alignSelf: "center", marginTop: 4 }}
              />
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const cf = StyleSheet.create({
  alert: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 20 },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, lineHeight: 19 },
  alertSub: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.soft },
});

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming activities rail
// ─────────────────────────────────────────────────────────────────────────────
const CARD_W = 180;

export function ActivitiesRail({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <GardenSectionHeader title="Upcoming Activities" />
      {h.activitiesLoading ? (
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: GUTTER }}>
          {[0, 1, 2].map((i) => (
            <GardenSkeleton key={i} width={CARD_W} height={170} radius={22} />
          ))}
        </View>
      ) : h.activitiesError && h.activities.length === 0 ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenErrorCard
            title="Couldn't load activities"
            onRetry={() => void fb.retry()}
            retrying={fb.retrying}
          />
        </View>
      ) : h.activities.length === 0 ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenEmpty emoji="🎨" title="No published activities yet." tint="lav" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_W + 10}
          contentContainerStyle={{ gap: 10, paddingHorizontal: GUTTER, paddingBottom: 6 }}
        >
          {h.activities.map((activity) => {
            const thumb = activity.images[0]?.signed_url ?? null;
            const counts = h.prefCounts[activity.id];
            const date = activity.activity_date
              ? parseYMD(activity.activity_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : null;
            return (
              <PressableScale
                key={activity.id}
                onPress={() =>
                  h.router.push({
                    pathname: "/(staff)/activities/[activityId]" as any,
                    params: { activityId: activity.id },
                  })
                }
                accessibilityLabel={`${activity.title}${date ? `, ${date}` : ""}. Opens activity`}
                style={ac.card}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={ac.thumb} contentFit="cover" />
                ) : (
                  <View style={[ac.thumb, ac.thumbEmpty]}>
                    <Text style={{ fontSize: 26 }}>🎨</Text>
                  </View>
                )}
                {date ? (
                  <View style={ac.date}>
                    <Text style={ac.dateText}>{date}</Text>
                  </View>
                ) : null}
                <Text style={ac.title} numberOfLines={2}>
                  {activity.title}
                </Text>
                <View style={ac.footer}>
                  <View style={ac.chips}>
                    {counts?.full > 0 ? (
                      <View style={[ui.pill, { backgroundColor: GardenTints.mint.bg }]}>
                        <Text style={[ui.pillText, { color: GardenTints.mint.fg }]}>✅ {counts.full}</Text>
                      </View>
                    ) : null}
                    {counts?.nonFull > 0 ? (
                      <View style={[ui.pill, { backgroundColor: GardenTints.butter.bg }]}>
                        <Text style={[ui.pillText, { color: GardenTints.butter.fg }]}>⚠️ {counts.nonFull}</Text>
                      </View>
                    ) : null}
                  </View>
                  <PressableScale
                    hitSlop={6}
                    onPress={() => {
                      h.setSelectedPrefsActivityId(activity.id);
                      h.homePrefsSheetRef.current?.present();
                    }}
                    accessibilityLabel={`Preferences for ${activity.title}`}
                    style={ac.peopleBtn}
                  >
                    <Ionicons name="people-outline" size={18} color={Garden.sageDeep} />
                  </PressableScale>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const ac = StyleSheet.create({
  card: { width: CARD_W, ...gardenCard, borderRadius: 22, overflow: "hidden" },
  thumb: { width: "100%", height: 92 },
  thumbEmpty: { backgroundColor: Garden.lav, alignItems: "center", justifyContent: "center" },
  date: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dateText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: Garden.sageDeep },
  title: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 13.5,
    color: Garden.ink,
    paddingHorizontal: 12,
    paddingTop: 10,
    lineHeight: 18,
    minHeight: 46,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  chips: { flexDirection: "row", gap: 4, flexWrap: "wrap", flex: 1 },
  peopleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GardenTints.sage.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming events
// ─────────────────────────────────────────────────────────────────────────────
function EventRow({ h, evt }: { h: StaffHome; evt: StaffUpcomingCalendarEvent }) {
  const d = parseYMD(evt.event_date);
  return (
    <PressableScale
      pressedScale={0.98}
      accessibilityLabel={`${evt.title}, ${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, ${formatEventTime(evt)}`}
      accessibilityHint="Shows event details"
      onPress={() => {
        h.setSelectedEvent(evt);
        h.eventSheetRef.current?.present();
      }}
      style={ev.row}
    >
      <View style={[ev.date, { backgroundColor: evt.color + "22" }]}>
        <Text style={[ev.mo, { color: evt.color }]}>{d.toLocaleDateString("en-US", { month: "short" })}</Text>
        <Text style={[ev.day, { color: evt.color }]}>{d.getDate()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ev.title} numberOfLines={2}>
          {evt.title}
        </Text>
        <Text style={ev.meta}>
          {d.toLocaleDateString("en-US", { weekday: "short" })} · {formatEventTime(evt)}
        </Text>
      </View>
      {evt.category ? (
        <View style={[ev.cat, { backgroundColor: evt.color + "22" }]}>
          <Text style={[ev.catText, { color: evt.color }]} numberOfLines={1}>
            {evt.category}
          </Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={Garden.muted} />
    </PressableScale>
  );
}

export function EventsList({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <GardenSectionHeader
        title="Upcoming events"
        onAction={h.eventsLoading ? undefined : () => h.router.push("/(staff)/calendar" as any)}
      />
      <View style={{ paddingHorizontal: GUTTER, gap: 10 }}>
        {h.eventsLoading ? (
          [0, 1, 2].map((i) => <GardenSkeleton key={i} width="100%" height={66} radius={20} />)
        ) : h.eventsError ? (
          <GardenErrorCard title="Couldn't load events" onRetry={() => void fb.retry()} retrying={fb.retrying} />
        ) : h.upcomingEvents.length === 0 ? (
          <GardenEmpty emoji="📅" title="No upcoming events" tint="sky" />
        ) : (
          h.upcomingEvents.map((evt) => <EventRow key={evt.id} h={h} evt={evt} />)
        )}
      </View>
    </View>
  );
}

const ev = StyleSheet.create({
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
  meta: { fontFamily: GardenFonts.body, fontSize: 12.5, color: Garden.soft, marginTop: 1 },
  cat: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 90 },
  catText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10.5 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming birthdays
// ─────────────────────────────────────────────────────────────────────────────
const BIRTHDAY_PREVIEW = 3;

function BirthdayRow({ h, b }: { h: StaffHome; b: StaffBirthday }) {
  const relativeDay = formatBirthdayRelativeDay(b.daysUntil, b.birthdayYmd);
  const isToday = b.daysUntil === 0;
  const isTeamMember = Boolean(b.isTeamMember);
  const name = shortName(b.name);
  const meta = isTeamMember ? relativeDay : `${relativeDay} · Turning ${b.turningAge}`;

  const content: ReactNode = (
    <>
      <GardenAvatar name={b.name} uri={b.profileImageUrl} seed={b.studentId} size={42} />
      <View style={{ flex: 1 }}>
        <Text style={bd.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={bd.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {isToday ? (
        <Pill tint="butter">🎂 Today</Pill>
      ) : !isTeamMember ? (
        <Ionicons name="chevron-forward" size={16} color={Garden.muted} />
      ) : null}
    </>
  );

  if (isTeamMember) {
    return (
      <View style={[bd.row, isToday && bd.today]} accessible accessibilityLabel={`${name}, ${meta}`}>
        {content}
      </View>
    );
  }
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={() =>
        h.router.push({
          pathname: "/(staff)/students/[studentId]" as any,
          params: { studentId: b.studentId, studentName: b.name ?? "", allStudentsView: "1" },
        })
      }
      accessibilityLabel={`${name}, ${meta}. Opens profile`}
      style={[bd.row, isToday && bd.today]}
    >
      {content}
    </PressableScale>
  );
}

export function BirthdaysList({ h, fb }: { h: StaffHome; fb: StaffHomeFeedback }) {
  const total = h.allBirthdays.length;
  return (
    <View style={{ marginBottom: 12 }}>
      <GardenSectionHeader
        title="Upcoming Birthdays"
        note={!h.birthdaysLoading && h.upcomingBirthdays.length > 0 ? `Next ${UPCOMING_BIRTHDAY_DAYS} days` : undefined}
        actionLabel={`View all (${total})`}
        onAction={!h.birthdaysLoading && total > 0 ? () => h.allBirthdaysSheetRef.current?.present() : undefined}
      />
      <View style={{ paddingHorizontal: GUTTER, gap: 8 }}>
        {h.birthdaysLoading ? (
          [0, 1].map((i) => <GardenSkeleton key={i} width="100%" height={62} radius={20} />)
        ) : h.birthdaysError ? (
          <GardenErrorCard title="Couldn't load birthdays" onRetry={() => void fb.retry()} retrying={fb.retrying} />
        ) : h.upcomingBirthdays.length === 0 ? (
          <GardenEmpty
            emoji="🎂"
            title={`No birthdays in the next ${UPCOMING_BIRTHDAY_DAYS} days`}
            tint="butter"
          />
        ) : (
          h.upcomingBirthdays.slice(0, BIRTHDAY_PREVIEW).map((b) => <BirthdayRow key={b.studentId} h={h} b={b} />)
        )}
      </View>
    </View>
  );
}

const bd = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 62,
    ...gardenCard,
    borderRadius: 20,
  },
  today: { backgroundColor: GardenTints.butter.bg, borderColor: Garden.butter },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  meta: { fontFamily: GardenFonts.body, fontSize: 12.5, color: Garden.soft },
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────────
const ui = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  pillText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5 },
  allergyBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Garden.danger,
    borderWidth: 2,
    borderColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
});

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Garden.cream },
});
