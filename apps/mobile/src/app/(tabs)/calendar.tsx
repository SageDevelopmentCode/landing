// Parent Calendar — Garden. Data + handlers live in useParentCalendar();
// the Garden pieces live in src/features/calendar/garden/.
// (Staff keeps components/MobileCalendarScreen.)
import { Confetti, Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { AddEventSheet } from "@/features/calendar/garden/AddEventSheet";
import {
  AddEventFab,
  Agenda,
  CalendarBoard,
  CalendarHero,
  NextUpNote,
} from "@/features/calendar/garden/CalendarParts";
import { EventDetailSheet } from "@/features/calendar/garden/EventDetailSheet";
import { useCalendarFeedback } from "@/features/calendar/garden/useCalendarFeedback";
import { useParentCalendar } from "@/features/calendar/useParentCalendar";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CalendarScreen() {
  const c = useParentCalendar();
  const fb = useCalendarFeedback(c);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 88 }}
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
      {!c.isReadOnlyPreview ? <AddEventFab fb={fb} /> : null}
      <EventDetailSheet c={c} fb={fb} />
      <AddEventSheet c={c} fb={fb} />
      <Confetti ref={fb.confettiRef} />
    </SafeAreaView>
  );
}
