// Staff Payroll + Pay History — Garden UI pieces. Data in usePayroll /
// usePayrollHistory; feedback in usePayrollFeedback. See staff.md.
import {
  Garden,
  GardenButton,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenHintBox,
  GardenRadii,
  GardenScreenHero,
  GardenSectionHeader,
  GardenSkeleton,
  GardenSpace,
  GardenTints,
  Pill,
  PressableScale,
  gardenCard,
  gardenShadowSm,
} from "@/components/garden";
import { fmt12, formatDurationMs, sessionDaysSpanned, sessionDurationMsClamped } from "@/lib/clock-utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import {
  NO_RATE_MSG,
  STATUS_META,
  fmtDate,
  fmtDayKey,
  fmtHours,
  fmtMoney,
  fmtPeriod,
  type Paystub,
  type RawSession,
} from "../payrollUtils";
import type { Payroll } from "../usePayroll";
import type { PayrollHistory } from "../usePayrollHistory";
import type { PayrollFeedback, PayrollHistoryFeedback } from "./usePayrollFeedback";

const G = GardenSpace.gutter;

// ─── Hero ────────────────────────────────────────────────────────────────────
export function PayrollHero() {
  const router = useRouter();
  return (
    <GardenScreenHero
      title="Payroll"
      fallbackHref="/(staff)/home"
      right={
        <Pressable
          onPress={() => router.push("/(staff)/payroll-history")}
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel="View History: past paystubs"
          style={({ pressed }) => [ui.link, pressed && { opacity: 0.6 }]}
        >
          <Text style={ui.linkText} maxFontSizeMultiplier={1.3}>
            View History
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Garden.sageDeep} />
        </Pressable>
      }
    />
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function PayrollSkeleton() {
  return (
    <View style={{ paddingHorizontal: G, gap: 14, marginTop: 6 }}>
      <GardenSkeleton width="100%" height={92} radius={22} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <GardenSkeleton width="31%" height={78} radius={20} />
        <GardenSkeleton width="31%" height={78} radius={20} />
        <GardenSkeleton width="31%" height={78} radius={20} />
      </View>
      <GardenSkeleton width="100%" height={55} radius={28} />
      <GardenSkeleton width={120} height={24} style={{ marginTop: 14 }} />
      <GardenSkeleton width="100%" height={220} radius={GardenRadii.card} />
    </View>
  );
}

// ─── Rate missing ────────────────────────────────────────────────────────────
export function RateMissingCard() {
  return (
    <View style={[ui.alert, { marginHorizontal: G }]} accessibilityRole="alert">
      <View style={ui.alertIcon}>
        <Ionicons name="warning-outline" size={18} color={GardenTints.butter.fg} />
      </View>
      <Text style={ui.alertText} maxFontSizeMultiplier={1.4}>
        {NO_RATE_MSG}
      </Text>
    </View>
  );
}

// ─── Period ticket (opens the picker) ────────────────────────────────────────
export function PeriodTicket({ p, fb }: { p: Payroll; fb: PayrollFeedback }) {
  const period = p.selectedPeriod;
  const stub = p.submittedPaystub;
  const start = new Date(`${period.start}T00:00:00`);
  const ready = !stub && !p.inProgress && p.submitBlock === null;
  const stubColor = stub ? "#b9b2a6" : p.inProgress ? Garden.sage : ready ? Garden.coralDeep : "#c9b99f";
  const status = stub
    ? `Submitted · ${STATUS_META[stub.status].label}`
    : p.inProgress
      ? `In progress · submit after ${fmtDayKey(period.end)}`
      : p.submitBlock === null
        ? "Ready to submit"
        : "Not submitted";
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={fb.openPicker}
      accessibilityLabel={`Pay Period ${period.label}, ${status}. Tap to change the pay period`}
      style={[tk.ticket, { marginHorizontal: G }]}
    >
      <View style={[tk.stub, { backgroundColor: stubColor }]}>
        <Text style={tk.stubSmall}>{start.toLocaleDateString("en-US", { month: "short" })}</Text>
        <Text style={tk.stubDay}>{start.getDate()}</Text>
        <Text style={tk.stubSmall}>2 wks</Text>
      </View>
      <View style={tk.perf} />
      <View style={{ flex: 1, paddingVertical: 12, paddingRight: 12, gap: 4 }}>
        <Text style={tk.label} maxFontSizeMultiplier={1.3}>
          Pay Period
        </Text>
        <Text style={tk.title} numberOfLines={2} maxFontSizeMultiplier={1.35}>
          {period.label}
        </Text>
        <Pill
          tint={stub ? STATUS_META[stub.status].tint : p.inProgress ? "sage" : ready ? "coral" : "peach"}
          style={{ marginTop: 2 }}
        >
          {status}
        </Pill>
      </View>
      <View style={tk.chev}>
        <Ionicons name="chevron-down" size={18} color={Garden.muted} />
      </View>
    </PressableScale>
  );
}

