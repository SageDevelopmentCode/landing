// Standard hero for a pushed parent screen: 44pt back button, Display title
// and an optional right-hand slot (filter, actions). No eyebrow (rule 7).
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Display } from "./GardenBits";
import { GardenIconButton } from "./GardenIconButton";
import { GardenSpace } from "./gardenTheme";

export function GardenScreenHero({
  title,
  onBack,
  backLabel = "Back",
  right,
  size = 32,
  style,
  fallbackHref = "/(tabs)/home",
}: {
  title: string;
  /** Override the back press (e.g. to confirm discarding changes). */
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** Where Back goes when there's no history (staff screens pass a staff route). */
  fallbackHref?: string;
}) {
  const goBack = useGardenGoBack(fallbackHref);
  return (
    <View style={[styles.hero, style]}>
      <GardenIconButton icon="chevron-back" label={backLabel} onPress={onBack ?? goBack} />
      <Display size={title.length > 18 ? size - 6 : size} numberOfLines={2} style={{ flex: 1 }}>
        {title}
      </Display>
      {right ?? null}
    </View>
  );
}

/** Default back behaviour, for screens that wrap `onBack`. */
export function useGardenGoBack(fallbackHref: string = "/(tabs)/home") {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallbackHref as any);
  };
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: GardenSpace.gutter,
    paddingTop: 10,
    paddingBottom: 10,
  },
});
