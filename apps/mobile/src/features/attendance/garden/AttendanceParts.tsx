// Garden attendance history: summary strip, program filter chips, month-grouped
// day rows and states. Used by the Attendance screen and Children → Attendance.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  GardenTints,
  PressableScale,
  gardenShadowSm,
} from "@/components/garden";
import {
  ATT_FILTER_TABS,
  getAttendanceStatus,
  PROGRAM_CONFIG,
  type AttendanceStatus,
  type UnifiedAttendanceRecord,
} from "@/lib/parent-student-attendance";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import type { StudentAttendance } from "../useStudentAttendance";
import { formatYMD, PROGRAM_TINT, STATUS_META, StatusPill } from "./AttendanceBits";
import { AttendanceDetailSheet } from "./AttendanceDetailSheet";

function dateParts(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    mon: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(d),
  };
}

// ─── Summary strip ───────────────────────────────────────────────────────────
function SummaryStrip({ att }: { att: StudentAttendance }) {
  const items: { key: AttendanceStatus; count: number }[] = [
    { key: "attended", count: att.summary.attended },
    { key: "picked_up", count: att.summary.pickedUp },
    { key: "absent", count: att.summary.absent },
  ];
  return (
    <View style={s.summaryRow}>
      {items.map(({ key, count }) => {
        const meta = STATUS_META[key];
        const t = GardenTints[meta.tint];
        return (
          <View
            key={key}
            style={[s.summaryTile, { backgroundColor: t.bg }]}
            accessible
            accessibilityLabel={`${count} ${meta.label}`}
          >
            <Text style={[s.summaryCount, { color: t.fg }]} maxFontSizeMultiplier={1.3}>
              {count}
            </Text>
            <Text style={[s.summaryLabel, { color: t.fg }]} maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {meta.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Filter chips ────────────────────────────────────────────────────────────
function FilterChips({ att }: { att: StudentAttendance }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={s.chipRow}
      style={{ marginHorizontal: -18 }}
    >
      {ATT_FILTER_TABS.map(({ key, label }) => {
        const on = att.filter === key;
        const count = att.filterCounts[key];
        return (
          <PressableScale
            key={key}
            haptics="select"
            onPress={() => att.setFilter(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${label}, ${count} ${count === 1 ? "day" : "days"}`}
            style={[s.chip, on && s.chipOn]}
          >
            <Text style={[s.chipText, on && { color: Garden.white }]} maxFontSizeMultiplier={1.3}>
              {label}
            </Text>
            <View style={[s.chipCount, on && { backgroundColor: "rgba(255,255,255,0.22)" }]}>
              <Text style={[s.chipCountText, on && { color: Garden.white }]} maxFontSizeMultiplier={1.2}>
                {count}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

// ─── Day row ─────────────────────────────────────────────────────────────────
function DayRow({
  record,
  att,
  index,
}: {
  record: UnifiedAttendanceRecord;
  att: StudentAttendance;
  index: number;
}) {
  const reduce = useReducedMotion();
  const cfg = PROGRAM_CONFIG[record.program];
  const tint = GardenTints[PROGRAM_TINT[record.program]];
  const status = getAttendanceStatus(record);
  const p = dateParts(record.date);
  const pickup =
    status === "picked_up" && record.picked_up_by_name
      ? `${record.picked_up_by_name}${record.picked_up_by_relationship ? ` · ${record.picked_up_by_relationship}` : ""}`
      : null;
  return (
    <Animated.View entering={reduce || index > 8 ? undefined : FadeInDown.delay(index * 40).springify()}>
      <PressableScale
        pressedScale={0.98}
        onPress={() => att.openRecord(record)}
        accessibilityLabel={`${formatYMD(record.date)}, ${cfg.label}, ${STATUS_META[status].label}${pickup ? `, by ${pickup}` : ""}. View details`}
        style={s.row}
      >
        <View style={[s.dateChip, { backgroundColor: tint.bg }]}>
          <Text style={[s.dateMon, { color: tint.fg }]} maxFontSizeMultiplier={1.2}>
            {p.mon}
          </Text>
          <Text style={[s.dateDay, { color: tint.fg }]} maxFontSizeMultiplier={1.2}>
            {p.day}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.rowTitle} maxFontSizeMultiplier={1.35}>
            {p.weekday}
          </Text>
          <View style={s.programRow}>
            <Ionicons name={cfg.icon as never} size={13} color={tint.fg} />
            <Text style={[s.programText, { color: tint.fg }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {cfg.label}
            </Text>
          </View>
          {pickup ? (
            <View style={s.programRow}>
              <GardenAvatar name={record.picked_up_by_name} size={20} style={{ borderWidth: 1 }} />
              <Text style={s.pickupText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {pickup}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <StatusPill status={status} />
          <Ionicons name="chevron-forward" size={16} color={Garden.muted} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function AttendanceSkeleton() {
  return (
    <View style={{ gap: 10 }}>
      <View style={s.summaryRow}>
        {[0, 1, 2].map((i) => (
          <GardenSkeleton key={i} width="31%" height={64} radius={18} />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
        {[64, 96, 76].map((w, i) => (
          <GardenSkeleton key={i} width={w} height={36} radius={18} />
        ))}
      </View>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[s.row, { shadowOpacity: 0, elevation: 0 }]}>
          <GardenSkeleton width={50} height={54} radius={14} />
          <View style={{ flex: 1, gap: 6 }}>
            <GardenSkeleton width="50%" height={14} radius={6} />
            <GardenSkeleton width="35%" height={11} radius={6} />
          </View>
          <GardenSkeleton width={76} height={24} radius={12} />
        </View>
      ))}
    </View>
  );
}

// ─── Section (summary + filters + list + detail sheet) ───────────────────────
export function AttendanceHistory({ att }: { att: StudentAttendance }) {
  const [retrying, setRetrying] = useState(false);

  let body: React.ReactNode;
  if (att.loading) {
    body = <AttendanceSkeleton />;
  } else if (att.error && att.records.length === 0) {
    body = (
      <GardenErrorCard
        title="Couldn't load attendance"
        retrying={retrying}
        onRetry={async () => {
          setRetrying(true);
          await att.retry();
          setRetrying(false);
        }}
      />
    );
  } else if (att.records.length === 0) {
    body = <GardenEmpty emoji="🗓️" title="No attendance records yet" />;
  } else {
    let i = 0;
    body = (
      <View style={{ gap: 12 }}>
        <SummaryStrip att={att} />
        <FilterChips att={att} />
        {att.filtered.length === 0 ? (
          <GardenEmpty emoji="🗓️" title="No attendance records yet" tint="sky" />
        ) : (
          att.months.map((m) => (
            <View key={m.key} style={{ gap: 8 }}>
              <Display size={17} style={{ marginTop: 6 }}>
                {m.title}
              </Display>
              {m.records.map((r) => (
                <DayRow key={`${r.program}-${r.id}`} record={r} att={att} index={i++} />
              ))}
            </View>
          ))
        )}
      </View>
    );
  }

  return (
    <>
      {body}
      <AttendanceDetailSheet att={att} />
    </>
  );
}

const s = StyleSheet.create({
  summaryRow: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  summaryTile: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "flex-start",
  },
  summaryCount: { fontFamily: GardenFonts.display, fontSize: 24, lineHeight: 28 },
  summaryLabel: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12 },

  chipRow: { gap: 8, paddingHorizontal: 18, paddingVertical: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  chipOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  chipText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.soft },
  chipCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3eadc",
  },
  chipCountText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5, color: Garden.soft },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
    padding: 12,
    borderRadius: GardenRadii.md,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
    ...gardenShadowSm,
  },
  dateChip: {
    width: 50,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: "center",
  },
  dateMon: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10.5, letterSpacing: 0.6 },
  dateDay: { fontFamily: GardenFonts.display, fontSize: 22, lineHeight: 25 },
  rowTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  programRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  programText: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5, flexShrink: 1 },
  pickupText: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.soft, flexShrink: 1 },
});