// ─── Stat tiles ──────────────────────────────────────────────────────────────
export function StatTiles({
  hours,
  rate,
  gross,
  style,
}: {
  hours: number;
  rate: number | null;
  gross: number | null;
  style?: object;
}) {
  return (
    <View style={[{ flexDirection: "row", gap: 10 }, style]}>
      <StatTile label="Hours Worked" value={fmtHours(hours)} tint="butter" icon="time-outline" />
      <StatTile
        label="Hourly Rate"
        value={rate != null ? fmtMoney(rate) : "—"}
        tint="sky"
        icon="pricetag-outline"
      />
      <StatTile
        label="Gross Pay"
        value={gross != null ? fmtMoney(gross) : "—"}
        tint="mint"
        icon="cash-outline"
        strong
      />
    </View>
  );
}

function StatTile({
  label,
  value,
  tint,
  icon,
  strong,
}: {
  label: string;
  value: string;
  tint: "butter" | "sky" | "mint";
  icon: React.ComponentProps<typeof Ionicons>["name"];
  strong?: boolean;
}) {
  const t = GardenTints[tint];
  return (
    <View style={[st.tile, { backgroundColor: t.bg }]} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={15} color={t.fg} />
      <Text
        style={[st.value, strong && { color: Garden.sageDeep }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        maxFontSizeMultiplier={1.3}
      >
        {value}
      </Text>
      <Text style={[st.label, { color: t.fg }]} numberOfLines={2} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </View>
  );
}

// ─── Submit area ─────────────────────────────────────────────────────────────
export function SubmitArea({ p, fb }: { p: Payroll; fb: PayrollFeedback }) {
  const reduce = useReducedMotion();
  const block = p.submitBlock;
  const enter = reduce ? undefined : FadeIn.duration(200);
  if (block === "error") return null;
  if (block === "submitted" && p.submittedPaystub) {
    return (
      <Animated.View entering={enter} style={{ marginHorizontal: G }}>
        <SubmittedCard stub={p.submittedPaystub} onPress={fb.openDetail} />
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={enter} style={{ marginHorizontal: G }}>
      {block === "in_progress" ? (
        <GardenHintBox icon="hourglass-outline" tone="sage" style={{ marginTop: 0 }}>
          {`This pay period is still in progress. Submit after ${fmtDayKey(p.selectedPeriod.end)}, once every shift is in.`}
        </GardenHintBox>
      ) : block === "no_rate" ? (
        <GardenHintBox icon="lock-closed-outline" tone="coral" style={{ marginTop: 0 }}>
          Submitting unlocks once an admin sets your hourly rate.
        </GardenHintBox>
      ) : block === "no_hours" ? (
        <GardenHintBox icon="information-circle-outline" style={{ marginTop: 0 }}>
          No completed sessions for this period, so there's nothing to submit.
        </GardenHintBox>
      ) : (
        <GardenButton
          label="Submit Paystub"
          icon="paper-plane-outline"
          tone="coral"
          fullWidth
          onPress={fb.openConfirm}
          accessibilityHint="Shows a summary to confirm before submitting"
        />
      )}
    </Animated.View>
  );
}

function SubmittedCard({ stub, onPress }: { stub: Paystub; onPress: () => void }) {
  const meta = STATUS_META[stub.status];
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={onPress}
      accessibilityLabel={`Already submitted for this period. Status ${meta.label}. Tap to view the paystub`}
      style={[gardenCard, { padding: 16, gap: 14 }]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="receipt-outline" size={18} color={Garden.sageDeep} />
        <Text style={ui.rowTitle} maxFontSizeMultiplier={1.4}>
          Already submitted for this period.
        </Text>
        <Ionicons name="chevron-forward" size={16} color={Garden.muted} />
      </View>
      <StatusTimeline stub={stub} />
    </PressableScale>
  );
}

// ─── Status timeline: Submitted → Approved → Paid ────────────────────────────
export function StatusTimeline({ stub }: { stub: Paystub }) {
  const steps = [
    { label: "Submitted", at: stub.submitted_at, done: true },
    { label: "Approved", at: stub.approved_at, done: stub.status === "approved" || stub.status === "paid" },
    { label: "Paid", at: stub.paid_at, done: stub.status === "paid" },
  ];
  const summary = steps.map((s) => `${s.label} ${s.done ? fmtDate(s.at) : "not yet"}`).join(", ");
  return (
    <View style={tl.row} accessible accessibilityLabel={`Status: ${summary}`}>
      {steps.map((s, i) => (
        <View key={s.label} style={tl.step}>
          <View style={tl.track}>
            <View style={[tl.line, i === 0 && { opacity: 0 }, s.done && tl.lineDone]} />
            <View style={[tl.dot, s.done && tl.dotDone]}>
              {s.done ? <Ionicons name="checkmark" size={13} color={Garden.white} /> : null}
            </View>
            <View
              style={[tl.line, i === steps.length - 1 && { opacity: 0 }, steps[i + 1]?.done && tl.lineDone]}
            />
          </View>
          <Text style={[tl.label, !s.done && { color: Garden.muted }]} maxFontSizeMultiplier={1.3}>
            {s.label}
          </Text>
          <Text style={tl.date} maxFontSizeMultiplier={1.3}>
            {s.done ? fmtDate(s.at) : "—"}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function AdminNote({ note }: { note: string }) {
  return (
    <View style={ui.note}>
      <Text style={ui.noteLabel} maxFontSizeMultiplier={1.3}>
        Admin Note
      </Text>
      <Text style={ui.noteText} maxFontSizeMultiplier={1.4}>
        {note}
      </Text>
    </View>
  );
}

// ─── Sessions ────────────────────────────────────────────────────────────────
export function SessionList({ p }: { p: Payroll }) {
  const sessions = p.periodSessions;
  return (
    <View style={{ marginTop: GardenSpace.sectionGap - 4 }}>
      <GardenSectionHeader title="Sessions" style={{ paddingHorizontal: G, marginBottom: 10 }} />
      {sessions.length === 0 ? (
        <GardenEmpty
          emoji="🕰️"
          title="No completed sessions for this period."
          tint="butter"
          style={{ marginHorizontal: G }}
        />
      ) : (
        <View style={[gardenCard, { marginHorizontal: G, paddingVertical: 4 }]}>
          {sessions.map((s, i) => (
            <SessionRow key={s.id} s={s} last={i === sessions.length - 1} />
          ))}
        </View>
      )}
    </View>
  );
}

function SessionRow({ s, last }: { s: RawSession; last: boolean }) {
  const d = new Date(s.clock_in_at);
  const days = sessionDaysSpanned(s.clock_in_at, s.clock_out_at);
  const dur = formatDurationMs(sessionDurationMsClamped(s.clock_in_at, s.clock_out_at));
  const wk = d.toLocaleDateString("en-US", { weekday: "short" });
  const md = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const plus = days > 0 ? `+${days} day${days > 1 ? "s" : ""}` : null;
  return (
    <View
      style={[se.row, !last && se.divider]}
      accessible
      accessibilityLabel={`${wk} ${md}, ${fmt12(s.clock_in_at)} to ${fmt12(s.clock_out_at)}${plus ? ` the next day` : ""}, ${dur}`}
    >
      <View style={se.date}>
        <Text style={se.wk} maxFontSizeMultiplier={1.2}>
          {wk}
        </Text>
        <Text style={se.md} maxFontSizeMultiplier={1.2}>
          {md}
        </Text>
      </View>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <Text style={se.times} maxFontSizeMultiplier={1.35}>
          {fmt12(s.clock_in_at)} – {fmt12(s.clock_out_at)}
        </Text>
        {plus ? <Pill tint="lav">{plus}</Pill> : null}
      </View>
      <Text style={se.dur} maxFontSizeMultiplier={1.3}>
        {dur}
      </Text>
    </View>
  );
}

// ─── Payroll body (everything under the hero) ────────────────────────────────
export function PayrollBody({ p, fb }: { p: Payroll; fb: PayrollFeedback }) {
  if (!p.loaded && p.loading) return <PayrollSkeleton />;
  if (p.loadError) {
    return (
      <View style={{ paddingHorizontal: G, marginTop: 6 }}>
        <GardenErrorCard title="We couldn't load your payroll" onRetry={() => void fb.retry()} retrying={fb.retrying} />
      </View>
    );
  }
  return (
    <View style={{ gap: 14, marginTop: 6 }}>
      {p.hourlyRate == null ? <RateMissingCard /> : null}
      <PeriodTicket p={p} fb={fb} />
      <StatTiles hours={p.totalHours} rate={p.hourlyRate} gross={p.grossPay} style={{ marginHorizontal: G }} />
      <SubmitArea p={p} fb={fb} />
      <SessionList p={p} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pay History
// ─────────────────────────────────────────────────────────────────────────────
export function HistoryHero() {
  const router = useRouter();
  // The staff area is a tabs navigator (backBehavior "firstRoute"), so
  // router.back() would land on Home. History is only reached from Payroll.
  return (
    <GardenScreenHero
      title="Pay History"
      fallbackHref="/(staff)/payroll"
      backLabel="Back to Payroll"
      onBack={() => router.navigate("/(staff)/payroll")}
    />
  );
}

export function HistoryBody({ h, fb }: { h: PayrollHistory; fb: PayrollHistoryFeedback }) {
  if (h.loading && h.paystubs.length === 0 && !h.loadError) {
    return (
      <View style={{ paddingHorizontal: G, gap: 12, marginTop: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <GardenSkeleton key={i} width="100%" height={78} radius={22} />
        ))}
      </View>
    );
  }
  if (h.loadError) {
    return (
      <View style={{ paddingHorizontal: G, marginTop: 6 }}>
        <GardenErrorCard
          title="We couldn't load your pay history"
          onRetry={() => void fb.retry()}
          retrying={fb.retrying}
        />
      </View>
    );
  }
  if (h.paystubs.length === 0) {
    return (
      <GardenEmpty emoji="🧾" title="No paystubs submitted yet." tint="mint" style={{ marginHorizontal: G, marginTop: 6 }} />
    );
  }
  return (
    <View style={{ paddingHorizontal: G, gap: 12, marginTop: 6 }}>
      {h.paystubs.map((item) => (
        <HistoryCard key={item.id} item={item} expanded={h.expandedId === item.id} onToggle={() => fb.toggle(item.id)} />
      ))}
    </View>
  );
}

function HistoryCard({ item, expanded, onToggle }: { item: Paystub; expanded: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion();
  const meta = STATUS_META[item.status];
  const period = fmtPeriod(item.period_start, item.period_end);
  return (
    <View style={gardenCard}>
      <PressableScale
        pressedScale={0.98}
        haptics={false}
        onPress={onToggle}
        accessibilityLabel={`${period}, ${fmtMoney(item.gross_pay)}, ${meta.label}`}
        accessibilityHint={expanded ? "Collapses the details" : "Shows the details"}
        accessibilityState={{ expanded }}
        style={hc.head}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={hc.period} maxFontSizeMultiplier={1.35}>
            {period}
          </Text>
          <Text style={hc.gross} maxFontSizeMultiplier={1.3}>
            {fmtMoney(item.gross_pay)}
          </Text>
        </View>
        <Pill tint={meta.tint}>{meta.label}</Pill>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={Garden.muted} />
      </PressableScale>
      {expanded ? (
        <Animated.View entering={reduce ? undefined : FadeIn.duration(180)} style={hc.body}>
          <StatTiles hours={item.total_hours} rate={item.hourly_rate_snapshot} gross={item.gross_pay} />
          <StatusTimeline stub={item} />
          {item.admin_note ? <AdminNote note={item.admin_note} /> : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const ui = StyleSheet.create({
  link: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 44 },
  linkText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.sageDeep },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: GardenTints.butter.bg,
    borderBottomWidth: 4,
    borderBottomColor: Garden.butterDeep,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.ink, lineHeight: 19 },
  rowTitle: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 14.5, color: Garden.ink },
  note: {
    backgroundColor: "#fbf4ea",
    borderRadius: GardenRadii.sm,
    borderWidth: 1,
    borderColor: Garden.line,
    padding: 12,
    gap: 4,
  },
  noteLabel: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.muted },
  noteText: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.ink, lineHeight: 20 },
});

const tk = StyleSheet.create({
  ticket: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: Garden.white,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Garden.line,
    ...gardenShadowSm,
  },
  stub: { width: 72, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  stubSmall: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11,
    color: "rgba(255,255,255,0.92)",
    textTransform: "uppercase",
  },
  stubDay: { fontFamily: GardenFonts.display, fontSize: 30, color: Garden.white, lineHeight: 34 },
  perf: {
    width: 0,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: Garden.line,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  label: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.muted },
  title: { fontFamily: GardenFonts.display, fontSize: 18, color: Garden.ink, lineHeight: 21 },
  chev: { justifyContent: "center", paddingRight: 14 },
});

const st = StyleSheet.create({
  tile: { flex: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 12, gap: 4, minHeight: 78 },
  value: { fontFamily: GardenFonts.display, fontSize: 20, color: Garden.ink },
  label: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11.5 },
});

const tl = StyleSheet.create({
  row: { flexDirection: "row" },
  step: { flex: 1, alignItems: "center", gap: 4 },
  track: { flexDirection: "row", alignItems: "center", alignSelf: "stretch" },
  line: { flex: 1, height: 3, backgroundColor: Garden.line, borderRadius: 2 },
  lineDone: { backgroundColor: Garden.sage },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d9cdb9",
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: Garden.sage, borderColor: Garden.sage },
  label: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: Garden.ink },
  date: { fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.muted },
});

const se = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, minHeight: 58, paddingVertical: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: Garden.line },
  date: { width: 50 },
  wk: { fontFamily: GardenFonts.bodyHeavy, fontSize: 11, color: Garden.muted, textTransform: "uppercase" },
  md: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.ink },
  times: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.soft },
  dur: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.ink },
});

const hc = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, minHeight: 72 },
  period: { fontFamily: GardenFonts.display, fontSize: 17, color: Garden.ink },
  gross: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.sageDeep },
  body: { paddingHorizontal: 16, paddingBottom: 16, gap: 14 },
});

