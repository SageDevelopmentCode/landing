// Home section for Teacher Favorites, shared by the parent and staff Homes:
// a heading with a "New!" pill, then a snap rail of teacher cards with a
// favorite-drink teaser. Tapping a card opens that teacher's favorites.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenFonts,
  GardenRadii,
  GardenSpace,
  HandNote,
  PressableScale,
  gardenCard,
  gardenPopIn,
} from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { TEACHER_FAVORITES, firstNameOf, type TeacherFavorites } from "../teacherFavorites";
import { useTeacherPhotos } from "../useTeacherPhotos";

const GUTTER = GardenSpace.gutter;
const CARD_W = 150;
const GAP = 10;

/** First drink, else restaurant, else sweet treat. */
function teaserFor(t: TeacherFavorites): string | null {
  const pick = (list: string[] | undefined) =>
    (list ?? []).find((v) => v.trim() && v.trim().toLowerCase() !== "none");
  const drink = pick(t.favorites.drink);
  if (drink) return `☕ ${drink}`;
  const food = pick(t.favorites.food);
  if (food) return `🍜 ${food}`;
  const sweet = pick(t.favorites.sweet);
  return sweet ? `🍫 ${sweet}` : null;
}

export function TeacherFavoritesSection({
  isNew,
  onOpen,
  style,
}: {
  isNew: boolean;
  onOpen: (teacher?: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const photoFor = useTeacherPhotos();
  const reduce = useReducedMotion();

  return (
    <View style={[{ marginBottom: 26 }, style]}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            <Display size={22}>Teacher Favorites</Display>
            {isNew ? (
              <Animated.View
                entering={reduce ? undefined : gardenPopIn(120)}
                style={s.newPill}
                accessible
                accessibilityLabel="New"
              >
                <Text style={s.newText} maxFontSizeMultiplier={1.2}>
                  New!
                </Text>
              </Animated.View>
            ) : null}
          </View>
          <HandNote size={16}>a little gift guide 🎁</HandNote>
        </View>
        <Pressable
          onPress={() => onOpen()}
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel="View all: Teacher Favorites"
          style={({ pressed }) => [s.link, pressed && { opacity: 0.6 }]}
        >
          <Text style={s.linkText} maxFontSizeMultiplier={1.3}>
            View all
          </Text>
          <Ionicons name="arrow-forward" size={14} color={Garden.sageDeep} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        decelerationRate="fast"
        snapToInterval={CARD_W + GAP}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: GAP, paddingHorizontal: GUTTER, paddingBottom: 6 }}
      >
        {TEACHER_FAVORITES.map((t) => {
          const teaser = teaserFor(t);
          return (
            <PressableScale
              key={t.fullName}
              onPress={() => onOpen(t.fullName)}
              accessibilityLabel={`See ${t.fullName}'s favorites`}
              style={s.card}
            >
              <GardenAvatar name={t.fullName} uri={photoFor(t.fullName)} size={56} />
              <Text style={s.name} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {firstNameOf(t.fullName)}
              </Text>
              {teaser ? (
                <Text style={s.teaser} numberOfLines={2} maxFontSizeMultiplier={1.3}>
                  {teaser}
                </Text>
              ) : null}
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: GUTTER,
    marginBottom: 12,
    gap: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  newPill: {
    backgroundColor: Garden.coralDeep,
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    transform: [{ rotate: "-3deg" }],
  },
  newText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.white, letterSpacing: 0.3 },
  link: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 },
  linkText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.sageDeep },
  card: {
    ...gardenCard,
    width: CARD_W,
    borderRadius: 24,
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  name: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  teaser: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 12.5,
    lineHeight: 17,
    color: Garden.soft,
    textAlign: "center",
  },
});
