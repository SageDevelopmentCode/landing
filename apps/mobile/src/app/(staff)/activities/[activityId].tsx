// Staff activity detail — Garden. Photos, date, publishing state, family
// preferences (opens the preferences sheet), foods with allergens, and
// Edit for the activity's creator.
import {
  Display,
  Garden,
  GardenButton,
  GardenEmpty,
  GardenErrorCard,
  GardenFonts,
  GardenIconButton,
  GardenScreenHero,
  GardenSkeleton,
  Pill,
  useRefreshFeedback,
} from "@/components/garden";
import { ActivityPreferencesSheet } from "@/components/ActivityPreferencesSheet";
import { floatingTabBarStyle } from "@/constants/theme";
import {
  FoodCard,
  GUTTER,
  PhotoPager,
  PrefsCard,
  SectionTitle,
  StatusPills,
  formatActivityDate,
} from "@/features/staff-activities/garden/ActivitiesParts";
import { useActivityDetail } from "@/features/staff-activities/useActivityDetail";
import { useStaffRole } from "@/features/staff-shared/useStaffRole";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function ActivityDetailScreen() {
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const role = useStaffRole();
  const d = useActivityDetail(activityId);
  const fb = useRefreshFeedback(d.reload);
  const prefsSheetRef = useRef<BottomSheetModal>(null);
  const a = d.activity;
  const isOwner = !!a && role.isOwner(a.created_by);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.getParent()?.setOptions({ tabBarStyle: floatingTabBarStyle });
    }, [navigation]),
  );

  const right = a ? (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <GardenIconButton icon="people-outline" label="Student Preferences" onPress={() => prefsSheetRef.current?.present()} />
      <GardenIconButton
        icon="time-outline"
        label="Change History"
        onPress={() => router.push({ pathname: "/(staff)/activities/changelog" as never, params: { activityId: a.id } })}
      />
    </View>
  ) : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top", "left", "right"]}>
      <GardenScreenHero title={a?.title ?? "Activity"} size={26} fallbackHref="/(staff)/activities" right={right} />

      {d.loading ? (
        <View style={{ paddingHorizontal: GUTTER, gap: 14 }} accessibilityLabel="Loading activity">
          <GardenSkeleton width="100%" height={220} radius={28} />
          <GardenSkeleton width="40%" height={16} />
          <GardenSkeleton width="70%" height={22} />
          <GardenSkeleton width="100%" height={70} radius={22} />
        </View>
      ) : d.error && !a ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenErrorCard title="We couldn't load this activity" onRetry={() => void fb.retry()} retrying={fb.retrying} />
        </View>
      ) : !a ? (
        <View style={{ paddingHorizontal: GUTTER }}>
          <GardenEmpty
            emoji="🍂"
            title="Activity not found"
            body="It may have been deleted."
            actionLabel="Back to activities"
            onAction={() => router.replace("/(staff)/activities" as never)}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: (isOwner ? 110 : 32) + insets.bottom }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />}
        >
          <PhotoPager a={a} />
          <View style={{ marginTop: 16, gap: 10 }}>
            {a.activity_date ? (
              <Pill tint="butter">📅 {formatActivityDate(a.activity_date, { weekday: "long", month: "long" })}</Pill>
            ) : null}
            <Display size={28}>{a.title}</Display>
            <StatusPills a={a} />
            {a.description ? (
              <Text style={st.desc} maxFontSizeMultiplier={1.4}>
                {a.description}
              </Text>
            ) : null}
          </View>

          <SectionTitle>Families</SectionTitle>
          <PrefsCard a={a} prefs={d.prefs} attendingCount={d.attending.length} onOpen={() => prefsSheetRef.current?.present()} />

          {a.includes_food ? (
            <>
              <SectionTitle note={a.foods.length ? "tap a food to see ingredients" : undefined}>Foods</SectionTitle>
              {a.foods.length ? (
                a.foods.map((f) => <FoodCard key={f.id} food={f} />)
              ) : (
                <GardenEmpty emoji="🍽️" title="No foods added yet" tint="peach" />
              )}
            </>
          ) : null}
        </ScrollView>
      )}

      {a && isOwner ? (
        <View style={[st.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <GardenButton
            label="Edit Activity"
            tone="ink"
            icon="create-outline"
            fullWidth
            onPress={() => router.push({ pathname: "/(staff)/activities/form" as never, params: { activityId: a.id } })}
          />
        </View>
      ) : null}

      {a ? (
        <ActivityPreferencesSheet
          ref={prefsSheetRef}
          activityId={a.id}
          activityDate={a.activity_date}
          attendingStudents={d.attending}
        />
      ) : null}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  desc: { fontFamily: GardenFonts.bodySemi, fontSize: 15.5, lineHeight: 22, color: Garden.soft },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
});
