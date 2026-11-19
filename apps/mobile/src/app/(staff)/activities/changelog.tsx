// Staff activity "Change History" — Garden timeline of who changed what.
import { Garden, GardenEmpty, GardenErrorCard, GardenScreenHero, GardenSkeleton, useRefreshFeedback } from "@/components/garden";
import { floatingTabBarStyle } from "@/constants/theme";
import { GUTTER, LogEntry } from "@/features/staff-activities/garden/ActivitiesParts";
import { useActivityDetail } from "@/features/staff-activities/useActivityDetail";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function ActivityChangelogScreen() {
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const d = useActivityDetail(activityId, { withStudents: false });
  const fb = useRefreshFeedback(d.reload);
  const log = d.activity?.change_log ?? [];

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top", "left", "right"]}>
      <GardenScreenHero title="Change History" fallbackHref="/(staff)/activities" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 6, paddingBottom: 32 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />}
      >
        {d.loading ? (
          <View style={{ gap: 14 }} accessibilityLabel="Loading history">
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ flexDirection: "row", gap: 12 }}>
                <GardenSkeleton width={38} height={38} radius={19} />
                <GardenSkeleton width="80%" height={64} radius={18} />
              </View>
            ))}
          </View>
        ) : d.error ? (
          <GardenErrorCard title="We couldn't load the history" onRetry={() => void fb.retry()} retrying={fb.retrying} />
        ) : log.length === 0 ? (
          <GardenEmpty emoji="🕰️" title="No history yet" tint="sky" />
        ) : (
          log.map((entry, i) => <LogEntry key={entry.id} entry={entry} last={i === log.length - 1} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
