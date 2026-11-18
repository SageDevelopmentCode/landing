// Parent Children — Garden. Data + handlers live in useChildren(); toasts and
// haptics in useChildrenFeedback(); UI pieces in src/features/children/garden/.
// Deep links: ?tab=teacher|attendance|learning|pickup|profile and ?studentId=.
import { Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import {
  DatePickSheet,
  NoteSheet,
  PersonSheet,
  ProfileSectionSheet,
} from "@/features/children/garden/ChildSheets";
import {
  ChildBanner,
  ChildrenHero,
  ChildrenStates,
  ChildSwitcher,
  ChildTabBody,
  ChildTabRail,
  PickupSaveBar,
} from "@/features/children/garden/ChildrenParts";
import { useChildrenFeedback } from "@/features/children/garden/useChildrenFeedback";
import { useChildren } from "@/features/children/useChildren";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChildrenScreen() {
  const c = useChildren();
  const fb = useChildrenFeedback(c);
  const barOpen = c.activeTab === "pickup" && c.pickup.isDirty;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: BottomTabInset + (barOpen ? 96 : 32) }}
        refreshControl={
          <RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
        }
      >
        <ChildrenHero c={c} />
        <ChildrenStates c={c} fb={fb}>
          <ChildSwitcher c={c} fb={fb} />
          <ChildBanner c={c} fb={fb} />
          <ChildTabRail c={c} fb={fb} />
          <ChildTabBody c={c} fb={fb} />
        </ChildrenStates>
      </ScrollView>
      <PickupSaveBar c={c} fb={fb} />
      <NoteSheet c={c} fb={fb} />
      <ProfileSectionSheet c={c} fb={fb} />
      <PersonSheet c={c} fb={fb} />
      <DatePickSheet c={c} />
    </SafeAreaView>
  );
}
