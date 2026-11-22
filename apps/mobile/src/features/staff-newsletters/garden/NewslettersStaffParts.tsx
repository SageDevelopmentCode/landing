// Garden UI for staff newsletters: list card, list skeleton, the "New
// Newsletter" sheet (title + week picker, awaited create) and the change log.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenEmpty,
  GardenField,
  GardenFonts,
  GardenIconButton,
  GardenRadii,
  GardenSkeleton,
  GardenTints,
  HandNote,
  Pill,
  PressableScale,
  gardenCard,
  gardenEnter,
  gardenSheetChrome,
  haptic,
} from "@/components/garden";
import type { NewsletterChangeEntry, NewsletterListItem } from "@/lib/newsletters-actions";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { LinearTransition, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { generateWeekOptions } from "../useStaffNewsletters";

export const GUTTER = 18;

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NewsletterRow({
  item,
  index,
  deleting,
  onPress,
  onMenu,
}: {
  item: NewsletterListItem;
  index: number;
  deleting: boolean;
  onPress: () => void;
  onMenu: () => void;
}) {
  const reduce = useReducedMotion();
  const published = item.status === "published";
  return (
    <Animated.View
      entering={reduce || index > 5 ? undefined : gardenEnter(index, { max: 8 })}
      layout={reduce ? undefined : LinearTransition}
      style={{ opacity: deleting ? 0.5 : 1 }}
    >
      <PressableScale
        pressedScale={0.985}
        onPress={onPress}
        disabled={deleting}
        accessibilityLabel={`${item.title}, ${item.week_range}, ${published ? "Published" : "Draft"}, updated ${formatRelativeTime(item.updated_at)}`}
        accessibilityHint="Opens the newsletter"
        style={s.row}
      >
        <View style={[s.icon, { backgroundColor: published ? GardenTints.sage.bg : GardenTints.butter.bg }]}>
          <Text style={{ fontSize: 22 }}>{published ? "📬" : "📝"}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.title} numberOfLines={2} maxFontSizeMultiplier={1.3}>
            {item.title}
          </Text>
          <Text style={s.meta} maxFontSizeMultiplier={1.3}>
            {item.week_range}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {published ? <Pill tint="sage">✓ Published</Pill> : <Pill tint="butter">✎ Draft</Pill>}
            <Text style={s.time}>{formatRelativeTime(item.updated_at)}</Text>
          </View>
        </View>
        <GardenIconButton icon="ellipsis-horizontal" tone="ghost" size={40} label={`Options for ${item.title}`} onPress={onMenu} />
      </PressableScale>
    </Animated.View>
  );
}

