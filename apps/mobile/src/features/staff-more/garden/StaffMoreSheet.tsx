// Garden "More" sheet for the staff tabs: who you are (name + role), the
// super-admin tools on their own lavender panel, then Work / Classroom /
// Community tiles and Account rows. Same destinations, routes and role gate as
// the old StaffMoreMenuSheet. Tiles are shared with the parent sheet.
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
  GardenRadii,
  GardenTints,
  HandNote,
  MIN_TAP,
  Pill,
  PressableScale,
  gardenSheetChrome,
} from "@/components/garden";
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
} from "@/features/more/garden/MoreTiles";
import { useStaffRole } from "@/features/staff-shared/useStaffRole";
import { roleLabel } from "@/features/staff-home/staffHomeUtils";
import { useStaffMoreMenu } from "../useStaffMoreMenu";

const ADMIN: MoreItem[] = [
  { label: "Impersonate Parent", icon: "eye-outline", tint: "peach", route: "/impersonate-parent" },
  { label: "Teacher IDs", icon: "card-outline", tint: "sage", route: "/(staff)/teacher-ids", routeName: "teacher-ids" },
  { label: "Campus Tours", icon: "map-outline", tint: "coral", route: "/(staff)/admin/tours", routeName: "admin/tours" },
  {
    label: "Employee Hours",
    icon: "people-outline",
    tint: "sky",
    route: "/(staff)/admin/employee-hours",
    routeName: "admin/employee-hours",
  },
];

const WORK: MoreItem[] = [
  { label: "Feed", icon: "newspaper-outline", tint: "sky", route: "/(staff)/feed", routeName: "feed" },
  { label: "Calendar", icon: "calendar-outline", tint: "lav", route: "/(staff)/calendar", routeName: "calendar" },
  { label: "Hours", icon: "time-outline", tint: "mint", route: "/(staff)/hours", routeName: "hours" },
  { label: "Payroll", icon: "cash-outline", tint: "sage", route: "/(staff)/payroll", routeName: "payroll" },
];

const CLASSROOM: MoreItem[] = [
  { label: "Forms & Docs", icon: "document-text-outline", tint: "butter", route: "/(staff)/forms", routeName: "forms" },
  { label: "Inventory", icon: "cube-outline", tint: "peach", route: "/(staff)/inventory", routeName: "inventory" },
  { label: "Care Log", icon: "medkit-outline", tint: "coral", route: "/(staff)/care-log", routeName: "care-log" },
  { label: "Activities", icon: "ribbon-outline", tint: "lav", route: "/(staff)/activities", routeName: "activities" },
];

const COMMUNITY: MoreItem[] = [
  { label: "Newsletter", icon: "newspaper-outline", tint: "lav", route: "/(staff)/newsletters", routeName: "newsletters" },
  { label: "Photos", icon: "images-outline", tint: "peach", route: "/(staff)/photos", routeName: "photos" },
  {
    label: "Notify Parents",
    icon: "notifications-outline",
    tint: "butter",
    route: "/(staff)/notifications",
    routeName: "notifications",
  },
];

const SETTINGS: MoreItem = {
  label: "Settings",
  icon: "settings-outline",
  tint: "sage",
  route: "/(staff)/settings",
  routeName: "settings",
};

const ACCOUNT: MoreItem[] = [
  { label: "Privacy", icon: "shield-checkmark-outline", tint: "sage", url: "https://sagefield.co/privacy" },
  { label: "Terms", icon: "document-outline", tint: "sky", url: "https://sagefield.co/terms" },
  SETTINGS,
];

/** Child screens that belong to a More destination ("you're here" on the parent tile). */
const HERE_ALIASES: Record<string, string> = {
  "payroll-history": "payroll",
  "edit-profile": "settings",
};

/** Every staff tab route reached through More (the tab bar lights up "More" on these). */
export const STAFF_MORE_ROUTE_NAMES: ReadonlySet<string> = new Set([
  ...[...ADMIN, ...WORK, ...CLASSROOM, ...COMMUNITY, ...ACCOUNT].flatMap((i) => (i.routeName ? [i.routeName] : [])),
  ...Object.keys(HERE_ALIASES),
]);

type Props = {
  /** Called with the sheet index (-1 = closed). */
  onChange?: (index: number) => void;
};

const PANEL_PAD = 10;

