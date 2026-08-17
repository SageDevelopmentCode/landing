import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Brand, FontFamilies } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { notifyDiscord, notifyError } from "@/lib/discord";

export type EmergencySnackPreference =
  | "always_allow"
  | "ask_permission"
  | "approved_only";

export type SharedFoodPreference =
  | "always_allow"
  | "ask_each_time"
  | "do_not_offer";

export type SchoolDayFoodPreference = {
  student_id: string;
  emergency_snack_preference: EmergencySnackPreference;
  shared_food_preference: SharedFoodPreference;
};

export const EMERGENCY_SNACK_OPTIONS: {
  value: EmergencySnackPreference;
  emoji: string;
  label: string;
}[] = [
  {
    value: "always_allow",
    emoji: "✅",
    label: "Always allow a backup snack",
  },
  {
    value: "ask_permission",
    emoji: "📱",
    label: "Ask me first",
  },
  {
    value: "approved_only",
    emoji: "📋",
    label: "Approved foods only",
  },
];

export const SHARED_FOOD_OPTIONS: {
  value: SharedFoodPreference;
  emoji: string;
  label: string;
}[] = [
  {
    value: "always_allow",
    emoji: "✅",
    label: "Always allow",
  },
  {
    value: "ask_each_time",
    emoji: "📱",
    label: "Ask me each time",
  },
  {
    value: "do_not_offer",
    emoji: "🚫",
    label: "Do not offer",
  },
];

export function getEmergencySnackLabel(value: EmergencySnackPreference): string {
  const option = EMERGENCY_SNACK_OPTIONS.find((o) => o.value === value);
  return option ? `${option.emoji} ${option.label}` : value;
}

export function getSharedFoodLabel(value: SharedFoodPreference): string {
  const option = SHARED_FOOD_OPTIONS.find((o) => o.value === value);
  return option ? `${option.emoji} ${option.label}` : value;
}

type Props = {
  studentId: string | null;
  studentName: string;
  initialPrefs?: SchoolDayFoodPreference | null;
  effectiveParentId: string | null;
  userProfile: { full_name: string; email: string } | null;
  readOnly?: boolean;
  onSaved: (pref: SchoolDayFoodPreference) => void;
};

function RadioOption<T extends string>({
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
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && !disabled && { opacity: 0.85 },
        disabled && { opacity: 0.6 },
      ]}
    >
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export const SchoolDayFoodPreferencesSheet = forwardRef<BottomSheetModal, Props>(
  function SchoolDayFoodPreferencesSheet(
    {
      studentId,
      studentName,
      initialPrefs,
      effectiveParentId,
      userProfile,
      readOnly = false,
      onSaved,
    },
    ref,
  ) {
    const snapPoints = useMemo(() => ["92%"], []);
    const [emergencySnack, setEmergencySnack] =
      useState<EmergencySnackPreference | null>(null);
    const [sharedFood, setSharedFood] =
      useState<SharedFoodPreference | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isUnanswered = !initialPrefs;

    useEffect(() => {
      setEmergencySnack(initialPrefs?.emergency_snack_preference ?? null);
      setSharedFood(initialPrefs?.shared_food_preference ?? null);
      setError(null);
    }, [studentId, initialPrefs]);

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    );

    const canSave =
      !readOnly &&
      !!studentId &&
      !!effectiveParentId &&
      !!emergencySnack &&
      !!sharedFood &&
      !saving;

    async function handleSave() {
      if (!canSave || !studentId || !effectiveParentId || !emergencySnack || !sharedFood) {
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const { error: upsertError } = await supabase
          .schema("parent_app")
          .from("student_school_day_food_preferences")
          .upsert(
            {
              parent_id: effectiveParentId,
              student_id: studentId,
              emergency_snack_preference: emergencySnack,
              shared_food_preference: sharedFood,
            },
            { onConflict: "parent_id,student_id" },
          );

        if (upsertError) throw upsertError;

        const saved: SchoolDayFoodPreference = {
          student_id: studentId,
          emergency_snack_preference: emergencySnack,
          shared_food_preference: sharedFood,
        };

        if (userProfile) {
          notifyDiscord({
            type: "school_day_food_preferences_saved",
            data: {
              parentName: userProfile.full_name,
              parentEmail: userProfile.email,
              childName: studentName,
              emergencySnack,
              sharedFood,
            },
          });
        }

        onSaved(saved);
      } catch (err) {
        notifyError("school-day-food-prefs-save", err);
        setError(
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
        );
      } finally {
        setSaving(false);
      }
    }

    function handleDismiss() {
      if (typeof ref !== "function" && ref?.current) {
        ref.current.dismiss();
      }
    }

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>School Day Food Preferences</Text>
          {studentName ? (
            <Text style={styles.childName}>{studentName}</Text>
          ) : null}

          <Text style={styles.intro}>
            🍎 Snacks & shared food during the school day — saved to your
            child&apos;s profile. Update anytime.
          </Text>

          <Text style={styles.sectionTitle}>🚨 Emergency snacks</Text>
          <Text style={styles.sectionDesc}>
            If their planned snack isn&apos;t available:
          </Text>
          <View style={styles.optionsGroup}>
            {EMERGENCY_SNACK_OPTIONS.map((option) => (
              <RadioOption
                key={option.value}
                label={`${option.emoji} ${option.label}`}
                selected={emergencySnack === option.value}
                onPress={() => setEmergencySnack(option.value)}
                disabled={readOnly}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>🎁 Shared classroom food</Text>
          <Text style={styles.sectionDesc}>
            Birthday treats, celebrations, or food from other families:
          </Text>
          <View style={styles.optionsGroup}>
            {SHARED_FOOD_OPTIONS.map((option) => (
              <RadioOption
                key={option.value}
                label={`${option.emoji} ${option.label}`}
                selected={sharedFood === option.value}
                onPress={() => setSharedFood(option.value)}
                disabled={readOnly}
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {readOnly ? (
            <Text style={styles.readOnlyHint}>Preview mode — saving is disabled.</Text>
          ) : (
            <View style={styles.footerActions}>
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                    Save Preferences
                  </Text>
                )}
              </Pressable>
              {isUnanswered ? (
                <Pressable onPress={handleDismiss} style={styles.laterBtn}>
                  <Text style={styles.laterBtnText}>Maybe later</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    backgroundColor: "#e5e7eb",
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
    marginBottom: 4,
  },
  childName: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  intro: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 21,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 4,
  },
  sectionDesc: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 10,
  },
  optionsGroup: {
    gap: 8,
    marginBottom: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  optionSelected: {
    borderColor: Brand.sage700,
    backgroundColor: "#F2F7F3",
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: Brand.sage700,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.sage700,
  },
  optionLabel: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
  },
  optionLabelSelected: {
    color: "#1f2937",
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#dc2626",
    marginBottom: 8,
  },
  readOnlyHint: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
  footerActions: {
    gap: 8,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  saveBtnDisabled: {
    backgroundColor: "#e5e7eb",
  },
  saveBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  saveBtnTextDisabled: {
    color: "#9ca3af",
  },
  laterBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  laterBtnText: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
  },
});