export function NewslettersSkeletonRows() {
  return (
    <View style={{ gap: 12, paddingHorizontal: GUTTER }} accessibilityLabel="Loading newsletters">
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.row, { marginHorizontal: 0 }]}>
          <GardenSkeleton width={52} height={52} radius={16} />
          <View style={{ flex: 1, gap: 8 }}>
            <GardenSkeleton width="65%" height={15} radius={6} />
            <GardenSkeleton width="40%" height={12} radius={6} />
            <GardenSkeleton width={80} height={20} radius={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── New Newsletter sheet ────────────────────────────────────────────────────
export type NewNewsletterHandle = { present: () => void; dismiss: () => void };

export const NewNewsletterSheet = forwardRef<
  NewNewsletterHandle,
  { creating: boolean; onCreate: (title: string, weekRange: string) => Promise<boolean> }
>(function NewNewsletterSheet({ creating, onCreate }, ref) {
  const insets = useSafeAreaInsets();
  const modal = useRef<BottomSheetModal>(null);
  const [title, setTitle] = useState("");
  const [weeks, setWeeks] = useState<string[]>([]);
  const [week, setWeek] = useState("");
  const [titleError, setTitleError] = useState(false);

  useImperativeHandle(ref, () => ({
    present: () => {
      // Fresh week options every time (the app can stay open for days).
      const w = generateWeekOptions();
      setWeeks(w);
      setWeek((cur) => (cur && w.includes(cur) ? cur : w[0]));
      modal.current?.present();
    },
    dismiss: () => modal.current?.dismiss(),
  }));

  const submit = async () => {
    if (!title.trim()) {
      setTitleError(true);
      haptic.error();
      return;
    }
    const ok = await onCreate(title.trim(), week.trim());
    if (ok) {
      modal.current?.dismiss();
      setTitle("");
      setTitleError(false);
    }
  };

  return (
    <BottomSheetModal ref={modal} {...gardenSheetChrome} snapPoints={["78%"]} enableDynamicSizing={false} keyboardBehavior="interactive">
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 24, gap: 14 }}>
        <View>
          <Display size={26}>New Newsletter</Display>
          <HandNote size={16}>name it, pick the week, then add your sections</HandNote>
        </View>
        <View style={{ gap: 6 }}>
          <Text style={s.label}>Title</Text>
          <GardenField
            InputComponent={BottomSheetTextInput as never}
            placeholder="Week of May 26"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (t.trim()) setTitleError(false);
            }}
            containerStyle={titleError ? { borderColor: Garden.coralDeep } : undefined}
            accessibilityLabel="Newsletter title"
            returnKeyType="done"
          />
          {titleError ? <Text style={s.error}>Please enter a title.</Text> : null}
        </View>
        <View style={{ gap: 8 }}>
          <Text style={s.label}>Week Range</Text>
          <View style={s.weekWrap} accessibilityRole="radiogroup">
            {weeks.map((w, i) => {
              const on = w === week;
              return (
                <PressableScale
                  key={w}
                  haptics="select"
                  pressedScale={0.97}
                  onPress={() => setWeek(w)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={i === 0 ? `${w}, this week` : w}
                  style={[s.week, on && s.weekOn]}
                >
                  <Text style={[s.weekText, on && { color: Garden.white }]} maxFontSizeMultiplier={1.3}>
                    {w}
                  </Text>
                  {i === 0 ? <Text style={[s.weekTag, on && { color: Garden.white }]}>this week</Text> : null}
                </PressableScale>
              );
            })}
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
          <GardenButton label="Cancel" tone="outline" onPress={() => modal.current?.dismiss()} style={{ flex: 1 }} disabled={creating} />
          <GardenButton
            label="Create"
            loading={creating}
            loadingLabel="Creating…"
            tone="coral"
            icon="add"
            onPress={() => void submit()}
            style={{ flex: 2 }}
          />
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

// ─── Change log sheet ────────────────────────────────────────────────────────
export const ChangeLogSheet = forwardRef<BottomSheetModal, { entries: NewsletterChangeEntry[] }>(function ChangeLogSheet(
  { entries },
  ref,
) {
  const insets = useSafeAreaInsets();
  const sorted = [...entries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return (
    <BottomSheetModal ref={ref} {...gardenSheetChrome} snapPoints={["60%", "90%"]} enableDynamicSizing={false}>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 24 }}>
        <Display size={26}>Change Log</Display>
        {sorted.length === 0 ? (
          <GardenEmpty emoji="🕰️" title="No changes recorded yet." tint="sky" style={{ marginTop: 14 }} />
        ) : (
          <View style={{ marginTop: 14 }}>
            {sorted.map((e, i) => {
              const name = e.teacher_name ?? "Unknown";
              const last = i === sorted.length - 1;
              return (
                <View key={e.id} style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ alignItems: "center" }}>
                    <GardenAvatar name={name} uri={e.teacher_avatar} seed={e.teacher_id} size={36} />
                    {!last ? <View style={s.rail} /> : null}
                  </View>
                  <View style={[s.logCard, { marginBottom: last ? 0 : 12 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={s.logName} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={s.logTime}>{formatRelativeTime(e.created_at)}</Text>
                    </View>
                    {e.summary.map((line, k) => (
                      <Text key={k} style={s.logLine}>
                        • {line}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export function SectionRowIcon({ visible }: { visible: boolean }) {
  return <Ionicons name={visible ? "eye-outline" : "eye-off-outline"} size={20} color={visible ? Garden.sageDeep : Garden.muted} />;
}

const s = StyleSheet.create({
  row: {
    ...gardenCard,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    marginHorizontal: GUTTER,
    marginBottom: 12,
  },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink },
  meta: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.soft },
  time: { fontFamily: GardenFonts.hand, fontSize: 14, color: Garden.muted },
  label: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  error: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5, color: Garden.danger, marginLeft: 12 },
  weekWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  week: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.pill,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
    justifyContent: "center",
  },
  weekOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  weekText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.ink },
  weekTag: { fontFamily: GardenFonts.hand, fontSize: 13, color: Garden.muted, marginTop: -2 },
  rail: { flex: 1, width: 2, backgroundColor: Garden.line, marginTop: 4 },
  logCard: { flex: 1, ...gardenCard, borderRadius: 18, padding: 12, gap: 3 },
  logName: { flexShrink: 1, fontFamily: GardenFonts.bodyHeavy, fontSize: 14.5, color: Garden.ink },
  logTime: { fontFamily: GardenFonts.hand, fontSize: 14, color: Garden.muted },
  logLine: { fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.soft, lineHeight: 19 },
});
