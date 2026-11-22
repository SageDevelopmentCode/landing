// Garden UI for the parent Teacher Favorites screen: teacher picker rail,
// the selected teacher's header card, favorite cards, "no thanks" and the
// "would make my day" sticky note. Data lives in useTeacherFavorites().
import {
  Display,
  Garden,
  GardenAvatar,
  GardenFonts,
  GardenRadii,
  GardenSpace,
  GardenTints,
  HandNote,
  MIN_TAP,
  PressableScale,
  StickyNote,
  gardenCard,
  gardenEnter,
  haptic,
  type GardenTint,
} from "@/components/garden";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import {
  FAVORITE_CATEGORIES,
  firstNameOf,
  type FavoriteCategory,
  type TeacherFavorites,
} from "../teacherFavorites";
import type { TeacherFavoritesState } from "../useTeacherFavorites";

const GUTTER = GardenSpace.gutter;

/** Non-empty answers only; "None" means the teacher skipped it. */
function clean(list: string[] | undefined) {
  return (list ?? []).filter((v) => v.trim() && v.trim().toLowerCase() !== "none");
}

function visibleCategories(t: TeacherFavorites) {
  return FAVORITE_CATEGORIES.map((c) => ({
    ...c,
    rows: c.rows
      .map((r) => ({ ...r, items: clean(t.favorites[r.key]) }))
      .filter((r) => r.items.length > 0),
  })).filter((c) => c.rows.length > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher picker rail
// ─────────────────────────────────────────────────────────────────────────────
export function TeacherPicker({ f }: { f: TeacherFavoritesState }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={pk.rail}
    >
      {f.teachers.map((t) => {
        const selected = t.fullName === f.selected.fullName;
        return (
          <PressableScale
            key={t.fullName}
            haptics={false}
            onPress={() => {
              if (selected) return;
              haptic.select();
              f.select(t.fullName);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${t.fullName}'s favorites`}
            style={pk.chip}
          >
            <View style={[pk.ring, selected && pk.ringOn]}>
              <GardenAvatar name={t.fullName} uri={f.photoFor(t.fullName)} size={56} />
            </View>
            <Text
              style={[pk.name, selected && pk.nameOn]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
            >
              {firstNameOf(t.fullName)}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const pk = StyleSheet.create({
  rail: { gap: 6, paddingHorizontal: GUTTER - 4, paddingVertical: 4 },
  chip: { width: 80, minHeight: MIN_TAP, alignItems: "center", gap: 6, paddingVertical: 4 },
  ring: { padding: 3, borderRadius: 40, borderWidth: 2.5, borderColor: "transparent" },
  ringOn: { borderColor: Garden.sage },
  name: { fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.muted },
  nameOn: { fontFamily: GardenFonts.bodyHeavy, color: Garden.ink },
});

// ─────────────────────────────────────────────────────────────────────────────
// Selected teacher's favorites
// ─────────────────────────────────────────────────────────────────────────────
export function FavoritesBoard({ f }: { f: TeacherFavoritesState }) {
  const reduce = useReducedMotion();
  const t = f.selected;
  const cats = visibleCategories(t);
  const noThanks = clean(t.favorites.noThanks);
  const enter = (i: number) => (reduce ? undefined : gardenEnter(i, { max: 8 }));

  return (
    // Re-keyed on the teacher so cards re-enter calmly when switching.
    <View key={t.fullName} style={{ paddingHorizontal: GUTTER, gap: 12 }}>
      <Animated.View entering={enter(0)} style={bd.header}>
        <GardenAvatar name={t.fullName} uri={f.photoFor(t.fullName)} size={64} />
        <View style={{ flex: 1 }}>
          <Display size={26} numberOfLines={2}>
            {t.fullName}
          </Display>
          <HandNote size={17}>a few of {firstNameOf(t.fullName)}’s favorite things</HandNote>
        </View>
      </Animated.View>

      {cats.map((c, idx) => (
        <Animated.View key={c.key} entering={enter(idx + 1)}>
          <FavoriteCard category={c} />
        </Animated.View>
      ))}

      {noThanks.length > 0 ? (
        <Animated.View
          entering={enter(cats.length + 1)}
          style={[bd.card, bd.noThanks]}
          accessible
          accessibilityLabel={`Thanks, but no thanks: ${noThanks.join(", ")}`}
        >
          <CardTitle emoji="🙅" label="Thanks, but no thanks!" tint="coral" onTint />
          <Text style={bd.noThanksBody} maxFontSizeMultiplier={1.4}>
            I have enough of:
          </Text>
          <Chips items={noThanks} tint="coral" onWhite />
        </Animated.View>
      ) : null}

      {t.wish ? (
        <Animated.View entering={enter(cats.length + 2)} style={{ paddingHorizontal: 4, marginTop: 10 }}>
          <StickyNote tilt={1.2}>
            <HandNote size={18} color="#7a5a00">
              would make my day →
            </HandNote>
            <Text style={bd.wish} maxFontSizeMultiplier={1.4}>
              “{t.wish}”
            </Text>
          </StickyNote>
        </Animated.View>
      ) : null}
    </View>
  );
}

type VisibleCategory = Omit<FavoriteCategory, "rows"> & {
  rows: (FavoriteCategory["rows"][number] & { items: string[] })[];
};

function FavoriteCard({ category: c }: { category: VisibleCategory }) {
  const multi = c.rows.some((r) => r.label);
  return (
    <View
      style={bd.card}
      accessible
      accessibilityLabel={`${c.label}: ${c.rows
        .map((r) => (r.label ? `${r.label}, ${r.items.join(", ")}` : r.items.join(", ")))
        .join(". ")}`}
    >
      <CardTitle emoji={c.emoji} label={c.label} tint={c.tint} />
      {multi ? (
        <View style={{ gap: 10, marginTop: 2 }}>
          {c.rows.map((r) => (
            <View key={r.key}>
              {r.label ? (
                <Text style={bd.subLabel} maxFontSizeMultiplier={1.3}>
                  {r.label}
                </Text>
              ) : null}
              <Chips items={r.items} tint={c.tint} />
            </View>
          ))}
        </View>
      ) : (
        <Chips items={c.rows[0].items} tint={c.tint} />
      )}
    </View>
  );
}

function CardTitle({
  emoji,
  label,
  tint,
  onTint,
}: {
  emoji: string;
  label: string;
  tint: GardenTint;
  /** Card is already tinted, so the bubble goes white. */
  onTint?: boolean;
}) {
  return (
    <View style={bd.titleRow}>
      <View style={[bd.emojiBubble, { backgroundColor: onTint ? Garden.white : GardenTints[tint].bg }]}>
        <Text style={{ fontSize: 18 }} maxFontSizeMultiplier={1.2}>
          {emoji}
        </Text>
      </View>
      <Text style={bd.title} maxFontSizeMultiplier={1.35}>
        {label}
      </Text>
    </View>
  );
}

function Chips({ items, tint, onWhite }: { items: string[]; tint: GardenTint; onWhite?: boolean }) {
  const c = GardenTints[tint];
  return (
    <View style={bd.chips}>
      {items.map((item) => (
        <View key={item} style={[bd.chip, { backgroundColor: onWhite ? Garden.white : c.bg }]}>
          <Text style={[bd.chipText, { color: c.fg }]} maxFontSizeMultiplier={1.4}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

const bd = StyleSheet.create({
  header: {
    ...gardenCard,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    marginBottom: 4,
  },
  card: { ...gardenCard, padding: 16, gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  emojiBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink, flex: 1 },
  subLabel: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 12.5,
    color: Garden.muted,
    marginBottom: 6,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: "100%",
  },
  chipText: { fontFamily: GardenFonts.bodyBold, fontSize: 14, lineHeight: 19 },
  noThanks: {
    backgroundColor: GardenTints.coral.bg,
    borderColor: "transparent",
  },
  noThanksBody: { fontFamily: GardenFonts.body, fontSize: 13.5, color: Garden.soft, marginTop: -2 },
  wish: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 15.5,
    lineHeight: 22,
    color: Garden.ink,
    marginTop: 4,
  },
});
