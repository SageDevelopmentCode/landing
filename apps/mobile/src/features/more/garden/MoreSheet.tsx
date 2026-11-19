// Garden "More" sheet for the parent tabs: who you are, the school + community
// destinations as tactile tiles (with live nudges), and account links as rows.
// Same destinations and routes as the old MoreMenuSheet, plus Feedback.
// Tiles / rows are shared with the staff sheet (`./MoreTiles`).
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter, useSegments } from "expo-router";
import { forwardRef, useCallback, useRef, useState, type RefObject } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Display,
  Garden,
  GardenAvatar,
  GardenTints,
  HandNote,
  MIN_TAP,
  PressableScale,
  gardenSheetChrome,
} from "@/components/garden";
import { useMoreMenu } from "../useMoreMenu";
import {
  MORE_GAP,
  MoreListDivider,
  MoreListRow,
  MoreSectionTitle,
  TallTile,
  WideTile,
  moreTileStyles,
  useOpenUrl,
  type MoreItem,
} from "./MoreTiles";

const SCHOOL: MoreItem[] = [
  { label: "Children", icon: "people-outline", tint: "sage", route: "/(tabs)/children", routeName: "children" },
  { label: "Attendance", icon: "checkmark-done-outline", tint: "mint", route: "/(tabs)/attendance", routeName: "attendance" },
  { label: "Forms & Docs", icon: "document-text-outline", tint: "butter", route: "/(tabs)/forms", routeName: "forms" },
  { label: "Tuition", icon: "card-outline", tint: "sky", route: "/(tabs)/tuition", routeName: "tuition" },
];

const COMMUNITY: MoreItem[] = [
  { label: "Photos", icon: "images-outline", tint: "peach", route: "/(tabs)/photos", routeName: "photos" },
  { label: "Newsletters", icon: "newspaper-outline", tint: "lav", route: "/(tabs)/newsletters", routeName: "newsletters" },
  { label: "Volunteer", icon: "heart-outline", tint: "coral", route: "/(tabs)/volunteer", routeName: "volunteer" },
  { label: "Activities", icon: "ribbon-outline", tint: "lav", route: "/(tabs)/preferences", routeName: "preferences" },
  { label: "Rewards", icon: "gift-outline", tint: "butter", route: "/(tabs)/rewards", routeName: "rewards" },
];

const SETTINGS: MoreItem = { label: "Settings", icon: "settings-outline", tint: "sage", route: "/(tabs)/settings", routeName: "settings" };

const ACCOUNT: MoreItem[] = [
  { label: "Privacy", icon: "shield-checkmark-outline", tint: "sage", url: "https://sagefield.co/privacy" },
  { label: "Terms", icon: "document-outline", tint: "sky", url: "https://sagefield.co/terms" },
  { label: "Help", icon: "help-circle-outline", tint: "sky", route: "/(tabs)/help", routeName: "help" },
  { label: "Feedback", icon: "chatbox-ellipses-outline", tint: "peach", route: "/(tabs)/feedback", routeName: "feedback" },
  SETTINGS,
];

/** Every tab route the More sheet leads to (used by the tab bar to light up "More"). */
export const MORE_ROUTE_NAMES: ReadonlySet<string> = new Set(
  [...SCHOOL, ...COMMUNITY, ...ACCOUNT].flatMap((i) => (i.routeName ? [i.routeName] : [])),
);

type Props = {
  /** Called with the sheet index (-1 = closed). */
  onChange?: (index: number) => void;
};

