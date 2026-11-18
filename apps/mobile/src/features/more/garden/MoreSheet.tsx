// Garden "More" sheet for the parent tabs: who you are, the school + community
// destinations as tactile tiles (with live nudges), and account links as rows.
// Same destinations and routes as the old MoreMenuSheet, plus Feedback.
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter, useSegments } from "expo-router";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { forwardRef, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeInDown, ZoomIn, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Display,
  Garden,
  GardenAvatar,
  GardenFonts,
  GardenRadii,
  GardenTints,
  HandNote,
  MIN_TAP,
  PressableScale,
  gardenCard,
  gardenSheetChrome,
  useToast,
  type GardenTint,
} from "@/components/garden";
import { notifyError } from "@/lib/discord";
import { useMoreMenu } from "../useMoreMenu";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type MoreItem = {
  label: string;
  icon: IoniconName;
  tint: GardenTint;
  /** Route pushed on tap. */
  route?: string;
  /** External page opened in the in-app browser. */
  url?: string;
  /** Tab route name used to mark "you're here". */
  routeName?: string;
};

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
  const toast = useToast();
  const reduce = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const me = useMoreMenu();
  const reload = me.reload;
  // Grid cell widths come from the measured content width (no % rounding gaps).
  const [gridW, setGridW] = useState(0);
  const w2 = gridW > 0 ? (gridW - GAP) / 2 : undefined;
  const w3 = gridW > 0 ? (gridW - GAP * 2) / 3 : undefined;

  // Re-key the content on each present so tiles stagger in every time.
  const [presentKey, setPresentKey] = useState(0);
  const openRef = useRef(false);

  const here = segments[0] === "(tabs)" ? (segments[1] ?? null) : null;

  const openUrl = useCallback(
    async (url: string) => {
      try {
        await openBrowserAsync(url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });
      } catch (e) {
        void notifyError("more-menu-browser", e);
        toast.show({
          tone: "error",
          title: "Couldn't open the page",
          message: "Check your connection and try again.",
          action: { label: "Retry", onPress: () => void openUrlRef.current?.(url) },
        });
      }
    },
    [toast],
  );
  const openUrlRef = useRef<typeof openUrl | null>(null);
  useEffect(() => {
    openUrlRef.current = openUrl;
  }, [openUrl]);

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
          <SectionTitle>School</SectionTitle>
          <View style={s.grid2}>
            {SCHOOL.map((item, i) => {
              const due = item.routeName === "tuition" ? me.tuitionDue : 0;
              return (
                <Animated.View key={item.label} entering={enter(i)} style={{ width: w2, flexGrow: w2 ? 0 : 1 }}>
                  <WideTile item={item} here={here === item.routeName} due={due} onPress={() => onItemPress(item)} />
                </Animated.View>
              );
            })}
          </View>

          {/* ── Community ──────────────────────────────────────── */}
          <SectionTitle>Community</SectionTitle>
          <View style={s.grid3}>
            {COMMUNITY.map((item, i) => (
              <Animated.View key={item.label} entering={enter(SCHOOL.length + i)} style={{ width: w3 ?? "31%" }}>
                <TallTile item={item} here={here === item.routeName} onPress={() => onItemPress(item)} />
              </Animated.View>
            ))}
          </View>

          {/* ── Account ────────────────────────────────────────── */}
          <SectionTitle>Account</SectionTitle>
          <Animated.View entering={enter(SCHOOL.length + COMMUNITY.length)} style={s.listCard}>
            {ACCOUNT.map((item, i) => (
              <View key={item.label}>
                {i > 0 && <View style={s.divider} />}
                <ListRow item={item} here={here === item.routeName} onPress={() => onItemPress(item)} />
              </View>
            ))}
          </Animated.View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

function SectionTitle({ children }: { children: string }) {
  return (
    <Display size={18} style={s.sectionTitle}>
      {children}
    </Display>
  );
}

