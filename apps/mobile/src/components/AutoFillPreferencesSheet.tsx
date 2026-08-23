import { forwardRef, useCallback, useState, type ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Brand, FontFamilies, Spacing } from "@/constants/theme";
import type { ParticipationLevel } from "@/lib/activity-preferences";
import type { StudentDefaultPreference } from "@/lib/default-preferences";
import {
  AutoFillPreferenceCard,
  type DefaultSaveStatus,
} from "@/components/AutoFillPreferenceCard";

type Student = {
  id: string;
  child_legal_name: string;
};

type Props = {
  eligibleStudents: Student[];
  studentDefaults: StudentDefaultPreference[];
  defaultSaveStatusByStudent: Record<string, DefaultSaveStatus>;
  onSetDefault: (studentId: string, level: ParticipationLevel | null) => void;
  readOnly?: boolean;
};

export const AutoFillPreferencesSheet = forwardRef<BottomSheetModal, Props>(
  function AutoFillPreferencesSheet(
    {
      eligibleStudents,
      studentDefaults,
      defaultSaveStatusByStudent,
      onSetDefault,
      readOnly = false,
    },
    ref,
  ) {
    const [sessionKey, setSessionKey] = useState(0);

    const handleSheetChange = useCallback((index: number) => {
      if (index >= 0) {
        setSessionKey((k) => k + 1);
      }
    }, []);

    const renderBackdrop = useCallback(
      (props: ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={["55%", "85%"]}
        enablePanDownToClose
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Activity auto-fill</Text>
          <Text style={styles.description}>
            Set a default participation level so new activities are pre-filled
            automatically.
          </Text>

          <View style={styles.cardStack}>
            {eligibleStudents.map((student) => {
              const childFirstName =
                student.child_legal_name.split(" ")[0] ?? student.child_legal_name;
              const currentDefault =
                studentDefaults.find((d) => d.student_id === student.id)
                  ?.participation_level ?? null;

              return (
                <AutoFillPreferenceCard
                  key={`${student.id}-${sessionKey}`}
                  childName={childFirstName}
                  currentDefault={currentDefault}
                  saveStatus={defaultSaveStatusByStudent[student.id] ?? "idle"}
                  onSetDefault={(level) => onSetDefault(student.id, level)}
                  disabled={readOnly}
                  questionText={`${childFirstName}'s usual participation level`}
                  initiallyExpanded={currentDefault === null}
                />
              );
            })}
          </View>

          {readOnly ? (
            <Text style={styles.readOnlyNote}>
              Preview mode — preferences cannot be saved.
            </Text>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: "#1f2937",
  },
  description: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 4,
  },
  cardStack: {
    gap: 10,
  },
  readOnlyNote: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
});
