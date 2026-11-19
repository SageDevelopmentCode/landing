// Staff Activities — Garden. Data in features/staff-activities/useStaffActivities.ts;
// UI in features/staff-activities/garden/. Edit / Delete appear only on
// activities you created (others' published ones are view-only).
import {
  Garden,
  GardenActionSheet,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenRadii,
  GardenScreenHero,
  GardenSegmented,
  PressableScale,
} from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { ActivitiesSkeleton, ActivityRow, GUTTER } from "@/features/staff-activities/garden/ActivitiesParts";
import { useActivitiesFeedback } from "@/features/staff-activities/garden/useActivitiesFeedback";
import { useStaffActivities, type Filter } from "@/features/staff-activities/useStaffActivities";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTER_LABEL: Record<Filter, string> = { all: "All", published: "Published", drafts: "Drafts" };

export default function StaffActivitiesScreen() {
  const a = useStaffActivities();
  const fb = useActivitiesFeedback(a);

  const empty = a.loading ? (
    <ActivitiesSkeleton />
  ) : a.error ? (
    <View style={{ paddingHorizontal: GUTTER }}>
      <GardenErrorCard title="We couldn't load activities" onRetry={() => void fb.retry()} retrying={fb.retrying} />
    </View>
  ) : (
    <View style={{ paddingHorizontal: GUTTER }}>
      <GardenEmpty
        emoji="🎨"
        tint="peach"
        title={a.activities.length === 0 ? "No activities yet" : `No ${a.filter} activities`}
        actionLabel={a.activities.length === 0 ? "Create your first activity" : "Show all"}
        onAction={a.activities.length === 0 ? a.openCreate : () => a.setFilter("all")}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <GardenScreenHero title="Activities" fallbackHref="/(staff)/home" />
      <View style={{ paddingHorizontal: GUTTER, paddingBottom: 12 }}>
        <GardenSegmented
          accessibilityLabel="Filter activities"
          value={a.filter}
          onChange={a.setFilter}
          options={(["all", "published", "drafts"] as Filter[]).map((f) => ({
            value: f,
            label: a.loading ? FILTER_LABEL[f] : `${FILTER_LABEL[f]} ${a.counts[f]}`,
          }))}
        />
      </View>
      <FlatList
        data={a.loading || a.error ? [] : a.filtered}
        keyExtractor={(x) => x.id}
        renderItem={({ item, index }) => (
          <ActivityRow
            a={item}
            index={index}
            prefs={a.prefCounts[item.id]}
            canManage={a.canManage(item)}
            deleting={!!a.deleting[item.id]}
            onPress={() => a.openDetail(item)}
            onMenu={() => fb.openMenu(item)}
          />
        )}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: BottomTabInset + 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
        }
      />
      <View style={[st.fabWrap, { bottom: BottomTabInset + 16 }]} pointerEvents="box-none">
        <PressableScale haptics="press" onPress={a.openCreate} accessibilityLabel="New Activity" style={st.fab}>
          <Ionicons name="add" size={22} color={Garden.white} />
          <Text style={st.fabText} maxFontSizeMultiplier={1.2}>
            New activity
          </Text>
        </PressableScale>
      </View>
      <GardenActionSheet ref={fb.menuRef} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  fabWrap: { position: "absolute", right: GUTTER },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.coralDeep,
    borderBottomWidth: 4,
    borderBottomColor: "#c0594d",
    shadowColor: "#2b2a26",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  fabText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15.5, color: Garden.white },
});
