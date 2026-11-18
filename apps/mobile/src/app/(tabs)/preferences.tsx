// Parent Activity Preferences — Garden. Data + writes live in
// useActivityPreferences(); feedback in usePreferencesFeedback(); the Garden
// pieces and sheets live in src/features/preferences/garden/.
import { Garden, GardenScreenHero, GardenSpace } from "@/components/garden";
import {
  ActivityCard,
  AutoFillCard,
  PrefsChildSwitcher,
  PrefsEmpty,
  PrefsError,
  PrefsProgress,
  PrefsSkeleton,
  SaveBar,
  SchoolFoodCard,
} from "@/features/preferences/garden/PreferencesParts";
import { AllergenConfirmSheet, SchoolDayFoodSheet } from "@/features/preferences/garden/PreferenceSheets";
import { usePreferencesFeedback } from "@/features/preferences/garden/usePreferencesFeedback";
import { useActivityPreferences } from "@/features/preferences/useActivityPreferences";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useEffect, useRef } from "react";
import { FlatList, KeyboardAvoidingView, Platform, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function PreferencesScreen() {
  const p = useActivityPreferences();
  const fb = usePreferencesFeedback(p);
  const insets = useSafeAreaInsets();

  const foodSheetRef = useRef<BottomSheetModal>(null);
  const confirmSheetRef = useRef<BottomSheetModal>(null);
  const initialFoodSheetOpened = useRef(false);

  const presentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { loading, selectedChildId, childNeedsSchoolDayFoodPrefs } = p;

  useEffect(() => {
    return () => {
      if (presentTimer.current) clearTimeout(presentTimer.current);
    };
  }, []);

  // First visit: if the first child has no school-day food answers, open the form.
  useEffect(() => {
    if (loading || !selectedChildId || initialFoodSheetOpened.current) return;
    initialFoodSheetOpened.current = true;
    if (childNeedsSchoolDayFoodPrefs(selectedChildId)) {
      presentTimer.current = setTimeout(() => foodSheetRef.current?.present(), 350);
    }
  }, [loading, selectedChildId, childNeedsSchoolDayFoodPrefs]);

  function selectChild(childId: string) {
    const { needsFoodPrefs } = p.selectChild(childId);
    if (needsFoodPrefs) {
      presentTimer.current = setTimeout(() => foodSheetRef.current?.present(), 100);
    }
  }

  function handleSavePress() {
    if (fb.blocked()) return;
    if (!p.canSave) return;
    if (p.hasFoodActivities) confirmSheetRef.current?.present();
    else void fb.save();
  }

  async function handleConfirmSave() {
    const ok = await fb.save();
    if (ok) confirmSheetRef.current?.dismiss();
  }

  const header = (
    <View style={{ gap: 14, marginBottom: 6 }}>
      <SchoolFoodCard p={p} onOpen={() => foodSheetRef.current?.present()} />
      {p.visibleActivities.length > 0 ? (
        <>
          <AutoFillCard key={p.selectedChildId ?? "none"} p={p} fb={fb} />
          <PrefsProgress p={p} />
        </>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <GardenScreenHero title="Activity Preferences" onBack={fb.onBack} />

      {p.loading ? (
        <PrefsSkeleton />
      ) : p.loadError && p.children.length === 0 ? (
        <PrefsError fb={fb} />
      ) : (
        <>
          <PrefsChildSwitcher p={p} onSelect={selectChild} />
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <FlatList
              data={p.visibleActivities}
              keyExtractor={(a) => a.id}
              ListHeaderComponent={
                <>
                  {p.loadError ? (
                    <View style={{ marginHorizontal: -GardenSpace.gutter, marginBottom: 14 }}>
                      <PrefsError fb={fb} />
                    </View>
                  ) : null}
                  {header}
                </>
              }
              contentContainerStyle={{
                paddingHorizontal: GardenSpace.gutter,
                paddingTop: 6,
                paddingBottom: 40,
                gap: 18,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<PrefsEmpty p={p} />}
              renderItem={({ item, index }) => <ActivityCard act={item} index={index} p={p} />}
            />
            <SaveBar p={p} onSave={handleSavePress} bottomInset={insets.bottom} />
          </KeyboardAvoidingView>
        </>
      )}

      <SchoolDayFoodSheet
        sheetRef={foodSheetRef}
        studentId={p.selectedChildId}
        studentName={p.selectedChild?.child_legal_name ?? ""}
        initialPrefs={p.selectedSchoolDayFoodPref ?? null}
        readOnly={p.isReadOnlyPreview}
        onSave={fb.saveFood}
      />
      <AllergenConfirmSheet
        sheetRef={confirmSheetRef}
        saving={p.saveStatus === "saving"}
        onConfirm={() => void handleConfirmSave()}
      />
    </SafeAreaView>
  );
}
