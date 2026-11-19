// Staff student detail — Garden. Data + writes in useStudentDetail(); feedback
// in useStudentDetailFeedback(); UI in src/features/students/garden/.
import { Garden, GardenErrorCard, GardenEmpty, useGardenGoBack } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import {
  GUTTER,
  StudentDetailSkeleton,
  StudentHero,
  StudentTabBody,
  StudentTabRail,
} from "@/features/students/garden/StudentDetailParts";
import { StudentNoteSheet } from "@/features/students/garden/StudentNoteSheet";
import { useStudentDetailFeedback } from "@/features/students/garden/useStudentDetailFeedback";
import { useStudentDetail } from "@/features/students/useStudentDetail";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StudentDetailScreen() {
  const d = useStudentDetail();
  const fb = useStudentDetailFeedback(d);
  const goBack = useGardenGoBack("/(staff)/students");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        refreshControl={
          <RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
        }
      >
        <StudentHero d={d} onBack={goBack} />
        {d.student ? <StudentTabRail d={d} /> : null}
        <View style={{ paddingHorizontal: GUTTER }}>
          {d.loadingDetail && !d.student ? (
            <StudentDetailSkeleton />
          ) : d.detailError ? (
            <GardenErrorCard
              title="Couldn't open this student"
              body={d.detailError}
              onRetry={() => void fb.retry()}
              retrying={fb.retrying}
            />
          ) : !d.student ? (
            <GardenEmpty emoji="🔍" title="Student not found." tint="sky" />
          ) : (
            <StudentTabBody d={d} fb={fb} />
          )}
        </View>
      </ScrollView>
      <StudentNoteSheet d={d} fb={fb} />
    </SafeAreaView>
  );
}
