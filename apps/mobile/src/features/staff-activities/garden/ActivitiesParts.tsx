// Garden UI for staff Activities: list rows with status / visibility / food
// pills and family-preference counts, the detail screen pieces (photo pager,
// preferences card, food cards) and the change-history timeline.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenFonts,
  GardenHintBox,
  GardenIconButton,
  GardenRadii,
  GardenSkeleton,
  GardenTints,
  HandNote,
  Pill,
  PressableScale,
  gardenCard,
  haptic,
} from "@/components/garden";
import type { Activity, ActivityChangeLogEntry, ActivityFood } from "@/lib/activities-actions";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo, useState } from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown, LinearTransition, useReducedMotion } from "react-native-reanimated";
import type { PrefCount } from "../useStaffActivities";

export const GUTTER = 18;

export function formatActivityDate(d: string | null, opts: Intl.DateTimeFormatOptions = {}) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...opts,
  });
}

export function StatusPills({ a }: { a: Activity }) {
  return (
    <View style={s.pills}>
      {a.status === "published" ? <Pill tint="sage">✓ Published</Pill> : <Pill tint="butter">✎ Draft</Pill>}
      {a.visibility === "public" ? <Pill tint="sky">👀 Public</Pill> : <Pill tint="lav">🔒 Private</Pill>}
      {a.includes_food ? <Pill tint="peach">🍎 Food</Pill> : null}
    </View>
  );
}

/** Families only see published + public activities. */
export function visibleToFamilies(a: { status: string; visibility: string }) {
  return a.status === "published" && a.visibility === "public";
}

// ─── List row ────────────────────────────────────────────────────────────────
function ActivityRowImpl({
  a,
  index,
  prefs,
  canManage,
  deleting,
  onPress,
  onMenu,
}: {
  a: Activity;
  index: number;
  prefs?: PrefCount;
  canManage: boolean;
  deleting: boolean;
  onPress: () => void;
  onMenu: () => void;
}) {
  const reduce = useReducedMotion();
  const thumb = a.images[0]?.signed_url || null;
  const date = formatActivityDate(a.activity_date);
  const answered = prefs ? prefs.full + prefs.nonFull : 0;
  return (
    <Animated.View
      entering={reduce || index > 5 ? undefined : FadeInDown.delay(index * 50).springify().damping(18)}
      layout={reduce ? undefined : LinearTransition}
      style={{ opacity: deleting ? 0.5 : 1 }}
    >
      <PressableScale
        pressedScale={0.985}
        onPress={onPress}
        disabled={deleting}
        accessibilityLabel={`${a.title}${date ? `, ${date}` : ""}, ${a.status === "published" ? "Published" : "Draft"}, ${a.visibility === "public" ? "Public" : "Private"}`}
        accessibilityHint="Opens the activity"
        style={s.row}
      >
        <View style={s.thumb}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          ) : (
            <Text style={{ fontSize: 26 }}>🎨</Text>
          )}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.title} numberOfLines={2} maxFontSizeMultiplier={1.3}>
            {a.title}
          </Text>
          <Text style={[s.meta, !date && visibleToFamilies(a) && { color: Garden.coralDeep }]} maxFontSizeMultiplier={1.3}>
            {date ?? (visibleToFamilies(a) ? "No date set" : "No date yet")}
          </Text>
          <StatusPills a={a} />
          {a.status === "published" && answered > 0 ? (
            <Text style={s.prefs} maxFontSizeMultiplier={1.3}>
              {`✅ ${prefs!.full} full · ⚠️ ${prefs!.nonFull} other`}
            </Text>
          ) : null}
        </View>
        {canManage ? (
          <GardenIconButton
            icon="ellipsis-horizontal"
            tone="ghost"
            size={40}
            label={`Options for ${a.title}`}
            onPress={onMenu}
          />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={Garden.muted} />
        )}
      </PressableScale>
    </Animated.View>
  );
}
export const ActivityRow = memo(ActivityRowImpl);

