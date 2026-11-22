// Garden UI for parent Newsletters: a featured latest issue, a 2-column grid,
// password rows with a Copy chip, and loading / empty / error states.
import {
  Display,
  Garden,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  GardenSpace,
  GardenTints,
  Pill,
  PressableScale,
  gardenCard,
  gardenEnter,
  haptic,
  type RefreshFeedback,
} from "@/components/garden";
import type { ParentNewsletterListItem } from "@/lib/newsletters-actions";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import type { NewsletterActions } from "./useNewsletterActions";

const GUTTER = GardenSpace.gutter;
export const CARD_GAP = 12;

function CopyChip({ password, actions, label }: { password: string; actions: NewsletterActions; label?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        haptic.success();
        void actions.copyPassword(password);
      }}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Copy password"
      style={({ pressed }) => [st.copyChip, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name="copy-outline" size={12} color={Garden.sageDeep} />
      {label ? <Text style={st.copyText}>Copy</Text> : null}
    </Pressable>
  );
}

function PasswordRow({
  password,
  actions,
  compact,
}: {
  password: string;
  actions: NewsletterActions;
  compact?: boolean;
}) {
  if (compact) {
    // Narrow grid cards: label on one line, the full password + copy below it.
    return (
      <View style={{ marginTop: 4, gap: 3 }}>
        <View style={st.pwRow}>
          <Ionicons name="lock-closed-outline" size={11} color={Garden.soft} />
          <Text style={st.meta} maxFontSizeMultiplier={1.3}>
            Password:
          </Text>
        </View>
        <View style={st.pwRow}>
          <Text selectable style={[st.meta, st.pwValue]} maxFontSizeMultiplier={1.3}>
            {password}
          </Text>
          <CopyChip password={password} actions={actions} />
        </View>
      </View>
    );
  }
  return (
    <View style={[st.pwRow, { marginTop: 4 }]}>
      <Ionicons name="lock-closed-outline" size={13} color={Garden.soft} />
      <Text style={[st.meta, { fontSize: 13 }]} maxFontSizeMultiplier={1.3}>
        Password:{" "}
      </Text>
      <Text selectable style={[st.meta, st.pwValue, { fontSize: 13 }]} maxFontSizeMultiplier={1.3}>
        {password}
      </Text>
      <CopyChip password={password} actions={actions} label />
    </View>
  );
}

function Cover({ uri, emojiSize = 30 }: { uri: string | null; emojiSize?: number }) {
  return uri ? (
    <Image
      source={{ uri }}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      transition={200}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <Text style={{ fontSize: emojiSize }}>📰</Text>
  );
}

function a11yLabel(item: ParentNewsletterListItem) {
  return `${item.title}, ${item.week_range}${item.access_password ? ", password protected" : ""}. Opens in browser`;
}

export function FeaturedNewsletter({
  item,
  actions,
}: {
  item: ParentNewsletterListItem;
  actions: NewsletterActions;
}) {
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : gardenEnter()}
      style={{ paddingHorizontal: GUTTER, marginBottom: 22 }}
    >
      <PressableScale
        pressedScale={0.98}
        accessibilityRole="link"
        accessibilityLabel={a11yLabel(item)}
        accessibilityHint={item.access_password ? "Copies the password, then opens the newsletter" : undefined}
        onPress={() => void actions.open(item)}
        style={st.featured}
      >
        <View style={st.featuredImage}>
          <Cover uri={item.cover_image_url} emojiSize={44} />
          <View style={st.latestPos} pointerEvents="none">
            <Pill tint="butter" style={st.latest}>
              Latest
            </Pill>
          </View>
        </View>
        <View style={st.featuredBody}>
          <Display size={21} numberOfLines={3}>
            {item.title}
          </Display>
          <Text style={[st.meta, { fontSize: 13.5 }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {item.week_range}
          </Text>
          {item.access_password ? (
            <PasswordRow password={item.access_password} actions={actions} />
          ) : null}
          <View style={st.readRow}>
            <Text style={st.readText}>Read newsletter</Text>
            <Ionicons name="open-outline" size={14} color={Garden.sageDeep} />
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export function NewsletterCard({
  item,
  index,
  actions,
}: {
  item: ParentNewsletterListItem;
  index: number;
  actions: NewsletterActions;
}) {
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  const cardWidth = (width - GUTTER * 2 - CARD_GAP) / 2;
  return (
    <Animated.View
      style={{ width: cardWidth }}
      entering={reduce ? undefined : gardenEnter(index, { max: 6 })}
    >
      <PressableScale
        accessibilityRole="link"
        accessibilityLabel={a11yLabel(item)}
        onPress={() => void actions.open(item)}
        style={st.card}
      >
        <View style={st.cardImage}>
          <Cover uri={item.cover_image_url} />
        </View>
        <View style={st.cardBody}>
          <Text style={st.cardTitle} numberOfLines={2} maxFontSizeMultiplier={1.35}>
            {item.title}
          </Text>
          <Text style={st.meta} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {item.week_range}
          </Text>
          {item.access_password ? (
            <PasswordRow password={item.access_password} actions={actions} compact />
          ) : null}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export function NewslettersSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading newsletters" style={{ paddingHorizontal: GUTTER, gap: CARD_GAP }}>
      <GardenSkeleton width="100%" height={280} radius={GardenRadii.card} />
      <View style={{ flexDirection: "row", gap: CARD_GAP }}>
        <GardenSkeleton width="48%" height={170} radius={22} />
        <GardenSkeleton width="48%" height={170} radius={22} />
      </View>
    </View>
  );
}

export function NewslettersError({ fb }: { fb: RefreshFeedback }) {
  return (
    <View style={{ paddingHorizontal: GUTTER, paddingTop: 8, marginBottom: 16 }}>
      <GardenErrorCard
        title="We couldn't load newsletters"
        onRetry={() => void fb.retry()}
        retrying={fb.retrying}
      />
    </View>
  );
}

export function NewslettersEmpty() {
  return (
    <View style={{ paddingHorizontal: GUTTER, paddingTop: 8 }}>
      <GardenEmpty
        emoji="📰"
        tint="peach"
        title="No newsletters yet"
        body="Newsletters will appear here once published."
      />
    </View>
  );
}

const st = StyleSheet.create({
  featured: { ...gardenCard, overflow: "hidden" },
  featuredImage: {
    aspectRatio: 16 / 9,
    width: "100%",
    backgroundColor: Garden.peach,
    alignItems: "center",
    justifyContent: "center",
  },
  latestPos: { position: "absolute", top: 12, left: 12 },
  latest: { transform: [{ rotate: "-3deg" }], paddingHorizontal: 12, paddingVertical: 5 },
  featuredBody: { padding: 16, gap: 6 },
  readRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  readText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.sageDeep },
  card: { ...gardenCard, borderRadius: 22, overflow: "hidden" },
  cardImage: {
    aspectRatio: 16 / 9,
    width: "100%",
    backgroundColor: Garden.peach,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 11, gap: 3 },
  cardTitle: { fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: Garden.ink, lineHeight: 18 },
  meta: { fontFamily: GardenFonts.body, fontSize: 11.5, color: Garden.soft },
  pwRow: { flexDirection: "row", alignItems: "center", gap: 3, flexWrap: "wrap" },
  pwValue: { fontFamily: GardenFonts.bodyHeavy, color: Garden.ink, flexShrink: 1 },
  copyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: GardenRadii.pill,
    backgroundColor: GardenTints.sage.bg,
  },
  copyText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12, color: Garden.sageDeep },
});