export const MoreSheet = forwardRef<BottomSheetModal, Props>(function MoreSheet({ onChange }, ref) {
  const router = useRouter();
  const segments = useSegments() as string[];
  const reduce = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const me = useMoreMenu();
  const reload = me.reload;
  const openUrl = useOpenUrl("more-menu-browser");
  // Grid cell widths come from the measured content width, floored so pixel
  // rounding never pushes the last tile onto a new row.
  const [gridW, setGridW] = useState(0);
  const w2 = gridW > 0 ? Math.floor((gridW - MORE_GAP) / 2) : undefined;
  const w3 = gridW > 0 ? Math.floor((gridW - MORE_GAP * 2) / 3) : undefined;

  // Re-key the content on each present so tiles stagger in every time.
  const [presentKey, setPresentKey] = useState(0);
  const openRef = useRef(false);

  const here = segments[0] === "(tabs)" ? (segments[1] ?? null) : null;

  const onItemPress = useCallback(
    (item: MoreItem) => {
      (ref as RefObject<BottomSheetModal | null>).current?.dismiss();
      if (item.url) void openUrl(item.url);
      else if (item.route) router.push(item.route as never);
    },
    [ref, router, openUrl],
  );

  const handleChange = useCallback(
    (index: number) => {
      const isOpen = index >= 0;
      if (isOpen && !openRef.current) {
        setPresentKey((k) => k + 1);
        void reload();
      }
      openRef.current = isOpen;
      onChange?.(index);
    },
    [onChange, reload],
  );

  const name = me.firstName;
  const enter = (i: number) => (reduce ? undefined : FadeInDown.delay(60 + i * 35).springify().damping(16));

  return (
    <BottomSheetModal
      ref={ref}
      {...gardenSheetChrome}
      enableDynamicSizing
      maxDynamicContentSize={Math.round(height * 0.88)}
      onChange={handleChange}
      onDismiss={() => {
        openRef.current = false;
        onChange?.(-1);
      }}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 12) + 20 }]}
      >
        <View key={presentKey} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
          {/* ── Who you are ─────────────────────────────────────── */}
          <PressableScale
            pressedScale={0.98}
            onPress={() => onItemPress(SETTINGS)}
            accessibilityLabel={`${name ? `${name}, ` : ""}open your account settings`}
            style={s.header}
          >
            <View style={s.avatarRing}>
              <GardenAvatar name={me.fullName ?? name ?? undefined} uri={me.photoUrl} size={54} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Display size={26} numberOfLines={1}>
                {name ?? "More"}
              </Display>
              <HandNote size={17} style={{ marginTop: 2 }}>
                everything else lives here
              </HandNote>
            </View>
            <View style={s.headerBtn}>
              <Ionicons name="settings-outline" size={20} color={Garden.sageDeep} />
            </View>
          </PressableScale>

          {/* ── School ─────────────────────────────────────────── */}
          <MoreSectionTitle>School</MoreSectionTitle>
          <View style={moreTileStyles.grid}>
            {SCHOOL.map((item, i) => {
              const due = item.routeName === "tuition" ? me.tuitionDue : 0;
              const badge =
                due > 0 ? { text: `${due} due`, a11y: `${due} ${due === 1 ? "payment" : "payments"} due` } : undefined;
              return (
                <Animated.View key={item.label} entering={enter(i)} style={{ width: w2, flexGrow: w2 ? 0 : 1 }}>
                  <WideTile item={item} here={here === item.routeName} badge={badge} onPress={() => onItemPress(item)} />
                </Animated.View>
              );
            })}
          </View>

          {/* ── Community ──────────────────────────────────────── */}
          <MoreSectionTitle>Community</MoreSectionTitle>
          <View style={moreTileStyles.grid}>
            {COMMUNITY.map((item, i) => (
              <Animated.View key={item.label} entering={enter(SCHOOL.length + i)} style={{ width: w3 ?? "31%" }}>
                <TallTile item={item} here={here === item.routeName} onPress={() => onItemPress(item)} />
              </Animated.View>
            ))}
          </View>

          {/* ── Account ────────────────────────────────────────── */}
          <MoreSectionTitle>Account</MoreSectionTitle>
          <Animated.View entering={enter(SCHOOL.length + COMMUNITY.length)} style={moreTileStyles.listCard}>
            {ACCOUNT.map((item, i) => (
              <View key={item.label}>
                {i > 0 && <MoreListDivider />}
                <MoreListRow item={item} here={here === item.routeName} onPress={() => onItemPress(item)} />
              </View>
            ))}
          </Animated.View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 6,
    marginBottom: 6,
    minHeight: MIN_TAP,
  },
  avatarRing: {
    borderRadius: 999,
    padding: 3,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  headerBtn: {
    width: MIN_TAP,
    height: MIN_TAP,
    borderRadius: MIN_TAP / 2,
    backgroundColor: GardenTints.sage.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
