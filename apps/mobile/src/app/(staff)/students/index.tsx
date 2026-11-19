// Staff Students list — Garden. Data in useStudentList(); UI in
// src/features/students/garden/. See the sagefield-garden-mobile skill (staff.md).
import { Garden, useRefreshFeedback } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { GUTTER, StudentsBody, StudentsHero } from "@/features/students/garden/StudentListParts";
import { useStudentList } from "@/features/students/useStudentList";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StudentListScreen() {
  const l = useStudentList();
  const fb = useRefreshFeedback(l.reload, l.retry);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        refreshControl={
          <RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
        }
      >
        <StudentsHero l={l} />
        <View style={{ paddingHorizontal: GUTTER }}>
          <StudentsBody l={l} fb={fb} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
