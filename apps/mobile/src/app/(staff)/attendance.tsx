// Staff Attendance — Garden. Data + writes in useStaffAttendance(); feedback in
// useStaffAttendanceFeedback(); UI in src/features/staff-attendance/garden/.
// See the sagefield-garden-mobile skill (staff.md).
import { Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { AttendanceHero, MonthPlanView, RosterView } from "@/features/staff-attendance/garden/AttendanceParts";
import { AttendanceChrome } from "@/features/staff-attendance/garden/AttendanceSheets";
import { useStaffAttendanceFeedback } from "@/features/staff-attendance/garden/useStaffAttendanceFeedback";
import { useStaffAttendance } from "@/features/staff-attendance/useStaffAttendance";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StaffAttendanceScreen() {
  const a = useStaffAttendance();
  const fb = useStaffAttendanceFeedback(a);

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
        <AttendanceHero a={a} fb={fb} />
        {a.activeProgram === "month_plan" ? (
          <MonthPlanView a={a} fb={fb} />
        ) : (
          <RosterView a={a} fb={fb} program={a.activeProgram} />
        )}
      </ScrollView>
      <AttendanceChrome a={a} fb={fb} />
    </SafeAreaView>
  );
}
