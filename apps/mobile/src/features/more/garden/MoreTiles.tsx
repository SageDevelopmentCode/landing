// Shared building blocks for the Garden "More" sheets (parent `MoreSheet` and
// staff `StaffMoreSheet`): tactile tiles, account rows, the "you're here"
// marker, and an in-app browser opener that toasts on failure.
import { Ionicons } from "@expo/vector-icons";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import {
  Display,
  Garden,
  GardenFonts,
  GardenRadii,
  GardenTints,
  PressableScale,
  gardenCard,
  gardenPopIn,
  useToast,
  type GardenTint,
} from "@/components/garden";
import { notifyError } from "@/lib/discord";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export type MoreItem = {
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

export const MORE_GAP = 10;

/** Opens an external page in the in-app browser; on failure, an error toast with Retry. */
export function useOpenUrl(tag: string) {
  const toast = useToast();
  const openRef = useRef<((url: string) => Promise<void>) | null>(null);
  const open = useCallback(
    async (url: string) => {
      try {
        await openBrowserAsync(url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });
      } catch (e) {
        void notifyError(tag, e);
        toast.show({
          tone: "error",
          title: "Couldn't open the page",
          message: "Check your connection and try again.",
          action: { label: "Retry", onPress: () => void openRef.current?.(url) },
        });
      }
    },
    [toast, tag],
  );
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  return open;
}

export function MoreSectionTitle({ children }: { children: string }) {
  return (
    <Display size={18} style={s.sectionTitle}>
      {children}
    </Display>
  );
}

export function IconSquircle({ item, size }: { item: MoreItem; size: number }) {
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

export function hereLabel(label: string, here: boolean) {
  return here ? `${label}, current page` : label;
}

/** Icon left, label right. `badge` adds a coral nudge pill ("2 due"). */
export function WideTile({
  item,
  here,
  badge,
  onPress,
}: {
  item: MoreItem;
  here: boolean;
  badge?: { text: string; a11y: string };
  onPress: () => void;
}) {
  const reduce = useReducedMotion();
  const label = badge ? `${item.label}, ${badge.a11y}` : item.label;
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
        {badge && (
          <Animated.View entering={reduce ? undefined : gardenPopIn()} style={s.duePill}>
            <Text style={s.duePillText} maxFontSizeMultiplier={1.2} numberOfLines={1}>
              {badge.text}
            </Text>
          </Animated.View>
        )}
      </View>
      {here && <HereDot />}
    </PressableScale>
  );
}

/** Icon above a centred label, for 3-up rows. */
export function TallTile({ item, here, onPress }: { item: MoreItem; here: boolean; onPress: () => void }) {
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

/** A row inside a `MoreListCard`. External links show an open-in-browser icon. */
export function MoreListRow({ item, here, onPress }: { item: MoreItem; here: boolean; onPress: () => void }) {
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

export function MoreListDivider() {
  return <View style={s.divider} />;
}

export const moreTileStyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MORE_GAP,
  },
  listCard: {
    ...gardenCard,
    borderRadius: GardenRadii.md,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
});

const s = StyleSheet.create({
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
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
