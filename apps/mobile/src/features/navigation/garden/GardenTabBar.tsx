// Garden floating tab bar for the parent tabs.
// - Same geometry as `floatingTabBarStyle`, so every screen's BottomTabInset
//   padding still fits.
// - A sage pill glides behind the active tab; icons pop when they become active.
// - Press semantics match the stock bar (tabPress / tabLongPress events), so
//   re-tapping a tab still pops its stack / scrolls to top, and the More tab's
//   listener still opens the sheet.
// - Honors `tabBarStyle: { display: "none" }` set via options or setOptions by
//   sliding the bar away.
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  CountBadge,
  Garden,
  GardenFonts,
  GardenSprings,
  GardenTints,
  PressableScale,
  gardenShadow,
  haptic,
} from "@/components/garden";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type TabDef = { name: string; label: string; active: IoniconName; inactive: IoniconName };

const TABS: TabDef[] = [
  { name: "home", label: "Home", active: "home", inactive: "home-outline" },
  { name: "feed", label: "Feed", active: "newspaper", inactive: "newspaper-outline" },
  { name: "calendar", label: "Calendar", active: "calendar", inactive: "calendar-outline" },
  { name: "messages", label: "Messages", active: "chatbubbles", inactive: "chatbubbles-outline" },
  {
    name: "more",
    label: "More",
    active: "ellipsis-horizontal-circle",
    inactive: "ellipsis-horizontal-circle-outline",
  },
];

const BAR_BOTTOM = Platform.select({ ios: 24, android: 20 }) ?? 20;
const BAR_HEIGHT = 64;
const PAD = 6;

type Props = BottomTabBarProps & {
  /** Unread messages for the Messages badge. */
  unread: number;
  /** The More sheet is open (light up the More tab). */
  moreOpen: boolean;
  /** Hidden tab routes that live under More (light up More while on them). */
  moreRoutes: ReadonlySet<string>;
};

export function GardenTabBar({ state, descriptors, navigation, unread, moreOpen, moreRoutes }: Props) {
  const reduce = useReducedMotion();
  const focused = state.routes[state.index];
  const focusedOptions = descriptors[focused.key]?.options;
  const hidden =
    (StyleSheet.flatten(focusedOptions?.tabBarStyle as StyleProp<ViewStyle>) as ViewStyle | undefined)?.display ===
    "none";

  // Which visible tab looks active.
  const visible = TABS.map((t) => ({ def: t, route: state.routes.find((r) => r.name === t.name) })).filter(
    (t): t is { def: TabDef; route: (typeof state.routes)[number] } => !!t.route,
  );
  const moreIdx = visible.findIndex((t) => t.def.name === "more");
  const focusedIdx = visible.findIndex((t) => t.route.key === focused.key);
  const activeIdx = moreOpen
    ? moreIdx
    : focusedIdx >= 0
      ? focusedIdx
      : moreRoutes.has(focused.name)
        ? moreIdx
        : -1;

  // ── Sliding indicator ──────────────────────────────────────────────────────
  const [rowW, setRowW] = useState(0);
  const slotW = visible.length > 0 ? rowW / visible.length : 0;
  const x = useSharedValue(0);
  const shown = useSharedValue(activeIdx >= 0 ? 1 : 0);
  useEffect(() => {
    if (slotW <= 0) return;
    if (activeIdx >= 0) {
      const target = activeIdx * slotW;
      x.value = reduce || shown.value === 0 ? target : withSpring(target, GardenSprings.gentle);
    }
    shown.value = reduce ? (activeIdx >= 0 ? 1 : 0) : withTiming(activeIdx >= 0 ? 1 : 0, { duration: 160 });
  }, [activeIdx, slotW, reduce, x, shown]);
  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateX: x.value }, { scale: 0.85 + shown.value * 0.15 }],
  }));

  // ── Hide / show ────────────────────────────────────────────────────────────
  const away = useSharedValue(hidden ? 1 : 0);
  useEffect(() => {
    away.value = reduce ? (hidden ? 1 : 0) : withTiming(hidden ? 1 : 0, { duration: 220 });
  }, [hidden, reduce, away]);
  const barStyle = useAnimatedStyle(() => ({
    opacity: 1 - away.value,
    transform: [{ translateY: away.value * (BAR_HEIGHT + BAR_BOTTOM + 16) }],
  }));

  return (
    <Animated.View
      pointerEvents={hidden ? "none" : "box-none"}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
      style={[s.wrap, barStyle]}
    >
      <View style={s.bar} accessibilityRole="tablist">
        <View style={s.row} onLayout={(e: LayoutChangeEvent) => setRowW(e.nativeEvent.layout.width)}>
          {slotW > 0 && (
            <Animated.View pointerEvents="none" style={[s.indicator, { width: slotW }, indicatorStyle]} />
          )}
          {visible.map(({ def, route }, i) => {
            const isFocused = route.key === focused.key;
            const active = i === activeIdx;
            const badge = def.name === "messages" ? unread : 0;
            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (isFocused) haptic.tap();
              else haptic.select();
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };
            const onLongPress = () => navigation.emit({ type: "tabLongPress", target: route.key });
            let a11y = def.label;
            if (badge > 0) a11y += `, ${badge} unread`;
            if (def.name === "more") a11y += ", opens menu";
            return (
              <TabButton
                key={route.key}
                def={def}
                active={active}
                badge={badge}
                reduce={reduce}
                accessibilityLabel={a11y}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

function TabButton({
  def,
  active,
  badge,
  reduce,
  accessibilityLabel,
  onPress,
  onLongPress,
}: {
  def: TabDef;
  active: boolean;
  badge: number;
  reduce: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const pop = useSharedValue(1);
  useEffect(() => {
    if (active && !reduce) {
      pop.value = withSequence(withSpring(1.16, GardenSprings.pop), withSpring(1, GardenSprings.pop));
    }
  }, [active, reduce, pop]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const color = active ? Garden.sageDeep : Garden.muted;

  return (
    <PressableScale
      haptics={false}
      pressedScale={0.9}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={s.tab}
    >
      <Animated.View style={iconStyle}>
        <Ionicons name={active ? def.active : def.inactive} size={23} color={color} />
        {badge > 0 && (
          <View style={s.badge} pointerEvents="none">
            <CountBadge count={badge} />
          </View>
        )}
      </Animated.View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        maxFontSizeMultiplier={1.2}
        style={[s.label, { color, fontFamily: active ? GardenFonts.bodyHeavy : GardenFonts.bodySemi }]}
      >
        {def.label}
      </Text>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: BAR_BOTTOM,
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
    paddingHorizontal: PAD,
    justifyContent: "center",
    ...gardenShadow,
  },
  row: {
    flexDirection: "row",
    height: BAR_HEIGHT - PAD * 2 - 2,
  },
  indicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
    backgroundColor: GardenTints.sage.bg,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: 44,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -12,
  },
});
