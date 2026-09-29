import { Brand, FontFamilies } from "@/constants/theme";
import { HomeTheme } from "@/components/home/homeTheme";
import {
  createParentCalendarEvent,
  updateParentCalendarEvent,
  type ParentCalendarEventRecord,
} from "@/lib/calendar-actions";
import {
  defaultParentCalendarEventFormValues,
  PARENT_CALENDAR_ADD_EVENT_STEPS,
  type ParentCalendarEventFormValues,
} from "@/lib/parent-calendar-add-event";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  initialDate: string | null;
  eventToEdit: ParentCalendarEventRecord | null;
  onSaved: (event: ParentCalendarEventRecord) => void;
  onDismiss: () => void;
};

function eventToForm(event: ParentCalendarEventRecord): ParentCalendarEventFormValues {
  return {
    title: event.title,
    event_date: event.event_date.split("T")[0],
    is_all_day: event.is_all_day,
    start_time: event.start_time?.slice(0, 5) ?? "09:00",
    end_time: event.end_time?.slice(0, 5) ?? "10:00",
    location: event.location ?? "",
    description: event.description ?? "",
  };
}

export function ParentCalendarAddSheet({
  sheetRef,
  initialDate,
  eventToEdit,
  onSaved,
  onDismiss,
}: Props) {
  const isEdit = !!eventToEdit;
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState<ParentCalendarEventFormValues>(() =>
    eventToEdit
      ? eventToForm(eventToEdit)
      : defaultParentCalendarEventFormValues(initialDate ?? undefined),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { top: safeTop } = useSafeAreaInsets();

  const snapPoints = useMemo(() => ["88%"], []);

  useEffect(() => {
    if (eventToEdit) {
      setForm(eventToForm(eventToEdit));
      setStepIdx(0);
    } else {
      setForm(defaultParentCalendarEventFormValues(initialDate ?? undefined));
      setStepIdx(0);
    }
    setError("");
  }, [eventToEdit, initialDate]);

  const step = PARENT_CALENDAR_ADD_EVENT_STEPS[stepIdx];
  const isLast = stepIdx === PARENT_CALENDAR_ADD_EVENT_STEPS.length - 1;

  const patch = useCallback((partial: Partial<ParentCalendarEventFormValues>) => {
    setForm((f) => ({ ...f, ...partial }));
    setError("");
  }, []);

  function validateStep(): boolean {
    if (step.id === "title" && !form.title.trim()) {
      setError("Please add a name for your event.");
      return false;
    }
    if (step.id === "date" && !form.event_date) {
      setError("Please pick a date.");
      return false;
    }
    if (step.id === "time" && !form.is_all_day) {
      if (!form.start_time || !form.end_time) {
        setError("Please choose start and end times.");
        return false;
      }
      if (form.end_time <= form.start_time) {
        setError("End time should be after start time.");
        return false;
      }
    }
    setError("");
    return true;
  }

  async function submit() {
    if (!validateStep()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        event_date: form.event_date,
        is_all_day: form.is_all_day,
        start_time: form.is_all_day ? null : form.start_time,
        end_time: form.is_all_day ? null : form.end_time,
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
      };
      const saved = eventToEdit
        ? await updateParentCalendarEvent(eventToEdit.id, payload)
        : await createParentCalendarEvent(payload);
      onSaved(saved);
      sheetRef.current?.dismiss();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function onPrimary() {
    if (!validateStep()) return;
    if (isLast) void submit();
    else setStepIdx((i) => i + 1);
  }

  function onBack() {
    if (stepIdx === 0) sheetRef.current?.dismiss();
    else setStepIdx((i) => i - 1);
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onDismiss={onDismiss}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      )}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.sheetContent,
          { paddingTop: safeTop + 8 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepLabel}>
          Step {stepIdx + 1} of {PARENT_CALENDAR_ADD_EVENT_STEPS.length}
        </Text>
        <View style={styles.progressRow}>
          {PARENT_CALENDAR_ADD_EVENT_STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSeg,
                i <= stepIdx && styles.progressSegActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.title}>
          {isEdit ? "Edit event" : "Add to calendar"}
        </Text>
        <Text style={styles.question}>{step.question}</Text>
        {step.hint ? <Text style={styles.hint}>{step.hint}</Text> : null}

        {step.id === "title" && (
          <BottomSheetTextInput
            style={styles.input}
            placeholder="e.g. Neighborhood playdate"
            value={form.title}
            onChangeText={(t) => patch({ title: t })}
            autoFocus
          />
        )}

        {step.id === "date" && (
          <BottomSheetTextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={form.event_date}
            onChangeText={(t) => patch({ event_date: t })}
            autoCapitalize="none"
          />
        )}

        {step.id === "time" && (
          <View style={{ gap: 12 }}>
            <View style={styles.choiceRow}>
              {[
                { label: "All day", value: true },
                { label: "Set a time", value: false },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.choiceBtn,
                    form.is_all_day === opt.value && styles.choiceBtnActive,
                  ]}
                  onPress={() => patch({ is_all_day: opt.value })}
                >
                  <Text
                    style={[
                      styles.choiceBtnTxt,
                      form.is_all_day === opt.value && styles.choiceBtnTxtActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {!form.is_all_day && (
              <View style={styles.timeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Starts</Text>
                  <BottomSheetTextInput
                    style={styles.input}
                    value={form.start_time}
                    onChangeText={(t) => patch({ start_time: t })}
                    placeholder="09:00"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Ends</Text>
                  <BottomSheetTextInput
                    style={styles.input}
                    value={form.end_time}
                    onChangeText={(t) => patch({ end_time: t })}
                    placeholder="10:00"
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {step.id === "details" && (
          <View style={{ gap: 12 }}>
            <View>
              <Text style={styles.fieldLabel}>Location (optional)</Text>
              <BottomSheetTextInput
                style={styles.input}
                placeholder="Where is it?"
                value={form.location}
                onChangeText={(t) => patch({ location: t })}
              />
            </View>
            <View>
              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <BottomSheetTextInput
                style={[styles.input, styles.textArea]}
                placeholder="Anything other parents should know?"
                value={form.description}
                onChangeText={(t) => patch({ description: t })}
                multiline
              />
            </View>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={18} color="#4b5563" />
            <Text style={styles.backBtnTxt}>
              {stepIdx === 0 ? "Cancel" : "Back"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
            onPress={onPrimary}
            disabled={saving}
          >
            <Text style={styles.primaryBtnTxt}>
              {saving
                ? "Saving…"
                : isLast
                  ? isEdit
                    ? "Save changes"
                    : "Add to calendar"
                  : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: HomeTheme.canvas,
  },
  sheetHandle: {
    backgroundColor: "#EDE8E2",
    width: 36,
  },
  sheetContent: {
    paddingHorizontal: HomeTheme.horizontalInset,
    paddingBottom: 40,
  },
  stepLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: HomeTheme.meta,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 10,
    marginBottom: 16,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#EDE8E2",
  },
  progressSegActive: {
    backgroundColor: Brand.sage700,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 18,
    color: HomeTheme.authorName,
    marginBottom: 8,
  },
  question: {
    fontFamily: FontFamilies.heading,
    fontSize: 22,
    color: HomeTheme.authorName,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  hint: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: HomeTheme.meta,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#EDE8E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: HomeTheme.authorName,
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  fieldLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: HomeTheme.meta,
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  choiceRow: {
    flexDirection: "row",
    gap: 8,
  },
  choiceBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDE8E2",
    alignItems: "center",
    backgroundColor: HomeTheme.cardBg,
  },
  choiceBtnActive: {
    borderColor: "#C8DFCB",
    backgroundColor: "#EEF5EF",
  },
  choiceBtnTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: HomeTheme.meta,
  },
  choiceBtnTxtActive: {
    color: HomeTheme.authorName,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  error: {
    marginTop: 12,
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#b45309",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDE8E2",
    backgroundColor: HomeTheme.cardBg,
  },
  backBtnTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: HomeTheme.authorName,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Brand.sage700,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
});
