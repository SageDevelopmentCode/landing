// Garden UI for the staff Students list: hero, My/All toggle, program chips,
// search, student rows (My Students) and teacher panels (All Students).
import {
  Display,
  Garden,
  GardenAvatar,
  GardenEmpty,
  GardenErrorCard,
  GardenField,
  GardenFonts,
  GardenRadii,
  GardenSegmented,
  GardenSkeleton,
  GardenTints,
  PressableScale,
  gardenCard,
  type RefreshFeedback,
} from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { StyleSheet, Text, View } from "react-native";
import {
  DAY_KEYS,
  DAY_LABELS,
  STUDENT_PROGRAMS,
  formatStudentMeta,
  isStudentEnrolledForMonth,
  needsAttention,
  type StudentList,
  type StudentRow,
} from "../useStudentList";

export const GUTTER = 18;

// ─────────────────────────────────────────────────────────────────────────────
// Hero + controls
// ─────────────────────────────────────────────────────────────────────────────
export function StudentsHero({ l }: { l: StudentList }) {
  const loading = l.activeView === "my" ? l.loading : l.allLoading;
  return (
    <View style={h.wrap}>
      <View style={h.titleRow}>
        <Display size={34}>Students</Display>
        {!loading ? (
          <Animated.View entering={FadeIn} style={h.count} accessibilityLabel={`${l.count} students`}>
            <Text style={h.countText} maxFontSizeMultiplier={1.3}>
              {l.count}
            </Text>
          </Animated.View>
        ) : null}
      </View>
      <GardenSegmented
        accessibilityLabel="Which students"
        value={l.activeView}
        onChange={l.setActiveView}
        options={[
          { value: "my", label: "My Students" },
          { value: "all", label: "All Students" },
        ]}
      />
      <View style={h.programs} accessibilityRole="tablist">
        {STUDENT_PROGRAMS.map((p) => {
          const on = l.program === p.key;
          return (
            <PressableScale
              key={p.key}
              haptics="select"
              onPress={() => l.setProgram(p.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={p.label}
              style={[h.chip, on && h.chipOn]}
            >
              <Ionicons name={p.icon} size={16} color={on ? Garden.white : Garden.soft} />
              <Text style={[h.chipText, on && { color: Garden.white }]} maxFontSizeMultiplier={1.3}>
                {p.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
      <GardenField
        icon="search"
        clearable
        value={l.search}
        onChangeText={l.setSearch}
        placeholder="Search students…"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search students by name"
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row pieces
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ row, size = 44 }: { row: StudentRow; size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <GardenAvatar name={row.name} uri={row.profile_image_url} seed={row.student_id} size={size} />
      {row.has_allergies === "yes" ? (
        <View style={r.allergy} accessibilityLabel="Has allergies">
          <Ionicons name="medical" size={9} color={Garden.white} />
        </View>
      ) : null}
    </View>
  );
}

function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  const t = ok ? GardenTints.sage : GardenTints.coral;
  return (
    <View style={[r.pill, { backgroundColor: t.bg }]}>
      <Ionicons name={ok ? "checkmark-circle" : "alert-circle"} size={12} color={t.fg} />
      <Text style={[r.pillText, { color: t.fg }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </View>
  );
}

function DayDots({ days }: { days: string[] }) {
  return (
    <View style={r.days} accessibilityLabel={`Drop-in days: ${days.length ? days.map((d) => DAY_LABELS[d]).join(", ") : "none"}`}>
      {DAY_KEYS.map((dk) => {
        const on = days.includes(dk);
        return (
          <View key={dk} style={[r.day, on && r.dayOn]}>
            <Text style={[r.dayText, on && { color: Garden.white }]} maxFontSizeMultiplier={1.2}>
              {DAY_LABELS[dk]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function StudentRowView({
  l,
  row,
  last,
  fromAll,
}: {
  l: StudentList;
  row: StudentRow;
  last: boolean;
  fromAll: boolean;
}) {
  const enrolled = isStudentEnrolledForMonth(row);
  const meta = formatStudentMeta(row.grade, row.classroom);
  const name = row.name ?? "Unknown Student";
  const a11y = [
    name,
    meta,
    row.isPaidForMonth ? "Paid" : "Unpaid",
    `${l.monthShort} ${enrolled ? "Enrolled" : "Not Enrolled"}`,
    row.has_allergies === "yes" ? "has allergies" : null,
  ]
    .filter(Boolean)
    .join(", ");
  // My Students shows both statuses; All Students only flags what needs attention.
  const showDays = row.isHomeschoolDropIn && (!fromAll || row.homeschoolDays.length > 0);
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={() => l.openStudent(row, fromAll)}
      accessibilityLabel={a11y}
      accessibilityHint="Opens the student profile"
      style={[r.row, !last && r.divider]}
    >
      <Avatar row={row} />
      <View style={r.info}>
        <View style={r.nameRow}>
          <Text style={r.name} numberOfLines={1} maxFontSizeMultiplier={1.35}>
            {name}
          </Text>
          {row.isHomeschoolDropIn ? (
            <Ionicons name="home" size={13} color={Garden.sageDeep} accessibilityLabel="Homeschool drop-in" />
          ) : null}
        </View>
        {meta ? (
          <Text style={r.meta} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {meta}
          </Text>
        ) : null}
        <View style={r.pills}>
          {fromAll ? (
            needsAttention(row) ? (
              <>
                {!row.isPaidForMonth ? <StatusChip ok={false} label="Unpaid" /> : null}
                {!enrolled ? <StatusChip ok={false} label={`${l.monthShort} Not Enrolled`} /> : null}
              </>
            ) : (
              <Text style={r.okHint} maxFontSizeMultiplier={1.3}>
                ✓ {l.monthShort} enrolled
              </Text>
            )
          ) : (
            <>
              <StatusChip ok={row.isPaidForMonth} label={row.isPaidForMonth ? "Paid" : "Unpaid"} />
              <StatusChip
                ok={enrolled}
                label={`${l.monthShort} ${enrolled ? "Enrolled" : "Not Enrolled"}`}
              />
            </>
          )}
        </View>
        {showDays ? <DayDots days={row.homeschoolDays} /> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Garden.muted} />
    </PressableScale>
  );
}

function ListSkeleton({ grouped }: { grouped?: boolean }) {
  return (
    <View style={r.panel}>
      {grouped ? (
        <View style={r.panelHeader}>
          <GardenSkeleton width={10} height={10} radius={5} />
          <GardenSkeleton width="40%" height={14} radius={6} />
        </View>
      ) : null}
      {Array.from({ length: grouped ? 3 : 5 }).map((_, i) => (
        <View key={i} style={[r.row, i < 4 && r.divider]}>
          <GardenSkeleton width={44} height={44} radius={22} />
          <View style={{ flex: 1, gap: 8 }}>
            <GardenSkeleton width="55%" height={14} radius={6} />
            <GardenSkeleton width="70%" height={18} radius={9} />
          </View>
        </View>
      ))}
    </View>
  );
}

function SearchEmpty({ l }: { l: StudentList }) {
  return (
    <GardenEmpty
      emoji="🔍"
      title={`No students match "${l.search.trim()}"`}
      actionLabel="Clear search"
      onAction={() => l.setSearch("")}
      tint="sky"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bodies
// ─────────────────────────────────────────────────────────────────────────────
export function StudentsBody({ l, fb }: { l: StudentList; fb: RefreshFeedback }) {
  if (l.activeView === "my") {
    if (l.loading) return <ListSkeleton />;
    if (l.error) {
      return (
        <GardenErrorCard
          title="Couldn't load your students"
          body={l.error}
          onRetry={() => void fb.retry()}
          retrying={fb.retrying}
        />
      );
    }
    if (l.myStudents.length === 0) {
      return l.isSearching ? (
        <SearchEmpty l={l} />
      ) : (
        <GardenEmpty emoji="🎒" title="No Students" body="No students in this program." tint="mint" />
      );
    }
    return (
      <Animated.View layout={LinearTransition} style={r.panel}>
        {l.myStudents.map((row, i) => (
          <StudentRowView key={row.id} l={l} row={row} last={i === l.myStudents.length - 1} fromAll={false} />
        ))}
      </Animated.View>
    );
  }

  if (l.allLoading) {
    return (
      <View style={{ gap: 14 }}>
        <ListSkeleton grouped />
        <ListSkeleton grouped />
      </View>
    );
  }
  if (l.allError) {
    return (
      <GardenErrorCard
        title="Couldn't load all students"
        body={l.allError}
        onRetry={() => void fb.retry()}
        retrying={fb.retrying}
      />
    );
  }
  if (l.teacherSections.length === 0) {
    return l.isSearching ? (
      <SearchEmpty l={l} />
    ) : (
      <GardenEmpty emoji="🎒" title="No Students" body="No students in this program." tint="mint" />
    );
  }
  return (
    <View style={{ gap: 14 }}>
      {l.teacherSections.map((sec) => (
        <Animated.View key={sec.teacherName} layout={LinearTransition} style={r.panel}>
          <View style={[r.panelHeader, { backgroundColor: sec.colors.bg }]}>
            <View style={[r.dot, { backgroundColor: sec.colors.accent }]} />
            <Text style={r.panelTitle} numberOfLines={1} accessibilityRole="header">
              {sec.teacherName}
            </Text>
            <Text style={[r.panelCount, { color: sec.colors.accent }]}>
              {sec.students.length} {sec.students.length === 1 ? "student" : "students"}
            </Text>
          </View>
          {sec.students.map((row, i) => (
            <StudentRowView key={row.id} l={l} row={row} last={i === sec.students.length - 1} fromAll />
          ))}
        </Animated.View>
      ))}
    </View>
  );
}

const h = StyleSheet.create({
  wrap: { paddingHorizontal: GUTTER, paddingTop: 10, paddingBottom: 16, gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  count: {
    minWidth: 34,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: GardenTints.sage.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: GardenTints.sage.fg },
  programs: { flexDirection: "row", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  chipOn: { backgroundColor: Garden.ink, borderColor: Garden.ink },
  chipText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.soft },
});

const r = StyleSheet.create({
  panel: { ...gardenCard, borderRadius: 22, overflow: "hidden" },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  panelTitle: { flex: 1, fontFamily: GardenFonts.display, fontSize: 16, color: Garden.ink },
  panelCount: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5 },
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
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink, flexShrink: 1 },
  meta: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.soft },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 5, alignItems: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: GardenRadii.pill,
  },
  pillText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5 },
  okHint: { fontFamily: GardenFonts.bodyBold, fontSize: 12, color: Garden.sageDeep },
  days: { flexDirection: "row", gap: 4, marginTop: 2 },
  day: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3eadc",
  },
  dayOn: { backgroundColor: Garden.sage },
  dayText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10.5, color: Garden.muted },
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
});

