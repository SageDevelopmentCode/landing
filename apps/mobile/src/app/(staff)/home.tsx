// Staff Home — Garden "work day" screen for teachers and super admins.
// One vertical flow ordered by urgency: who you are, what needs attention now
// (pickup/tours), the day's roster, then health & food, conferences,
// activities, events and birthdays. All data + writes live in useStaffHome();
// feedback (toasts, haptics, undo, confetti) in useStaffHomeFeedback(); the
// Garden UI in src/features/staff-home/garden/. See the sagefield-garden-mobile
// skill (staff.md).
import { Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import {
  ActivitiesRail,
  BirthdaysList,
  ConferenceSection,
  DayRoster,
  EventsList,
  HealthFoodSection,
  StaffAlerts,
  StaffHero,
  common,
} from "@/features/staff-home/garden/StaffHomeParts";
import { StaffHomeChrome } from "@/features/staff-home/garden/StaffHomeSheets";
import { useStaffHomeFeedback } from "@/features/staff-home/garden/useStaffHomeFeedback";
import { useStaffHome } from "@/features/staff-home/useStaffHome";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StaffHomeScreen() {
  const h = useStaffHome();
  const fb = useStaffHomeFeedback(h);

  return (
    <SafeAreaView style={common.screen} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        refreshControl={
          <RefreshControl
            refreshing={fb.refreshing}
            onRefresh={() => void fb.refresh()}
            tintColor={Garden.sage}
          />
        }
      >
        <StaffHero h={h} />
        <StaffAlerts h={h} />
        <DayRoster h={h} fb={fb} />
        <HealthFoodSection h={h} fb={fb} />
        <ConferenceSection h={h} />
        <ActivitiesRail h={h} fb={fb} />
        <EventsList h={h} fb={fb} />
        <BirthdaysList h={h} fb={fb} />
      </ScrollView>
      <StaffHomeChrome h={h} fb={fb} />
    </SafeAreaView>
  );
}
