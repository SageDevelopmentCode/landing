// Parent Tuition — Garden. Data + sheet state live in useParentTuition();
// toasts/haptics/confetti in useTuitionFeedback(); the Garden pieces in
// src/features/tuition/garden/. Stripe stays inside the billing sheets.
import { HomeschoolSchoolYearSelectionSheet } from "@/components/billing/HomeschoolSchoolYearSelectionSheet";
import { SchoolYearAftercareSelectionSheet } from "@/components/billing/SchoolYearAftercareSelectionSheet";
import { SchoolYearBillingSection } from "@/components/billing/SchoolYearBillingSection";
import { SchoolYearFunFridaySelectionSheet } from "@/components/billing/SchoolYearFunFridaySelectionSheet";
import { SchoolYearTuitionSelectionSheet } from "@/components/billing/SchoolYearTuitionSelectionSheet";
import { SupplyFeeSelectionSheet } from "@/components/billing/SupplyFeeSelectionSheet";
import { TuitionCodeSheet } from "@/components/billing/TuitionCodeSheet";
import { Confetti, Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { CheckSheet } from "@/features/tuition/garden/CheckSheet";
import { ReceiptSheet } from "@/features/tuition/garden/ReceiptSheet";
import {
  ChildSwitcher,
  PaymentHistory,
  TuitionHero,
  TuitionLoadError,
  TuitionSkeleton,
} from "@/features/tuition/garden/TuitionParts";
import { useTuitionFeedback } from "@/features/tuition/garden/useTuitionFeedback";
import { useParentTuition } from "@/features/tuition/useParentTuition";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TuitionScreen() {
  const router = useRouter();
  const c = useParentTuition();
  const fb = useTuitionFeedback(c);

  const enrolledApps = c.applications.filter((a) => a.status === "enrolled");
  const selectionApps = c.selectionStudentId
    ? enrolledApps.filter((a) => a.student_id === c.selectionStudentId)
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        refreshControl={
          c.loading || c.error ? undefined : (
            <RefreshControl
              refreshing={fb.refreshing}
              onRefresh={() => void fb.refresh()}
              tintColor={Garden.sage}
            />
          )
        }
      >
        <TuitionHero onHelp={() => router.push("/(tabs)/help")} />

        {c.loading ? (
          <TuitionSkeleton />
        ) : c.error ? (
          <TuitionLoadError c={c} fb={fb} />
        ) : (
          <>
            {c.enrolledStudents.length > 0 ? (
              <>
                <ChildSwitcher c={c} fb={fb} />
                {c.showSchoolYearSection && c.activeChildId ? (
                  <SchoolYearBillingSection
                    activeStudentId={c.activeChildId}
                    applications={c.activeApplications}
                    allApplications={c.applications}
                    studentMap={c.studentMap}
                    paidSupplyFeeByStudent={c.paidSupplyFeeByStudent}
                    paidSchoolYearByStudent={c.paidSchoolYearByStudent}
                    paidHomeschoolByStudent={c.paidHomeschoolByStudent}
                    paidFunFridayByStudent={c.paidFunFridayByStudent}
                    showMultiChildSchoolYearBanner={c.showMultiChildSchoolYearBanner}
                    readOnlyPreview={c.isReadOnlyPreview}
                    onSelectSupplyFee={c.openSupplyFee}
                    onSelectSchoolYearTuition={c.openSchoolYearTuition}
                    onSelectHomeschool={c.openHomeschool}
                    onSelectAftercare={c.openAftercare}
                    onSelectFunFriday={c.openFunFriday}
                    onTuitionCodePress={fb.guardPayment(c.openTuitionCode)}
                    onCheckPress={fb.guardPayment(c.openCheck)}
                  />
                ) : null}
              </>
            ) : null}
            <PaymentHistory c={c} />
          </>
        )}
      </ScrollView>

      <ReceiptSheet c={c} />

      <SupplyFeeSelectionSheet
        sheetRef={c.supplyFeeSheetRef}
        readOnly={c.isReadOnlyPreview}
        student={c.selectionStudent}
        applications={selectionApps}
        allApplications={enrolledApps}
        paidSchoolYearByStudent={c.paidSchoolYearByStudent}
        paidHomeschoolByStudent={c.paidHomeschoolByStudent}
        paidSupplyFeeByStudent={c.paidSupplyFeeByStudent}
        studentMap={c.studentMap}
        onSuccess={fb.onPaymentSuccess}
      />

      <SchoolYearTuitionSelectionSheet
        sheetRef={c.schoolYearTuitionSheetRef}
        readOnly={c.isReadOnlyPreview}
        student={c.selectionStudent}
        application={
          c.applications.find(
            (a) =>
              a.student_id === c.selectionStudentId &&
              a.status === "enrolled" &&
              (a.program === "school_year_26_27" || a.program === "both"),
          ) ?? null
        }
        paidMonthIndices={c.paidSchoolYearByStudent[c.selectionStudentId ?? ""] ?? []}
        siblingApplications={c.applications.filter(
          (a) =>
            a.student_id !== c.selectionStudentId &&
            a.status === "enrolled" &&
            (a.program === "school_year_26_27" || a.program === "both") &&
            c.paidSupplyFeeByStudent[a.student_id],
        )}
        paidSchoolYearByStudent={c.paidSchoolYearByStudent}
        paidSupplyFeeByStudent={c.paidSupplyFeeByStudent}
        siblingStudentMap={c.studentMap}
        onSuccess={fb.onPaymentSuccess}
      />

      <HomeschoolSchoolYearSelectionSheet
        sheetRef={c.homeschoolSheetRef}
        readOnly={c.isReadOnlyPreview}
        student={c.selectionStudent}
        application={c.selectionHomeschoolApp}
        paidMonthIndices={c.homeschoolPaidMonths}
        siblingApplications={c.applications.filter(
          (a) =>
            a.id !== c.selectionHomeschoolApp?.id &&
            a.status === "enrolled" &&
            a.program === "homeschool_drop_in" &&
            (a.drop_in_program === "school_year_26_27" || a.drop_in_program === "both") &&
            c.paidSupplyFeeByStudent[a.student_id],
        )}
        paidHomeschoolByStudent={c.paidHomeschoolByStudent}
        siblingStudentMap={c.studentMap}
        onSuccess={fb.onPaymentSuccess}
      />

      <SchoolYearAftercareSelectionSheet
        sheetRef={c.aftercareSheetRef}
        readOnly={c.isReadOnlyPreview}
        student={c.selectionStudent}
        application={c.addonApplication}
        paidAftercare={c.paidAftercareByStudent[c.selectionStudentId ?? ""]}
        onSuccess={fb.onPaymentSuccess}
      />

      <SchoolYearFunFridaySelectionSheet
        sheetRef={c.funFridaySheetRef}
        readOnly={c.isReadOnlyPreview}
        student={c.selectionStudent}
        application={c.addonApplication}
        paidFunFriday={c.paidFunFridayByStudent[c.selectionStudentId ?? ""]}
        onSuccess={fb.onPaymentSuccess}
      />

      {c.effectiveParentId ? (
        <TuitionCodeSheet
          sheetRef={c.tuitionCodeSheetRef}
          parentId={c.effectiveParentId}
          onSuccess={fb.onPaymentSuccess}
        />
      ) : null}

      <CheckSheet c={c} fb={fb} />
      <Confetti ref={fb.confettiRef} />
    </SafeAreaView>
  );
}
