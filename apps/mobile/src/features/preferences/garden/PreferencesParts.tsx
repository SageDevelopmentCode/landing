// Garden UI for Activity Preferences: child switcher, school-day food card,
// auto-fill default card, progress strip, activity cards with the level
// picker, the sticky save bar, and loading / empty / error states.
import {
  getEmergencySnackLabel,
  getSharedFoodLabel,
} from "@/components/SchoolDayFoodPreferencesSheet";
import {
  Display,
  Garden,
  GardenAvatar,
  GardenButton,
  GardenEmpty,
  GardenErrorCard,
  GardenField,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  GardenSpace,
  GardenTints,
  HandNote,
  MIN_TAP,
  Pill,
  PressableScale,
  SeedProgress,
  gardenCard,
  type GardenTint,
} from "@/components/garden";
import {
  ACTIVITY_PREF_BADGE_LABELS,
  LEVEL_OPTIONS,
  LEVEL_SHORT_LABEL,
  getActivityPrefBadgeState,
  type ActivityPrefBadgeState,
  type ParticipationLevel,
} from "@/lib/activity-preferences";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
} from "react-native-reanimated";
import type { Activity, ActivityPreferences } from "../useActivityPreferences";
import type { PreferencesFeedback } from "./usePreferencesFeedback";

const GUTTER = GardenSpace.gutter;

