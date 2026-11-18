// Sheets for Activity Preferences: the School Day Food form (Garden rebuild of
// components/SchoolDayFoodPreferencesSheet, same copy and options; the write
// goes through the data hook) and the allergen review before saving.
import {
  EMERGENCY_SNACK_OPTIONS,
  SHARED_FOOD_OPTIONS,
  type EmergencySnackPreference,
  type SchoolDayFoodPreference,
  type SharedFoodPreference,
} from "@/components/SchoolDayFoodPreferencesSheet";
import {
  Display,
  Garden,
  GardenButton,
  GardenFonts,
  GardenRadii,
  GardenTints,
  HandNote,
  MIN_TAP,
  PressableScale,
  SeedProgress,
  gardenSheetChrome,
} from "@/components/garden";
import { ALLERGEN_DISCLAIMER } from "@/lib/activity-preferences";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { useEffect, useState, type RefObject } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function RadioCard({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <PressableScale
      haptics="select"
      pressedScale={0.98}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      accessibilityLabel={label}
      style={[st.option, selected && st.optionSelected]}
    >
      <View style={[st.radioOuter, selected && st.radioOuterSelected]}>
        {selected ? <View style={st.radioInner} /> : null}
      </View>
      <Text style={[st.optionLabel, selected && st.optionLabelSelected]} maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
    </PressableScale>
  );
}

