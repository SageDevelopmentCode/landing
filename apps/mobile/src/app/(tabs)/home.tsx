// Parent Home — Garden "Today" feed.
// One calm vertical flow ordered by priority: what's happening today, what
// needs you (numbered steps), then your people and the rest of school life.
// All data + handlers live in useParentHome(); the Garden UI pieces live in
// src/features/parent-home/garden/. See the sagefield-garden-mobile skill.
import { Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import {
  ActivitiesRail,
  ChildrenPolaroids,
  CommunityCard,
  ConferenceTickets,
  EventsList,
  FeedbackCard,
  GardenBanners,
  GardenHero,
  GardenHomeChrome,
  NewslettersRail,
  NextStepsStack,
  PhotosCta,
  RewardsCard,
  TeacherChips,
  TeacherFavoritesHome,
  TodayNote,
  TuitionSection,
  common,
} from "@/features/parent-home/garden/GardenHomeParts";
import { useGardenFeedback } from "@/features/parent-home/garden/useGardenFeedback";
import { useParentHome } from "@/features/parent-home/useParentHome";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const h = useParentHome();
  const fb = useGardenFeedback(h);

  return (
    <SafeAreaView style={common.screen} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        refreshControl={
          <RefreshControl
            refreshing={fb.refreshing}
            onRefresh={() => void fb.refresh()}
            tintColor={Garden.sage}
          />
        }
      >
        <GardenHero h={h} />
        <GardenBanners h={h} fb={fb} />
        {!h.loading ? <TodayNote h={h} /> : null}
        <ConferenceTickets h={h} />
        {!h.loading ? <NextStepsStack h={h} style={{ marginBottom: 28 }} /> : null}
        <ChildrenPolaroids h={h} />
        <TeacherChips h={h} fb={fb} />
        <TeacherFavoritesHome h={h} />
        <EventsList h={h} />
        <ActivitiesRail h={h} />
        <TuitionSection h={h} />
        <NewslettersRail h={h} />
        <CommunityCard h={h} />
        <PhotosCta h={h} />
        <RewardsCard h={h} />
        <FeedbackCard h={h} />
      </ScrollView>
      <GardenHomeChrome h={h} fb={fb} />
    </SafeAreaView>
  );
}
