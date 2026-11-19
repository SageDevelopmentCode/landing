// Staff Calendar — Garden, view-only. Reuses the parent calendar's data hook
// (mode "staff": no add/edit/delete, no register CTA) and Garden parts.
import { Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import {
  Agenda,
  CalendarBoard,
  CalendarHero,
  NextUpNote,
} from "@/features/calendar/garden/CalendarParts";
import { EventDetailSheet } from "@/features/calendar/garden/EventDetailSheet";
import { useStaffCalendarFeedback } from "@/features/calendar/garden/useCalendarFeedback";
import { useParentCalendar } from "@/features/calendar/useParentCalendar";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StaffCalendarScreen() {
  const c = useParentCalendar({ mode: "staff", fetchErrorTag: "staff-calendar-fetch" });
  const fb = useStaffCalendarFeedback(c);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
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
        <CalendarHero c={c} />
        <NextUpNote c={c} />
        <CalendarBoard c={c} fb={fb} />
        <Agenda c={c} fb={fb} />
      </ScrollView>
      <EventDetailSheet c={c} fb={fb} />
    </SafeAreaView>
  );
}