export function SchoolDayFoodSheet({
  sheetRef,
  studentId,
  studentName,
  initialPrefs,
  readOnly,
  onSave,
}: {
  sheetRef: RefObject<BottomSheetModal | null>;
  studentId: string | null;
  studentName: string;
  initialPrefs: SchoolDayFoodPreference | null;
  readOnly: boolean;
  onSave: (
    studentId: string,
    studentName: string,
    emergency: EmergencySnackPreference,
    shared: SharedFoodPreference,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const insets = useSafeAreaInsets();
  const [emergencySnack, setEmergencySnack] = useState<EmergencySnackPreference | null>(null);
  const [sharedFood, setSharedFood] = useState<SharedFoodPreference | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUnanswered = !initialPrefs;

  useEffect(() => {
    setEmergencySnack(initialPrefs?.emergency_snack_preference ?? null);
    setSharedFood(initialPrefs?.shared_food_preference ?? null);
    setError(null);
  }, [studentId, initialPrefs]);

  const canSave = !readOnly && !!studentId && !!emergencySnack && !!sharedFood && !saving;
  const doneFlags = [!!emergencySnack, !!sharedFood];
  const done = doneFlags.filter(Boolean).length;

  async function handleSave() {
    if (!canSave || !studentId || !emergencySnack || !sharedFood) return;
    setSaving(true);
    setError(null);
    const r = await onSave(studentId, studentName, emergencySnack, sharedFood);
    setSaving(false);
    if (r.ok) sheetRef.current?.dismiss();
    else if (r.error && r.error !== "read-only") setError(r.error);
  }

  return (
    <BottomSheetModal ref={sheetRef} {...gardenSheetChrome} snapPoints={["92%"]} enableDynamicSizing={false}>
      <BottomSheetScrollView
        contentContainerStyle={[st.content, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 4 }}>
          <Display size={26}>School Day Food Preferences</Display>
          {studentName ? <Text style={st.childName}>{studentName}</Text> : null}
        </View>

        <View style={st.progress}>
          <HandNote size={17} color="#7a5a00">{`${done} of 2 answered`}</HandNote>
          <SeedProgress done={done} total={2} doneFlags={doneFlags} />
        </View>

        <Text style={st.intro}>
          🍎 Snacks & shared food during the school day — saved to your child&apos;s profile. Update anytime.
        </Text>

        <View style={st.group}>
          <Text style={st.sectionTitle} accessibilityRole="header">
            🚨 Emergency snacks
          </Text>
          <Text style={st.sectionDesc}>If their planned snack isn&apos;t available:</Text>
          <View style={st.options} accessibilityRole="radiogroup">
            {EMERGENCY_SNACK_OPTIONS.map((option) => (
              <RadioCard
                key={option.value}
                label={`${option.emoji} ${option.label}`}
                selected={emergencySnack === option.value}
                onPress={() => setEmergencySnack(option.value)}
                disabled={readOnly}
              />
            ))}
          </View>
        </View>

        <View style={st.group}>
          <Text style={st.sectionTitle} accessibilityRole="header">
            🎁 Shared classroom food
          </Text>
          <Text style={st.sectionDesc}>Birthday treats, celebrations, or food from other families:</Text>
          <View style={st.options} accessibilityRole="radiogroup">
            {SHARED_FOOD_OPTIONS.map((option) => (
              <RadioCard
                key={option.value}
                label={`${option.emoji} ${option.label}`}
                selected={sharedFood === option.value}
                onPress={() => setSharedFood(option.value)}
                disabled={readOnly}
              />
            ))}
          </View>
        </View>

        {error ? (
          <Animated.View entering={FadeIn.duration(160)} style={st.errorBox} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={16} color={Garden.danger} />
            <Text style={st.errorText}>{error}</Text>
          </Animated.View>
        ) : null}

        {readOnly ? (
          <Text style={st.readOnly}>Preview mode — saving is disabled.</Text>
        ) : (
          <View style={{ gap: 10, marginTop: 4 }}>
            <GardenButton
              label="Save Preferences"
              tone="coral"
              fullWidth
              loading={saving}
              loadingLabel="Saving…"
              disabled={!canSave}
              onPress={() => void handleSave()}
            />
            {isUnanswered ? (
              <Pressable
                onPress={() => sheetRef.current?.dismiss()}
                hitSlop={8}
                accessibilityRole="button"
                style={st.later}
              >
                <Text style={st.laterText}>Maybe later</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export function AllergenConfirmSheet({
  sheetRef,
  saving,
  onConfirm,
}: {
  sheetRef: RefObject<BottomSheetModal | null>;
  saving: boolean;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <BottomSheetModal ref={sheetRef} {...gardenSheetChrome} enableDynamicSizing>
      <BottomSheetView style={[st.confirm, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={st.confirmIcon}>
          <Text style={{ fontSize: 26 }}>🥕</Text>
        </View>
        <Display size={24}>Review ingredients & allergens</Display>
        <Text style={st.confirmBody}>{ALLERGEN_DISCLAIMER}</Text>
        <View style={st.confirmActions}>
          <GardenButton
            label="Cancel"
            tone="outline"
            fullWidth
            style={{ flex: 1 }}
            onPress={() => sheetRef.current?.dismiss()}
          />
          <GardenButton
            label="Confirm and Save"
            tone="coral"
            fullWidth
            style={{ flex: 1.5 }}
            loading={saving}
            loadingLabel="Saving…"
            onPress={onConfirm}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 18 },
  childName: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.sageDeep },
  progress: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  intro: {
    fontFamily: GardenFonts.bodySemi,
    fontSize: 14,
    lineHeight: 20,
    color: "#5c4500",
    backgroundColor: GardenTints.butter.bg,
    borderRadius: GardenRadii.sm,
    padding: 12,
  },
  group: { gap: 6 },
  sectionTitle: { fontFamily: GardenFonts.bodyHeavy, fontSize: 16, color: Garden.ink },
  sectionDesc: { fontFamily: GardenFonts.body, fontSize: 13.5, color: Garden.soft, marginBottom: 4 },
  options: { gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: MIN_TAP + 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: GardenRadii.sm,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
  },
  optionSelected: { borderColor: Garden.sage, backgroundColor: GardenTints.sage.bg },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(43,42,38,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: Garden.sage },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: Garden.sage },
  optionLabel: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 15, color: Garden.soft },
  optionLabelSelected: { fontFamily: GardenFonts.bodyBold, color: Garden.ink },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Garden.dangerTint,
    borderRadius: GardenRadii.sm,
    padding: 12,
  },
  errorText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.danger },
  readOnly: { fontFamily: GardenFonts.bodySemi, fontSize: 13.5, color: Garden.muted, textAlign: "center" },
  later: { alignSelf: "center", minHeight: MIN_TAP, justifyContent: "center", paddingHorizontal: 12 },
  laterText: { fontFamily: GardenFonts.bodyBold, fontSize: 14, color: Garden.muted },
  confirm: { paddingHorizontal: 22, paddingTop: 4, gap: 14 },
  confirmIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GardenTints.peach.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBody: { fontFamily: GardenFonts.body, fontSize: 14.5, color: Garden.soft, lineHeight: 22 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 6 },
});
