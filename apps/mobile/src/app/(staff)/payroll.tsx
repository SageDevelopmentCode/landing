// Staff Payroll — Garden. Data + writes in usePayroll(); feedback in
// usePayrollFeedback(); UI in src/features/staff-payroll/garden/.
// See the sagefield-garden-mobile skill (staff.md).
import { Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { PayrollBody, PayrollHero } from "@/features/staff-payroll/garden/PayrollParts";
import { PayrollChrome } from "@/features/staff-payroll/garden/PayrollSheets";
import { usePayrollFeedback } from "@/features/staff-payroll/garden/usePayrollFeedback";
import { usePayroll } from "@/features/staff-payroll/usePayroll";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StaffPayrollScreen() {
  const p = usePayroll();
  const fb = usePayrollFeedback(p);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        refreshControl={
          <RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
        }
      >
        <PayrollHero />
        <PayrollBody p={p} fb={fb} />
      </ScrollView>
      <PayrollChrome p={p} fb={fb} />
    </SafeAreaView>
  );
}