export function ActivitiesSkeleton() {
  return (
    <View style={{ paddingHorizontal: GUTTER, gap: 12 }} accessibilityLabel="Loading activities">
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[s.row, { marginHorizontal: 0 }]}>
          <GardenSkeleton width={72} height={72} radius={18} />
          <View style={{ flex: 1, gap: 8 }}>
            <GardenSkeleton width="70%" height={15} radius={6} />
            <GardenSkeleton width="35%" height={12} radius={6} />
            <View style={{ flexDirection: "row", gap: 6 }}>
              <GardenSkeleton width={70} height={20} radius={10} />
              <GardenSkeleton width={60} height={20} radius={10} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Detail: photo pager ─────────────────────────────────────────────────────
export function PhotoPager({ a }: { a: Activity }) {
  const { width } = useWindowDimensions();
  const w = width - GUTTER * 2;
  const [i, setI] = useState(0);
  if (a.images.length === 0) {
    return (
      <View style={[s.pagerEmpty, { width: w }]}>
        <Text style={{ fontSize: 40 }}>🎨</Text>
        <HandNote size={16} color={Garden.muted}>
          no photos yet
        </HandNote>
      </View>
    );
  }
  return (
    <View style={[s.pager, { width: w, height: w * 0.66 }]}>
      <FlatList
        data={a.images}
        keyExtractor={(img) => img.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const n = Math.round(e.nativeEvent.contentOffset.x / w);
          if (n !== i) haptic.select();
          setI(n);
        }}
        renderItem={({ item, index }) => (
          <Image
            source={{ uri: item.signed_url }}
            style={{ width: w, height: w * 0.66 }}
            contentFit="cover"
            accessibilityLabel={`Photo ${index + 1} of ${a.images.length}`}
          />
        )}
      />
      {a.images.length > 1 ? (
        <View style={s.dots} pointerEvents="none">
          {a.images.map((img, k) => (
            <View key={img.id} style={[s.dot, k === i && s.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ─── Detail: family preferences card ─────────────────────────────────────────
export function PrefsCard({
  a,
  prefs,
  attendingCount,
  onOpen,
}: {
  a: Activity;
  prefs?: PrefCount;
  attendingCount: number;
  onOpen: () => void;
}) {
  const answered = prefs ? prefs.full + prefs.nonFull : 0;
  if (!visibleToFamilies(a)) {
    return (
      <GardenHintBox icon="eye-off-outline">
        Families can't see this yet. Publish it as Public to collect their preferences.
      </GardenHintBox>
    );
  }
  return (
    <PressableScale onPress={onOpen} accessibilityLabel="Student Preferences" accessibilityHint="Opens who's set a preference" style={s.prefCard}>
      <View style={s.prefIcon}>
        <Ionicons name="people" size={20} color={Garden.sageDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.prefTitle} maxFontSizeMultiplier={1.3}>
          Student Preferences
        </Text>
        <Text style={s.prefSub} maxFontSizeMultiplier={1.3}>
          {!a.activity_date
            ? "No activity date set."
            : answered
              ? `✅ ${prefs!.full} full · ⚠️ ${prefs!.nonFull} other${attendingCount ? ` · ${attendingCount} attending` : ""}`
              : `${attendingCount} attending · no answers yet`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Garden.muted} />
    </PressableScale>
  );
}

// ─── Detail: food card ───────────────────────────────────────────────────────
export function FoodCard({ food }: { food: ActivityFood }) {
  const [open, setOpen] = useState(false);
  const thumb = food.images[0]?.signed_url || null;
  const n = food.ingredients.length;
  return (
    <View style={s.food}>
      <PressableScale
        haptics="select"
        pressedScale={0.99}
        onPress={() => setOpen((o) => !o)}
        disabled={n === 0}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${food.name}${food.allergens ? `, allergens: ${food.allergens}` : ""}${n ? `, ${n} ingredients` : ""}`}
        style={s.foodHead}
      >
        <View style={s.foodThumb}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Ionicons name="restaurant-outline" size={18} color={GardenTints.peach.fg} />
          )}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.foodName} maxFontSizeMultiplier={1.3}>
            {food.name}
          </Text>
          {food.allergens ? <Pill tint="coral">⚠️ {food.allergens}</Pill> : null}
          {n > 0 ? (
            <Text style={s.meta} maxFontSizeMultiplier={1.3}>
              {n} ingredient{n !== 1 ? "s" : ""}
            </Text>
          ) : null}
        </View>
        {n > 0 ? <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={Garden.muted} /> : null}
      </PressableScale>
      {open && n > 0 ? (
        <View style={s.ingList}>
          {food.ingredients.map((ing) => {
            const t = ing.images[0]?.signed_url || null;
            return (
              <View key={ing.id} style={s.ingRow}>
                <View style={s.ingThumb}>
                  {t ? (
                    <Image source={{ uri: t }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <Ionicons name="leaf-outline" size={12} color={Garden.sageDeep} />
                  )}
                </View>
                <Text style={s.ingName} maxFontSizeMultiplier={1.3}>
                  {ing.name}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ─── Change history ──────────────────────────────────────────────────────────
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function LogEntry({ entry, last }: { entry: ActivityChangeLogEntry; last: boolean }) {
  const name = entry.teacher_name ?? "Teacher";
  return (
    <View style={s.logRow}>
      <View style={s.logRail}>
        <GardenAvatar name={name} uri={entry.teacher_profile_image_url} seed={entry.teacher_id} size={38} />
        {!last ? <View style={s.logLine} /> : null}
      </View>
      <View style={[s.logCard, { marginBottom: last ? 0 : 14 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={s.logName} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {name}
          </Text>
          <Text style={s.logTime}>{relativeTime(entry.created_at)}</Text>
        </View>
        {entry.summary.map((line, i) => (
          <Text key={i} style={s.logLine2} maxFontSizeMultiplier={1.4}>
            • {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function SectionTitle({ children, note }: { children: string; note?: string }) {
  return (
    <View style={{ marginTop: 22, marginBottom: 10 }}>
      <Display size={20}>{children}</Display>
      {note ? <HandNote size={15}>{note}</HandNote> : null}
    </View>
  );
}

const s = StyleSheet.create({
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
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
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: GardenTints.peach.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink },
  meta: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.muted },
  prefs: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5, color: Garden.soft },
  pager: { borderRadius: GardenRadii.card, overflow: "hidden", backgroundColor: "#f1e7d8" },
  pagerEmpty: {
    height: 150,
    borderRadius: GardenRadii.card,
    backgroundColor: GardenTints.peach.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dots: { position: "absolute", bottom: 10, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.55)" },
  dotOn: { backgroundColor: Garden.white, width: 18 },
  prefCard: {
    ...gardenCard,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  prefIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: GardenTints.sage.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  prefTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink },
  prefSub: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.soft, marginTop: 2 },
  food: { ...gardenCard, borderRadius: 22, marginBottom: 10, overflow: "hidden" },
  foodHead: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, minHeight: 66 },
  foodThumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: GardenTints.peach.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  foodName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.ink },
  ingList: { paddingHorizontal: 14, paddingBottom: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#f5ede1", paddingTop: 10 },
  ingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ingThumb: {
    width: 30,
    height: 30,
    borderRadius: 9,
    overflow: "hidden",
    backgroundColor: GardenTints.sage.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  ingName: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.ink },
  logRow: { flexDirection: "row", gap: 12 },
  logRail: { alignItems: "center" },
  logLine: { flex: 1, width: 2, backgroundColor: Garden.line, marginTop: 4 },
  logCard: { flex: 1, ...gardenCard, borderRadius: 18, padding: 12, gap: 3 },
  logName: { flexShrink: 1, fontFamily: GardenFonts.bodyHeavy, fontSize: 14.5, color: Garden.ink },
  logTime: { fontFamily: GardenFonts.hand, fontSize: 14, color: Garden.muted },
  logLine2: { fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.soft, lineHeight: 19 },
});
