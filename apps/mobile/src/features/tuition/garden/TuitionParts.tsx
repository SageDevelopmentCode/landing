// Garden UI for the parent Tuition screen: hero, child switcher, payment
// history, and the loading / empty / error states. Data comes from
// useParentTuition; feedback from useTuitionFeedback.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSectionHeader,
  GardenSkeleton,
  gardenShadowSm,
  Pill,
  PressableScale,
} from "@/components/garden";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import {
  firstNames,
  formatCents,
  formatDate,
  formatPaymentType,
  studentsForTx,
  type StripeTransaction,
  type StudentInfo,
} from "../tuitionUtils";
import type { ParentTuition } from "../useParentTuition";
import type { TuitionFeedback } from "./useTuitionFeedback";

const GUTTER = 18;

// ─── Small shared bits (also used by ReceiptSheet) ───────────────────────────

export function AvatarStack({ students, size = 40 }: { students: StudentInfo[]; size?: number }) {
  if (students.length <= 1) {
    const s = students[0] ?? null;
    return <GardenAvatar name={s?.name ?? "—"} uri={s?.profileImageUrl} seed={s?.id} size={size} />;
  }
  const visible = students.slice(0, 3);
  const offsetStep = size * 0.6;
  const totalWidth = size + (visible.length - 1) * offsetStep;
  return (
    <View style={{ width: totalWidth, height: size }}>
      {visible.map((s, i) => (
        <View key={s.id} style={{ position: "absolute", left: i * offsetStep, top: 0 }}>
          <GardenAvatar name={s.name} uri={s.profileImageUrl} seed={s.id} size={size} />
        </View>
      ))}
    </View>
  );
}

/** Status always carries its text ("Paid"), never colour alone. */
export function TxStatusPill({ status, center }: { status: string; center?: boolean }) {
  const isCompleted = status === "completed";
  return (
    <Pill tint={isCompleted ? "sage" : "butter"} style={center ? { alignSelf: "center" } : undefined}>
      {isCompleted ? "Paid" : status}
    </Pill>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

export function TuitionHero({ onHelp }: { onHelp: () => void }) {
  return (
    <View style={s.hero}>
      <View style={{ flex: 1 }}>
        <Display size={32} numberOfLines={2}>
          Tuition & Billing
        </Display>
      </View>
      <GardenIconButton icon="help-circle-outline" label="Help" onPress={onHelp} iconSize={22} />
    </View>
  );
}

// ─── Child switcher (2+ enrolled kids) ───────────────────────────────────────

export function ChildSwitcher({ c, fb }: { c: ParentTuition; fb: TuitionFeedback }) {
  if (c.enrolledStudents.length < 2) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={s.chips}
    >
      {c.enrolledStudents.map((st) => {
        const on = st.id === c.activeChildId;
        const first = st.name.split(" ")[0] || st.name;
        return (
          <PressableScale
            key={st.id}
            haptics={false}
            onPress={() => fb.selectChild(st.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${first}'s billing`}
            style={[s.chip, on && s.chipOn]}
          >
            <GardenAvatar name={st.name} uri={st.profileImageUrl} seed={st.id} size={30} />
            <Text
              style={[s.chipText, on && { color: Garden.white }]}
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
            >
              {first}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

// ─── Loading / error ─────────────────────────────────────────────────────────

export function TuitionSkeleton() {
  return (
    <View style={{ paddingHorizontal: GUTTER, gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <GardenSkeleton width={110} height={44} radius={22} />
        <GardenSkeleton width={110} height={44} radius={22} />
      </View>
      <GardenSkeleton width="100%" height={190} radius={GardenRadii.card} />
      <GardenSkeleton width="60%" height={24} radius={8} style={{ marginTop: 10 }} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.row, { borderColor: "transparent" }]}>
          <GardenSkeleton width={40} height={40} radius={20} />
          <View style={{ flex: 1, gap: 6 }}>
            <GardenSkeleton width="70%" height={14} radius={6} />
            <GardenSkeleton width="45%" height={11} radius={6} />
          </View>
          <GardenSkeleton width={56} height={14} radius={6} />
        </View>
      ))}
    </View>
  );
}

export function TuitionLoadError({ c, fb }: { c: ParentTuition; fb: TuitionFeedback }) {
  return (
    <View style={{ paddingHorizontal: GUTTER }}>
      <GardenErrorCard
        title={c.error ?? undefined}
        retrying={fb.retrying}
        onRetry={() => void fb.retryLoad()}
      />
    </View>
  );
}

// ─── Payment history ─────────────────────────────────────────────────────────

function TxRow({
  tx,
  student,
  studentMap,
  onPress,
}: {
  tx: StripeTransaction;
  student: StudentInfo | null;
  studentMap: Record<string, StudentInfo>;
  onPress: () => void;
}) {
  const { all } = studentsForTx(tx, student, studentMap);
  const names = firstNames(all);
  const title = tx.description ?? formatPaymentType(tx.payment_type);
  const amount = formatCents(tx.amount_cents);
  const statusText = tx.status === "completed" ? "Paid" : tx.status;
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.98}
      accessibilityLabel={`${title}, ${names}, ${formatDate(tx.created_at)}, ${amount}, ${statusText}. View receipt`}
      style={s.row}
    >
      <AvatarStack students={all} size={40} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.rowTitle} numberOfLines={2} maxFontSizeMultiplier={1.35}>
          {title}
        </Text>
        <Text style={s.rowMeta} numberOfLines={1} maxFontSizeMultiplier={1.35}>
          {names} · {formatDate(tx.created_at)}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 5 }}>
        <Text style={s.rowAmount} maxFontSizeMultiplier={1.3}>
          {amount}
        </Text>
        <TxStatusPill status={tx.status} />
      </View>
    </PressableScale>
  );
}

export function PaymentHistory({ c }: { c: ParentTuition }) {
  const reduce = useReducedMotion();
  const offsets = c.sections.map((_, idx) =>
    c.sections.slice(0, idx).reduce((n, sec) => n + sec.data.length, 0),
  );
  return (
    <View style={{ marginTop: 26 }}>
      {c.transactions.length > 0 ? <GardenSectionHeader title="Payment History" /> : null}
      {c.sections.length === 0 ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenEmpty emoji="🧾" title="No payment history yet." tint="butter" />
        </View>
      ) : (
        c.sections.map((section, si) => (
          <View key={section.title} style={{ paddingHorizontal: GUTTER, marginBottom: 16 }}>
            <Text style={s.month} maxFontSizeMultiplier={1.3}>
              {section.title}
            </Text>
            <View style={{ gap: 10 }}>
              {section.data.map((tx, ti) => {
                const delay = Math.min(offsets[si] + ti, 8) * 50;
                return (
                  <Animated.View
                    key={tx.id}
                    entering={reduce ? undefined : FadeInDown.delay(delay).springify()}
                  >
                    <TxRow
                      tx={tx}
                      student={c.studentMap[tx.student_id ?? ""] ?? null}
                      studentMap={c.studentMap}
                      onPress={() => c.openDetail(tx)}
                    />
                  </Animated.View>
                );
              })}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const s = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    paddingBottom: 14,
  },
  chips: { gap: 8, paddingHorizontal: GUTTER, paddingBottom: 14 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingLeft: 6,
    paddingRight: 16,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  chipOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  chipText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.ink, maxWidth: 110 },
  month: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Garden.muted,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: GardenRadii.md,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
    ...gardenShadowSm,
  },
  rowTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14.5, color: Garden.ink },
  rowMeta: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.muted },
  rowAmount: { fontFamily: GardenFonts.display, fontSize: 16, color: Garden.ink },
});