// ─── Child switcher ──────────────────────────────────────────────────────────
export function PrefsChildSwitcher({
  p,
  onSelect,
}: {
  p: ActivityPreferences;
  onSelect: (childId: string) => void;
}) {
  if (p.children.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={st.chips}
      accessibilityRole="tablist"
      style={{ flexGrow: 0 }}
    >
      {p.children.map((ch) => {
        const active = ch.id === p.selectedChildId;
        const first = ch.child_legal_name.split(" ")[0];
        const needsFood = p.childNeedsSchoolDayFoodPrefs(ch.id);
        const unsaved = p.unsavedByChild[ch.id];
        const extra = [needsFood ? "food preferences needed" : null, unsaved ? "unsaved changes" : null]
          .filter(Boolean)
          .join(", ");
        return (
          <PressableScale
            key={ch.id}
            haptics="select"
            onPress={() => onSelect(ch.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={extra ? `${first}, ${extra}` : first}
            style={[st.chip, active && st.chipActive]}
          >
            <GardenAvatar name={ch.child_legal_name} uri={ch.profile_image_url} seed={ch.id} size={34} />
            <Text style={[st.chipName, active && { color: Garden.sageDeep }]} maxFontSizeMultiplier={1.3}>
              {first}
            </Text>
            {unsaved ? <View style={[st.dot, { backgroundColor: Garden.coralDeep }]} /> : null}
            {needsFood ? <View style={[st.dot, { backgroundColor: "#f59e0b" }]} /> : null}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

// ─── School day food ─────────────────────────────────────────────────────────
export function SchoolFoodCard({ p, onOpen }: { p: ActivityPreferences; onOpen: () => void }) {
  if (!p.selectedChildId) return null;
  const pref = p.selectedSchoolDayFoodPref;

  if (!pref) {
    return (
      <View style={st.actionCard}>
        <Pill tint="butter" style={{ backgroundColor: "#f59e0b" }} textStyle={{ color: Garden.white }}>
          Action Needed
        </Pill>
        <PressableScale
          pressedScale={0.98}
          onPress={onOpen}
          accessibilityLabel="School Day Food Preferences. Action needed"
          accessibilityHint="Opens the school day food form"
          style={st.actionRow}
        >
          <Text style={{ fontSize: 24 }}>🍎</Text>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={st.actionTitle} maxFontSizeMultiplier={1.4}>
              School Day Food Preferences
            </Text>
            <Text style={st.actionBody} maxFontSizeMultiplier={1.4}>
              Please tell us how to handle backup snacks and food shared by families during the school
              day. This is a new form, separate from activity cooking preferences below.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#b45309" />
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={st.foodSummary}>
      <View style={st.foodHeader}>
        <View style={st.foodIcon}>
          <Ionicons name="restaurant-outline" size={17} color="#b45309" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.foodTitle} maxFontSizeMultiplier={1.4}>
            School Day Food Preferences
          </Text>
          <Text style={st.foodSub} maxFontSizeMultiplier={1.4}>
            Saved to your child&apos;s profile for daily food offerings
          </Text>
        </View>
        <GardenButton label="Update" icon="pencil-outline" tone="outline" size="sm" onPress={onOpen} />
      </View>
      <View style={st.foodBlock}>
        <Text style={st.foodLabel}>Emergency / backup snacks</Text>
        <Text style={st.foodValue}>{getEmergencySnackLabel(pref.emergency_snack_preference)}</Text>
      </View>
      <View style={st.foodBlock}>
        <Text style={st.foodLabel}>Shared / gifted foods</Text>
        <Text style={st.foodValue}>{getSharedFoodLabel(pref.shared_food_preference)}</Text>
      </View>
    </View>
  );
}

// ─── Level picker ────────────────────────────────────────────────────────────
function LevelTile({
  emoji,
  label,
  selected,
  onPress,
  disabled,
  a11y,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  a11y: string;
}) {
  const reduce = useReducedMotion();
  const pop = useAnimatedStyle(() => ({
    transform: [{ scale: reduce ? 1 : withSpring(selected ? 1.12 : 1, { damping: 11, stiffness: 260 }) }],
  }));
  return (
    <PressableScale
      haptics="select"
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      accessibilityLabel={a11y}
      style={[st.levelTile, selected && st.levelTileActive]}
    >
      <Animated.Text style={[st.levelEmoji, pop]}>{emoji}</Animated.Text>
      <Text
        style={[st.levelLabel, selected && st.levelLabelActive]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
      {selected ? (
        <View style={st.levelCheck} pointerEvents="none">
          <Ionicons name="checkmark" size={11} color={Garden.white} />
        </View>
      ) : null}
    </PressableScale>
  );
}

/** Three participation tiles. Tapping the selected one clears it (as before). */
export function LevelPicker({
  value,
  onChange,
  disabled,
}: {
  value: ParticipationLevel | null;
  onChange: (level: ParticipationLevel | null) => void;
  disabled?: boolean;
}) {
  return (
    <View style={st.levelRow} accessibilityRole="radiogroup">
      {LEVEL_OPTIONS.map((opt) => {
        const active = value === opt.level;
        return (
          <LevelTile
            key={opt.level}
            emoji={opt.emoji}
            label={LEVEL_SHORT_LABEL[opt.level]}
            selected={active}
            disabled={disabled}
            a11y={opt.label}
            onPress={() => onChange(active ? null : opt.level)}
          />
        );
      })}
    </View>
  );
}

// ─── Auto-fill default ───────────────────────────────────────────────────────
export function AutoFillCard({ p, fb }: { p: ActivityPreferences; fb: PreferencesFeedback }) {
  const [expanded, setExpanded] = useState(false);
  const { currentDefault, defaultSaveStatus: saveStatus } = p;
  const disabled = p.isReadOnlyPreview;

  useEffect(() => {
    if (saveStatus === "saved" && currentDefault !== null) setExpanded(false);
  }, [saveStatus, currentDefault]);

  const statusText = useMemo(() => {
    if (saveStatus === "saving") return "Saving default…";
    if (saveStatus === "error") return "Something went wrong. Please try again.";
    if (saveStatus === "saved" && currentDefault !== null) {
      return `Default saved · ${LEVEL_SHORT_LABEL[currentDefault]}`;
    }
    if (saveStatus === "saved") return "Default cleared.";
    if (currentDefault !== null) return `Default active · ${LEVEL_SHORT_LABEL[currentDefault]}`;
    return null;
  }, [saveStatus, currentDefault]);

  const currentOption = LEVEL_OPTIONS.find((o) => o.level === currentDefault);

  return (
    <Animated.View layout={LinearTransition.springify().damping(20)} style={st.autoCard}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`What's ${p.selectedChildFirstName}'s usual participation level?`}
        style={({ pressed }) => [st.autoHeader, pressed && { opacity: 0.7 }]}
      >
        <View style={st.autoIcon}>
          <Text style={{ fontSize: 18 }}>{currentOption ? currentOption.emoji : "✨"}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={st.autoQuestion} maxFontSizeMultiplier={1.4}>
            {`What's ${p.selectedChildFirstName}'s usual participation level?`}
          </Text>
          {!expanded ? (
            <Text style={st.autoSub} maxFontSizeMultiplier={1.4}>
              {currentOption
                ? `${currentOption.emoji} ${LEVEL_SHORT_LABEL[currentDefault!]} · Default active`
                : "Not set · Tap to set a default for new activities"}
            </Text>
          ) : null}
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={Garden.muted} />
      </Pressable>

      {expanded ? (
        <Animated.View entering={FadeIn.duration(180)} style={{ gap: 12 }}>
          <Text style={st.autoDesc}>Saves immediately and pre-fills new activities.</Text>
          <LevelPicker
            value={currentDefault}
            disabled={disabled || saveStatus === "saving"}
            onChange={(level) => {
              if (disabled) return;
              if (level === null) {
                if (currentDefault !== null) void fb.setDefault(null);
              } else if (level !== currentDefault) {
                void fb.setDefault(level);
              }
            }}
          />
          {currentDefault !== null && saveStatus !== "saving" && !disabled ? (
            <Pressable
              onPress={() => void fb.setDefault(null)}
              hitSlop={12}
              accessibilityRole="button"
              style={{ alignSelf: "flex-start" }}
            >
              <Text style={st.autoClear}>Clear default</Text>
            </Pressable>
          ) : null}
          {statusText ? (
            <Text
              style={[st.autoStatus, saveStatus === "error" && { color: Garden.danger }]}
              accessibilityLiveRegion="polite"
            >
              {statusText}
            </Text>
          ) : null}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

// ─── Progress strip ──────────────────────────────────────────────────────────
export function PrefsProgress({ p }: { p: ActivityPreferences }) {
  const total = p.visibleActivities.length;
  if (total === 0) return null;
  const done = p.setCount;
  const all = done === total;
  return (
    <View style={st.progress}>
      <View style={{ flex: 1 }}>
        <HandNote size={17} color={all ? Garden.sageDeep : "#7a5a00"}>
          {all ? "all set 🌿" : `${done} of ${total} set`}
        </HandNote>
      </View>
      {total <= 8 ? (
        <SeedProgress
          done={done}
          total={total}
          doneFlags={p.visibleActivities.map((a) => p.prefFor(a.id).level != null)}
        />
      ) : (
        <View
          style={st.bar}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`${done} of ${total} set`}
          accessibilityValue={{ min: 0, max: total, now: done }}
        >
          <View style={[st.barFill, { width: `${(done / total) * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

// ─── Activity card ───────────────────────────────────────────────────────────
const BADGE_TINT: Record<ActivityPrefBadgeState, GardenTint> = {
  not_set: "peach",
  pre_filled: "sage",
  selected: "butter",
  saved: "mint",
};

export function ActivityCard({
  act,
  index,
  p,
}: {
  act: Activity;
  index: number;
  p: ActivityPreferences;
}) {
  const reduce = useReducedMotion();
  const pref = p.prefFor(act.id);
  const snapshot = p.snapshotFor(act.id);
  const foodsExpanded = p.expandedFoods.has(act.id);
  const showFoods = act.includes_food && act.activity_foods.length > 0;
  const badgeState = getActivityPrefBadgeState(
    pref,
    snapshot,
    p.savedActivityIds.has(act.id),
    p.currentDefault,
  );
  const selectedOption = LEVEL_OPTIONS.find((o) => o.level === pref.level);
  const dateLabel = act.activity_date
    ? new Date(act.activity_date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.delay(Math.min(index, 5) * 60).springify().damping(18)}
      layout={reduce ? undefined : LinearTransition.springify().damping(20)}
      style={st.card}
    >
      {act.cover_image_url ? (
        <Image
          source={{ uri: act.cover_image_url }}
          style={st.cover}
          contentFit="cover"
          transition={200}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[st.cover, st.coverPlaceholder]}>
          <Text style={{ fontSize: 32 }}>🎨</Text>
        </View>
      )}
      <View style={st.badgePos} pointerEvents="none">
        <Pill tint={BADGE_TINT[badgeState]} style={st.badge}>
          {badgeState === "saved" ? `✓ ${ACTIVITY_PREF_BADGE_LABELS[badgeState]}` : ACTIVITY_PREF_BADGE_LABELS[badgeState]}
        </Pill>
      </View>

      <View style={st.cardBody}>
        <View style={{ gap: 4 }}>
          <Display size={20} numberOfLines={3}>
            {act.title}
          </Display>
          {dateLabel ? (
            <View style={st.dateRow}>
              <Ionicons name="calendar-outline" size={13} color={Garden.sageDeep} />
              <Text style={st.date} maxFontSizeMultiplier={1.3}>
                {dateLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {act.description ? (
          <Text style={st.desc} maxFontSizeMultiplier={1.4}>
            {act.description}
          </Text>
        ) : null}

        {showFoods ? (
          <View style={{ gap: 8 }}>
            <PressableScale
              pressedScale={0.98}
              haptics="select"
              onPress={() => p.toggleFoods(act.id)}
              accessibilityState={{ expanded: foodsExpanded }}
              accessibilityLabel={
                foodsExpanded
                  ? "Hide ingredients"
                  : `${act.activity_foods.length} food item${act.activity_foods.length === 1 ? "" : "s"}. Show ingredients and allergens`
              }
              style={st.foodToggle}
            >
              <Ionicons name="restaurant-outline" size={16} color={Garden.sageDeep} />
              <Text style={st.foodToggleLabel}>
                {foodsExpanded
                  ? "Hide ingredients"
                  : `${act.activity_foods.length} food item${act.activity_foods.length === 1 ? "" : "s"}`}
              </Text>
              {!foodsExpanded && act.activity_foods.some((f) => f.allergens) ? (
                <Pill tint="coral">⚠️ allergens</Pill>
              ) : null}
              <Ionicons
                name={foodsExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={Garden.muted}
                style={{ marginLeft: "auto" }}
              />
            </PressableScale>

            {foodsExpanded ? (
              <Animated.View entering={reduce ? undefined : FadeIn.duration(200)} style={st.foodList}>
                {act.activity_foods.map((food) => (
                  <View key={food.id} style={{ gap: 4 }}>
                    <View style={st.foodItemHead}>
                      <Text style={st.foodName}>{food.name}</Text>
                      {food.allergens ? <Pill tint="coral">{`⚠️ ${food.allergens}`}</Pill> : null}
                    </View>
                    {food.activity_ingredients.length > 0 ? (
                      <Text style={st.ingredients}>
                        {food.activity_ingredients.map((ig) => ig.name).join(", ")}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </Animated.View>
            ) : null}
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
          <Text style={st.levelHeading}>Participation</Text>
          <LevelPicker value={pref.level} onChange={(level) => p.setPref(act.id, { level })} />
          {selectedOption ? (
            <Animated.Text key={selectedOption.level} entering={FadeIn.duration(160)} style={st.levelSubtitle}>
              {selectedOption.label}
            </Animated.Text>
          ) : null}
        </View>

        {pref.level !== null ? (
          <Animated.View entering={reduce ? undefined : FadeIn.duration(180)}>
            <GardenField
              boxed
              multiline
              numberOfLines={3}
              placeholder="Optional notes (e.g. oat milk instead of dairy)"
              value={pref.notes}
              onChangeText={(text) => p.setPref(act.id, { notes: text })}
              accessibilityLabel={`Notes for ${act.title}`}
              containerStyle={{ minHeight: 76 }}
              style={{ fontSize: 14 }}
            />
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ─── Save bar ────────────────────────────────────────────────────────────────
export function SaveBar({
  p,
  onSave,
  bottomInset,
}: {
  p: ActivityPreferences;
  onSave: () => void;
  bottomInset: number;
}) {
  if (p.visibleActivities.length === 0) return null;
  const n = p.unsavedCount;
  return (
    <View style={[st.footer, { paddingBottom: Math.max(bottomInset, Platform.OS === "ios" ? 20 : 14) }]}>
      {p.canSave ? (
        <Animated.View entering={FadeIn.duration(160)} style={st.unsaved}>
          <Ionicons name="information-circle-outline" size={16} color="#b45309" />
          <Text style={st.unsavedText} maxFontSizeMultiplier={1.4}>
            {p.hasFoodActivities
              ? "Tap Save Preferences below, then Confirm and Save on the review sheet."
              : "Tap Save Preferences below to keep your selections."}
          </Text>
        </Animated.View>
      ) : null}
      {p.saveStatus === "error" ? (
        <Text style={st.saveError} accessibilityRole="alert">
          Something went wrong. Please try again.
        </Text>
      ) : null}
      <GardenButton
        label={p.canSave && n > 0 ? `Save Preferences (${n})` : "Save Preferences"}
        tone="coral"
        fullWidth
        loading={p.saveStatus === "saving"}
        loadingLabel="Saving…"
        success={p.saveStatus === "saved"}
        successLabel="Saved ✓"
        disabled={!p.canSave && p.saveStatus !== "saved"}
        onPress={onSave}
      />
    </View>
  );
}

// ─── Whole-screen states ─────────────────────────────────────────────────────
export function PrefsSkeleton() {
  return (
    <View style={{ paddingHorizontal: GUTTER, gap: 16 }} accessible accessibilityLabel="Loading activities">
      <View style={{ flexDirection: "row", gap: 10, paddingVertical: 8 }}>
        <GardenSkeleton width={110} height={48} radius={GardenRadii.pill} />
        <GardenSkeleton width={110} height={48} radius={GardenRadii.pill} />
      </View>
      <GardenSkeleton width="100%" height={84} radius={GardenRadii.md} />
      {[0, 1].map((i) => (
        <View key={i} style={[st.card, { padding: 0 }]}>
          <GardenSkeleton width="100%" height={130} radius={0} />
          <View style={{ padding: 16, gap: 10 }}>
            <GardenSkeleton width="60%" height={20} />
            <GardenSkeleton width="40%" height={13} />
            <GardenSkeleton width="100%" height={64} radius={GardenRadii.sm} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function PrefsError({ fb }: { fb: PreferencesFeedback }) {
  return (
    <View style={{ paddingHorizontal: GUTTER, paddingTop: 8 }}>
      <GardenErrorCard
        title="We couldn't load activities"
        onRetry={() => void fb.retryLoad()}
        retrying={fb.retrying}
      />
    </View>
  );
}

export function PrefsEmpty({ p }: { p: ActivityPreferences }) {
  if (p.children.length === 0) {
    return <GardenEmpty emoji="👨‍👩‍👧" tint="sky" title="No children found" />;
  }
  if (p.activitiesCount === 0) {
    return (
      <GardenEmpty
        emoji="🗓️"
        tint="mint"
        title="No activities yet"
        body="Check back when activities are published."
      />
    );
  }
  return (
    <GardenEmpty
      emoji="🌱"
      tint="butter"
      title="No activities for your scheduled days"
      body="Activities are shown based on your paid enrollment dates."
    />
  );
}

const st = StyleSheet.create({
  chips: { flexDirection: "row", gap: 10, paddingHorizontal: GUTTER, paddingVertical: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  chipActive: { backgroundColor: GardenTints.sage.bg, borderColor: Garden.sage },
  chipName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  dot: { width: 9, height: 9, borderRadius: 5 },

  actionCard: {
    borderRadius: GardenRadii.md,
    borderWidth: 1.5,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    padding: 14,
    gap: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: GardenRadii.sm,
    backgroundColor: "rgba(254, 243, 199, 0.7)",
    borderWidth: 1,
    borderColor: "#fde68a",
    padding: 12,
    minHeight: MIN_TAP,
  },
  actionTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: "#78350f" },
  actionBody: { fontFamily: GardenFonts.body, fontSize: 13, lineHeight: 18, color: "#92400e" },

  foodSummary: { ...gardenCard, borderRadius: GardenRadii.md, padding: 14, gap: 12 },
  foodHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  foodIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fffbeb",
    alignItems: "center",
    justifyContent: "center",
  },
  foodTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14.5, color: Garden.ink },
  foodSub: { fontFamily: GardenFonts.body, fontSize: 12, color: Garden.muted, marginTop: 1 },
  foodBlock: { gap: 3 },
  foodLabel: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11.5,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  foodValue: { fontFamily: GardenFonts.bodySemi, fontSize: 14, color: Garden.ink, lineHeight: 19 },

  levelRow: { flexDirection: "row", gap: 8 },
  levelTile: {
    flex: 1,
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: GardenRadii.sm,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  levelTileActive: { borderColor: Garden.sage, backgroundColor: GardenTints.sage.bg, borderWidth: 2 },
  levelEmoji: { fontSize: 20 },
  levelLabel: { fontFamily: GardenFonts.bodyBold, fontSize: 13, color: Garden.soft },
  levelLabelActive: { fontFamily: GardenFonts.bodyHeavy, color: Garden.sageDeep },
  levelCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Garden.sage,
    alignItems: "center",
    justifyContent: "center",
  },

  autoCard: {
    backgroundColor: GardenTints.sage.bg,
    borderRadius: GardenRadii.md,
    borderWidth: 1.5,
    borderColor: "#cfe0d3",
    padding: 14,
    gap: 12,
  },
  autoHeader: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: MIN_TAP },
  autoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  autoQuestion: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14.5, color: Garden.ink, lineHeight: 19 },
  autoSub: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.soft, lineHeight: 17 },
  autoDesc: { fontFamily: GardenFonts.body, fontSize: 13, color: Garden.soft, lineHeight: 18 },
  autoClear: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 13,
    color: Garden.soft,
    textDecorationLine: "underline",
  },
  autoStatus: { fontFamily: GardenFonts.bodyHeavy, fontSize: 12.5, color: Garden.sageDeep },

  progress: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 2 },
  bar: {
    width: 120,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(43,42,38,0.08)",
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 5, backgroundColor: Garden.sage },

  card: { ...gardenCard, borderRadius: GardenRadii.card, overflow: "hidden" },
  cover: { width: "100%", height: 130 },
  coverPlaceholder: { backgroundColor: Garden.lav, alignItems: "center", justifyContent: "center" },
  badgePos: { position: "absolute", top: 12, right: 12 },
  badge: { paddingHorizontal: 11, paddingVertical: 5 },
  cardBody: { padding: 16, gap: 14 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  date: { fontFamily: GardenFonts.bodyBold, fontSize: 13, color: Garden.sageDeep },
  desc: { fontFamily: GardenFonts.body, fontSize: 14, color: Garden.soft, lineHeight: 20 },
  foodToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: MIN_TAP,
    paddingHorizontal: 12,
    borderRadius: GardenRadii.sm,
    backgroundColor: "#f7f0e4",
  },
  foodToggleLabel: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13.5, color: Garden.ink },
  foodList: { gap: 10, paddingHorizontal: 4 },
  foodItemHead: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  foodName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.ink },
  ingredients: { fontFamily: GardenFonts.body, fontSize: 13, color: Garden.soft, lineHeight: 18 },
  levelHeading: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.ink },
  levelSubtitle: { fontFamily: GardenFonts.bodySemi, fontSize: 13, color: Garden.soft, lineHeight: 18 },

  footer: {
    paddingHorizontal: GUTTER,
    paddingTop: 12,
    gap: 10,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
  unsaved: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: GardenRadii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  unsavedText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 13, color: "#92400e", lineHeight: 18 },
  saveError: { fontFamily: GardenFonts.bodySemi, fontSize: 12.5, color: Garden.danger, textAlign: "center" },
});
