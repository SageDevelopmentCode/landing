// Home "Newsletters" rail, shared by the parent and staff Homes: the latest
// published issues as cover cards. Tapping one opens it (copying a locked
// issue's password first) via useNewsletterActions().
import {
  Garden,
  GardenFonts,
  GardenSectionHeader,
  GardenSkeleton,
  GardenSpace,
  PressableScale,
  gardenCard,
} from "@/components/garden";
import type { ParentNewsletterListItem } from "@/lib/newsletters-actions";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNewsletterActions } from "./useNewsletterActions";

const GUTTER = GardenSpace.gutter;

export function NewslettersHomeRail({
  items,
  loading,
  onViewAll,
}: {
  items: ParentNewsletterListItem[];
  loading: boolean;
  onViewAll: () => void;
}) {
  const actions = useNewsletterActions();
  if (!loading && items.length === 0) return null;

  return (
    <View style={{ marginBottom: 26 }}>
      <GardenSectionHeader title="Newsletters" onAction={onViewAll} />
      {loading ? (
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: GUTTER }}>
          {[0, 1].map((i) => (
            <GardenSkeleton key={i} width={170} height={150} radius={22} />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: GUTTER, paddingBottom: 6 }}
        >
          {items.map((item) => (
            <PressableScale
              key={item.id}
              accessibilityRole="link"
              accessibilityLabel={`${item.title}, ${item.week_range}. Opens in browser`}
              onPress={() => void actions.open(item)}
              style={nl.card}
            >
              <View style={nl.image}>
                {item.cover_image_url ? (
                  <Image source={{ uri: item.cover_image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Text style={{ fontSize: 28 }}>📰</Text>
                )}
              </View>
              <View style={{ padding: 11, gap: 2 }}>
                <Text style={nl.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={nl.week} numberOfLines={1}>
                  {item.week_range}
                </Text>
                {item.access_password ? (
                  <View style={nl.pw}>
                    <Ionicons name="lock-closed-outline" size={11} color={Garden.soft} />
                    <Text style={nl.week}>Password: </Text>
                    <Text selectable style={[nl.week, { fontFamily: GardenFonts.bodyHeavy, color: Garden.ink }]}>
                      {item.access_password}
                    </Text>
                  </View>
                ) : null}
              </View>
            </PressableScale>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const nl = StyleSheet.create({
  card: { width: 170, ...gardenCard, borderRadius: 22, overflow: "hidden" },
  image: { aspectRatio: 16 / 9, width: "100%", backgroundColor: Garden.peach, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: Garden.ink, lineHeight: 18 },
  week: { fontFamily: GardenFonts.body, fontSize: 11.5, color: Garden.soft },
  pw: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
});
