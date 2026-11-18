// Parent Rewards — Garden. Data lives in useRewardsSummary(); the Garden
// pieces live in src/features/rewards/garden/.
import {
  Garden,
  GardenErrorCard,
  GardenScreenHero,
  GardenSectionHeader,
  Pill,
  useRefreshFeedback,
} from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { GUTTER, RewardCard, StatTiles } from "@/features/rewards/garden/RewardsParts";
import { useRewardsSummary } from "@/features/rewards/useRewards";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RewardsScreen() {
  const router = useRouter();
  const r = useRewardsSummary();
  const fb = useRefreshFeedback(r.reload);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <GardenScreenHero title="Rewards" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 10, paddingBottom: BottomTabInset + 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
        }
      >
        {r.error ? (
          <View style={{ paddingHorizontal: GUTTER }}>
            <GardenErrorCard
              title="We couldn't load your rewards"
              onRetry={() => void fb.retry()}
              retrying={fb.retrying}
            />
          </View>
        ) : null}

        <GardenSectionHeader title="Available rewards" style={{ marginBottom: -4 }} />

        <RewardCard
          index={0}
          tint="sage"
          emoji="🎁"
          title="Refer a Family"
          badge="$500 gift card"
          description="Share your referral link — earn a $500 gift card once your referral enrolls and pays their first month."
          cta="View details"
          a11yLabel={`Refer a Family, $500 gift card. ${r.loading ? "" : `${r.referralCount} referred, ${r.enrolledCount} enrolled, $${r.earnedDollars} earned. `}View details`}
          onPress={() => router.push("/(tabs)/rewards/refer")}
        >
          <StatTiles
            loading={r.loading}
            referralCount={r.referralCount}
            enrolledCount={r.enrolledCount}
            earnedDollars={r.earnedDollars}
          />
        </RewardCard>

        <RewardCard
          index={1}
          tint="peach"
          emoji="☕"
          title="Share Your Experience"
          badge="$15 Starbucks"
          description="Write a short testimonial about your family's experience at Sage Field and earn a $15 Starbucks gift card."
          cta={r.testimonialSubmitted ? "View details" : "☕ Share & earn $15"}
          a11yLabel={`Share Your Experience, $15 Starbucks. ${r.testimonialSubmitted ? "Testimonial received!" : "Not submitted yet"}`}
          onPress={() => router.push("/(tabs)/rewards/testimonial")}
        >
          {r.loading ? null : r.testimonialSubmitted ? (
            <Pill tint="mint">✓ Testimonial received!</Pill>
          ) : (
            <Pill tint="butter" style={{ backgroundColor: "rgba(255,255,255,0.8)" }} textStyle={{ color: Garden.soft }}>
              Not submitted yet
            </Pill>
          )}
        </RewardCard>
      </ScrollView>
    </SafeAreaView>
  );
}