export const StaffMoreSheet = forwardRef<BottomSheetModal, Props>(function StaffMoreSheet({ onChange }, ref) {
  const router = useRouter();
  const segments = useSegments() as string[];
  const reduce = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { role, isSuperAdmin } = useStaffRole();
  const me = useStaffMoreMenu();
  const reload = me.reload;
  const openUrl = useOpenUrl("staff-more-menu-browser");

  // Grid cell widths come from the measured content width, floored so pixel
  // rounding never pushes the last tile onto a new row.
  const [gridW, setGridW] = useState(0);
  const w2 = gridW > 0 ? Math.floor((gridW - MORE_GAP) / 2) : undefined;
  const w3 = gridW > 0 ? Math.floor((gridW - MORE_GAP * 2) / 3) : undefined;
  const wAdmin = gridW > 0 ? Math.floor((gridW - PANEL_PAD * 2 - MORE_GAP) / 2) : undefined;

  // Re-key the content on each present so tiles stagger in every time.
  const [presentKey, setPresentKey] = useState(0);
  const openRef = useRef(false);

  // "admin/tours" style route names for nested admin screens.
  const rawHere =
    segments[0] === "(staff)"
      ? segments[1] === "admin" && segments[2]
        ? `admin/${segments[2]}`
        : (segments[1] ?? null)
      : null;
  const here = rawHere ? (HERE_ALIASES[rawHere] ?? rawHere) : null;

  const onItemPress = useCallback(
    (item: MoreItem) => {
      (ref as RefObject<BottomSheetModal | null>).current?.dismiss();
      // Already on that screen (not a child of it): just close the sheet.
      if (item.routeName && item.routeName === rawHere) return;
      if (item.url) void openUrl(item.url);
      else if (item.route) router.push(item.route as never);
    },
    [ref, router, openUrl, rawHere],
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
  const enter = (i: number) => (reduce ? undefined : FadeInDown.delay(60 + i * 30).springify().damping(16));

  // Running index so the stagger flows top to bottom across sections.
  const adminCount = isSuperAdmin ? ADMIN.length : 0;
  const workStart = adminCount;
  const classStart = workStart + WORK.length;
  const communityStart = classStart + CLASSROOM.length;
  const accountStart = communityStart + COMMUNITY.length;

  const wideGrid = (items: MoreItem[], start: number, width: number | undefined) =>
    items.map((item, i) => (
      <Animated.View key={item.label} entering={enter(start + i)} style={{ width, flexGrow: width ? 0 : 1 }}>
        <WideTile item={item} here={here === item.routeName} onPress={() => onItemPress(item)} />
      </Animated.View>
    ));

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
            accessibilityLabel={`${name ? `${name}, ` : ""}${role ? `${roleLabel(role)}, ` : ""}open your settings`}
            style={s.header}
          >
            <View style={s.avatarRing}>
              <GardenAvatar name={me.fullName ?? name ?? undefined} uri={me.photoUrl} size={54} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Display size={26} numberOfLines={1}>
                {name ?? "More"}
              </Display>
              <View style={s.metaRow}>
                {role && <Pill tint={isSuperAdmin ? "lav" : "sage"}>{roleLabel(role)}</Pill>}
                <HandNote size={16}>staff tools</HandNote>
              </View>
            </View>
            <View style={s.headerBtn}>
              <Ionicons name="settings-outline" size={20} color={Garden.sageDeep} />
            </View>
          </PressableScale>

          {/* ── Admin (super admin only) ───────────────────────── */}
          {isSuperAdmin && (
            <>
              <View style={s.adminTitleRow}>
                <MoreSectionTitle>Admin</MoreSectionTitle>
                <Ionicons
                  name="shield-half-outline"
                  size={16}
                  color={GardenTints.lav.fg}
                  style={s.adminIcon}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </View>
              <View style={s.adminPanel}>
                <View style={moreTileStyles.grid}>{wideGrid(ADMIN, 0, wAdmin)}</View>
              </View>
            </>
          )}

          {/* ── Work ───────────────────────────────────────────── */}
          <MoreSectionTitle>Work</MoreSectionTitle>
          <View style={moreTileStyles.grid}>{wideGrid(WORK, workStart, w2)}</View>

          {/* ── Classroom ──────────────────────────────────────── */}
          <MoreSectionTitle>Classroom</MoreSectionTitle>
          <View style={moreTileStyles.grid}>{wideGrid(CLASSROOM, classStart, w2)}</View>

          {/* ── Community ──────────────────────────────────────── */}
          <MoreSectionTitle>Community</MoreSectionTitle>
          <View style={moreTileStyles.grid}>
            {COMMUNITY.map((item, i) => (
              <Animated.View key={item.label} entering={enter(communityStart + i)} style={{ width: w3 ?? "31%" }}>
                <TallTile item={item} here={here === item.routeName} onPress={() => onItemPress(item)} />
              </Animated.View>
            ))}
          </View>

          {/* ── Account ────────────────────────────────────────── */}
          <MoreSectionTitle>Account</MoreSectionTitle>
          <Animated.View entering={enter(accountStart)} style={moreTileStyles.listCard}>
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
    marginBottom: 2,
    minHeight: MIN_TAP,
  },
  avatarRing: {
    borderRadius: 999,
    padding: 3,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  headerBtn: {
    width: MIN_TAP,
    height: MIN_TAP,
    borderRadius: MIN_TAP / 2,
    backgroundColor: GardenTints.sage.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  adminTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  adminIcon: {
    marginTop: 12,
  },
  adminPanel: {
    backgroundColor: GardenTints.lav.bg,
    borderRadius: GardenRadii.md + 4,
    padding: PANEL_PAD,
  },
});
