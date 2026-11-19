// Staff Pay History — Garden. Data in usePayrollHistory(); feedback in
// usePayrollHistoryFeedback(); UI in src/features/staff-payroll/garden/.
import { Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { HistoryBody, HistoryHero } from "@/features/staff-payroll/garden/PayrollParts";
import { usePayrollHistoryFeedback } from "@/features/staff-payroll/garden/usePayrollFeedback";
import { usePayrollHistory } from "@/features/staff-payroll/usePayrollHistory";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PayrollHistoryScreen() {
  const h = usePayrollHistory();
  const fb = usePayrollHistoryFeedback(h);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        refreshControl={
          <RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
        }
      >
        <HistoryHero />
        <HistoryBody h={h} fb={fb} />
      </ScrollView>
    </SafeAreaView>
  );
}