function IconSquircle({ item, size }: { item: MoreItem; size: number }) {
  const t = GardenTints[item.tint];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.36,
        backgroundColor: t.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={item.icon} size={Math.round(size * 0.5)} color={t.fg} />
    </View>
  );
}

function HereDot() {
  return <View style={s.hereDot} accessibilityElementsHidden importantForAccessibility="no" />;
}

function hereLabel(label: string, here: boolean) {
  return here ? `${label}, current page` : label;
}

function WideTile({
  item,
  here,
  due,
  onPress,
}: {
  item: MoreItem;
  here: boolean;
  due: number;
  onPress: () => void;
}) {
  const label = due > 0 ? `${item.label}, ${due} ${due === 1 ? "payment" : "payments"} due` : item.label;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={hereLabel(label, here)}
      accessibilityState={{ selected: here }}
      style={[s.tile, s.wideTile, here && s.tileHere]}
    >
      <IconSquircle item={item} size={42} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={s.tileLabel} numberOfLines={2} maxFontSizeMultiplier={1.3}>
          {item.label}
        </Text>
        {due > 0 && (
          <Animated.View entering={ZoomIn.springify()} style={s.duePill}>
            <Text style={s.duePillText} maxFontSizeMultiplier={1.2} numberOfLines={1}>
              {due} due
            </Text>
          </Animated.View>
        )}
      </View>
      {here && <HereDot />}
    </PressableScale>
  );
}

function TallTile({ item, here, onPress }: { item: MoreItem; here: boolean; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={hereLabel(item.label, here)}
      accessibilityState={{ selected: here }}
      style={[s.tile, s.tallTile, here && s.tileHere]}
    >
      <IconSquircle item={item} size={44} />
      <Text style={[s.tileLabel, { textAlign: "center" }]} numberOfLines={2} maxFontSizeMultiplier={1.3}>
        {item.label}
      </Text>
      {here && <HereDot />}
    </PressableScale>
  );
}

function ListRow({ item, here, onPress }: { item: MoreItem; here: boolean; onPress: () => void }) {
  const external = !!item.url;
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={onPress}
      accessibilityRole={external ? "link" : "button"}
      accessibilityLabel={hereLabel(external ? `${item.label}, opens in browser` : item.label, here)}
      accessibilityState={{ selected: here }}
      style={s.row}
    >
      <IconSquircle item={item} size={36} />
      <Text style={s.rowLabel} numberOfLines={1} maxFontSizeMultiplier={1.35}>
        {item.label}
      </Text>
      {here && <Text style={s.hereText}>you're here</Text>}
      <Ionicons name={external ? "open-outline" : "chevron-forward"} size={external ? 17 : 18} color={Garden.muted} />
    </PressableScale>
  );
}

const GAP = 10;

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
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  grid3: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  tile: {
    ...gardenCard,
    borderRadius: GardenRadii.md,
    borderWidth: 1.5,
  },
  tileHere: {
    borderColor: Garden.sage,
    borderWidth: 2,
  },
  wideTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 70,
  },
  tallTile: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 14,
    minHeight: 100,
  },
  tileLabel: {
    fontFamily: GardenFonts.bodyBold,
    fontSize: 14,
    lineHeight: 17,
    color: Garden.ink,
  },
  duePill: {
    alignSelf: "flex-start",
    backgroundColor: Garden.coralDeep,
    borderRadius: GardenRadii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  duePillText: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11,
    color: Garden.white,
  },
  hereDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Garden.sage,
  },
  listCard: {
    ...gardenCard,
    borderRadius: GardenRadii.md,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 8,
  },
  rowLabel: {
    flex: 1,
    fontFamily: GardenFonts.bodyBold,
    fontSize: 15,
    color: Garden.ink,
  },
  hereText: {
    fontFamily: GardenFonts.hand,
    fontSize: 15,
    color: Garden.sageDeep,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Garden.line,
    marginLeft: 56,
  },
});
