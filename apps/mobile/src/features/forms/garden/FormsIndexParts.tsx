// Garden UI for the Forms & Docs index: hero, child switcher, document rows
// and their loading / empty / error states.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSkeleton,
  GardenSpace,
  GardenTints,
  Pill,
  PressableScale,
  gardenCard,
  gardenEnter,
} from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { formatProgram } from "../formsUtils";
import type { DocRow, FormsIndex } from "../useFormsIndex";
import { goBackOr } from "./FormParts";
import type { FormsFeedback } from "./useFormsFeedback";

const GUTTER = GardenSpace.gutter;

// ─── Hero ────────────────────────────────────────────────────────────────────
export function FormsHero() {
  const router = useRouter();
  return (
    <View style={st.hero}>
      <GardenIconButton icon="chevron-back" label="Back" onPress={() => goBackOr(router, "/(tabs)/home")} />
      <Display size={32} style={{ flex: 1 }}>
        Forms & Docs
      </Display>
    </View>
  );
}

// ─── Child switcher ──────────────────────────────────────────────────────────
export function ChildSwitcher({ c }: { c: FormsIndex }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={st.chips}
      accessibilityRole="tablist"
    >
      {c.children.map((ch) => {
        const active = ch.id === c.child?.id;
        const name = ch.child_legal_name ?? "Student";
        const first = name.split(" ")[0];
        return (
          <PressableScale
            key={ch.id}
            haptics="select"
            onPress={() => c.selectChild(ch.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${first}${ch.program ? `, ${formatProgram(ch.program)}` : ""}`}
            style={[st.chip, active && st.chipActive]}
          >
            <GardenAvatar name={name} size={36} />
            <View style={{ gap: 0 }}>
              <Text style={[st.chipName, active && { color: Garden.sageDeep }]} maxFontSizeMultiplier={1.3}>
                {first}
              </Text>
              {ch.program ? (
                <Text style={st.chipProgram} maxFontSizeMultiplier={1.3}>
                  {formatProgram(ch.program)}
                </Text>
              ) : null}
            </View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

// ─── Document rows ───────────────────────────────────────────────────────────
function DocRowCard({ row, index }: { row: DocRow; index: number }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const t = GardenTints[row.tint];
  return (
    <Animated.View
      entering={reduce ? undefined : gardenEnter(index, { max: 6 })}
    >
      <PressableScale
        onPress={() => router.push({ pathname: row.pathname as never, params: row.params })}
        accessibilityLabel={`${row.label}, completed`}
        accessibilityHint="Opens the signed document"
        style={st.row}
      >
        <View style={[st.tile, { backgroundColor: t.bg }]}>
          <Ionicons name={row.icon} size={22} color={t.fg} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={st.rowTitle} numberOfLines={2} maxFontSizeMultiplier={1.4}>
            {row.label}
          </Text>
          <Pill tint="mint">✓ Completed</Pill>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Garden.muted} />
      </PressableScale>
    </Animated.View>
  );
}

function RowsSkeleton() {
  return (
    <View style={st.list} accessible accessibilityLabel="Loading documents">
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={st.row}>
          <GardenSkeleton width={48} height={48} radius={GardenRadii.sm} />
          <View style={{ flex: 1, gap: 8 }}>
            <GardenSkeleton width="70%" height={15} />
            <GardenSkeleton width={92} height={20} radius={GardenRadii.pill} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function DocumentList({ c, fb }: { c: FormsIndex; fb: FormsFeedback }) {
  const firstName = c.child?.child_legal_name?.split(" ")[0] ?? "Student";

  if (c.rowsError) {
    return (
      <View style={st.list}>
        <GardenErrorCard
          title="We couldn't load these documents"
          onRetry={() => void fb.retry()}
          retrying={fb.retrying}
        />
      </View>
    );
  }
  if (c.rowsLoading || c.rows === null) return <RowsSkeleton />;
  if (c.rows.length === 0) {
    return (
      <View style={st.list}>
        <GardenEmpty
          emoji="📂"
          tint="sky"
          title="No Documents Yet"
          body={`No completed documents for ${firstName} yet. Documents will appear here once they are submitted.`}
        />
      </View>
    );
  }
  const n = c.rows.length;
  return (
    <View style={st.list}>
      <Text style={st.summary} maxFontSizeMultiplier={1.4} accessibilityRole="summary">
        {`${n} ${n === 1 ? "document" : "documents"} on file`}
      </Text>
      {c.rows.map((row, i) => (
        <DocRowCard key={row.key} row={row} index={i} />
      ))}
    </View>
  );
}

// ─── Whole-screen states ─────────────────────────────────────────────────────
export function FormsIndexSkeleton() {
  return (
    <>
      <View style={st.chips}>
        <GardenSkeleton width={130} height={52} radius={GardenRadii.pill} />
        <GardenSkeleton width={130} height={52} radius={GardenRadii.pill} />
      </View>
      <RowsSkeleton />
    </>
  );
}

export function FormsIndexError({ fb }: { fb: FormsFeedback }) {
  return (
    <View style={st.list}>
      <GardenErrorCard onRetry={() => void fb.retry()} retrying={fb.retrying} />
    </View>
  );
}

export function NoChildren() {
  return (
    <View style={st.list}>
      <GardenEmpty
        emoji="🌱"
        tint="mint"
        title="No Children Found"
        body="Contact your school administrator to link your children to this account."
      />
    </View>
  );
}

const st = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    paddingBottom: 10,
  },
  chips: { flexDirection: "row", gap: 10, paddingHorizontal: GUTTER, paddingVertical: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingLeft: 6,
    paddingRight: 16,
    paddingVertical: 6,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  chipActive: { backgroundColor: GardenTints.sage.bg, borderColor: Garden.sage },
  chipName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  chipProgram: { fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.muted },
  list: { paddingHorizontal: GUTTER, paddingTop: 12, gap: 12 },
  summary: { fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.soft, marginBottom: 2 },
  row: {
    ...gardenCard,
    borderRadius: GardenRadii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    minHeight: 76,
  },
  tile: {
    width: 48,
    height: 48,
    borderRadius: GardenRadii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontFamily: GardenFonts.bodyBold, fontSize: 16, color: Garden.ink },
});
