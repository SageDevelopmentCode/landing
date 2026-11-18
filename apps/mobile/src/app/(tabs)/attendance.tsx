// Parent Attendance — Garden. Data lives in useParentAttendance(); the Garden
// pieces (shared with Children → Attendance) live in src/features/attendance/garden/.
import { Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { AttendanceHistory } from "@/features/attendance/garden/AttendanceParts";
import {
  AttendanceHero,
  AttendanceScreenBody,
  ChildChips,
  GUTTER,
  useAttendanceFeedback,
} from "@/features/attendance/garden/AttendanceScreenParts";
import { useParentAttendance } from "@/features/attendance/useParentAttendance";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AttendanceScreen() {
  const a = useParentAttendance();
  const fb = useAttendanceFeedback(a);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        refreshControl={
          <RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
        }
      >
        <AttendanceHero a={a} />
        <AttendanceScreenBody a={a} fb={fb}>
          <ChildChips a={a} />
          <View style={{ paddingHorizontal: GUTTER }}>
            <AttendanceHistory att={a.att} />
          </View>
        </AttendanceScreenBody>
      </ScrollView>
    </SafeAreaView>
  );
}
