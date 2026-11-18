// Garden "Add your event" sheet: the same 4 steps as before, with a tap-to-pick
// date grid, half-hour time chips and a live preview of the event.
import {
  Display,
  Garden,
  GardenButton,
  GardenField,
  GardenFonts,
  GardenRadii,
  GardenSegmented,
  HandNote,
  PressableScale,
  SeedProgress,
  gardenCard,
  gardenSheetChrome,
  haptic,
  useToast,
} from "@/components/garden";
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
  BottomSheetFooter,
  type BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInLeft, FadeInRight, useReducedMotion } from "react-native-reanimated";
import {
  addDays,
  fmt12,
  formatEventTime,
  formatFullDate,
  isValidYMD,
  MONTH_NAMES,
  minutesToTime,
  parseYMD,
  timeToMinutes,
  toYMD,
} from "../calendarUtils";
import type { ParentCalendar } from "../useParentCalendar";
import { MonthGrid } from "./CalendarParts";
import type { CalendarFeedback } from "./useCalendarFeedback";

const TOTAL = PARENT_CALENDAR_ADD_EVENT_STEPS.length;
const SLOT_START = 6 * 60; // 6:00 AM
const SLOT_END = 22 * 60; // 10:00 PM
const SLOTS = Array.from({ length: (SLOT_END - SLOT_START) / 30 + 1 }, (_, i) => SLOT_START + i * 30);
const CHIP_W = 86;
const CHIP_GAP = 8;

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

function durationLabel(start: string, end: string): string | null {
  const d = timeToMinutes(end) - timeToMinutes(start);
  if (!(d > 0)) return null;
  const h = Math.floor(d / 60);
  const m = d % 60;
  return [h ? `${h} hr` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}

export function AddEventSheet({ c, fb }: { c: ParentCalendar; fb: CalendarFeedback }) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const insets = useSafeAreaInsets();
  const isEdit = !!c.eventToEdit;
  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [form, setForm] = useState<ParentCalendarEventFormValues>(() =>
    defaultParentCalendarEventFormValues(c.addInitialDate ?? undefined),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => parseYMD(c.addInitialDate ?? c.todayYMD));

  // Fresh form on every open (fixes the old sheet reopening with stale values).
  useEffect(() => {
    if (c.addSession === 0) return;
    const next = c.eventToEdit
      ? eventToForm(c.eventToEdit)
      : defaultParentCalendarEventFormValues(c.addInitialDate ?? undefined);
    setForm(next);
    setStepIdx(0);
    setDir(1);
    setError("");
    setSaving(false);
    setPickerMonth(parseYMD(next.event_date || c.todayYMD));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset per open session
  }, [c.addSession]);

  const step = PARENT_CALENDAR_ADD_EVENT_STEPS[stepIdx];
  const isLast = stepIdx === TOTAL - 1;

  const patch = (partial: Partial<ParentCalendarEventFormValues>) => {
    setForm((f) => ({ ...f, ...partial }));
    setError("");
  };

  function fail(msg: string) {
    setError(msg);
    haptic.warning();
  }

  function validateStep(): boolean {
    if (step.id === "title" && !form.title.trim()) {
      fail("Please add a name for your event.");
      return false;
    }
    if (step.id === "date" && (!form.event_date || !isValidYMD(form.event_date))) {
      fail("Please pick a date.");
      return false;
    }
    if (step.id === "time" && !form.is_all_day) {
      const s = timeToMinutes(form.start_time);
      const e = timeToMinutes(form.end_time);
      if (Number.isNaN(s) || Number.isNaN(e)) {
        fail("Please choose start and end times.");
        return false;
      }
      if (e <= s) {
        fail("End time should be after start time.");
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
      const saved = c.eventToEdit
        ? await updateParentCalendarEvent(c.eventToEdit.id, payload)
        : await createParentCalendarEvent(payload);
      setSaving(false);
      c.addSheetRef.current?.dismiss();
      fb.onSaved(saved, isEdit);
    } catch (e) {
      setSaving(false);
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      fail(msg);
      toast.show({
        tone: "error",
        title: isEdit ? "Couldn't save changes" : "Couldn't add your event",
        message: "Your details are still here — try again.",
      });
    }
  }

  function onPrimary() {
    if (!validateStep()) return;
    if (isLast) {
      void submit();
      return;
    }
    haptic.tap();
    setDir(1);
    setStepIdx((i) => i + 1);
  }

  function onBack() {
    if (stepIdx === 0) {
      c.addSheetRef.current?.dismiss();
      return;
    }
    setError("");
    setDir(-1);
    setStepIdx((i) => i - 1);
  }

  const entering = reduce ? undefined : (dir > 0 ? FadeInRight : FadeInLeft).duration(200);
  const primaryLabel = isLast ? (isEdit ? "Save changes" : "Add to calendar") : "Next";

  const renderFooter = (props: BottomSheetFooterProps) => (
    <BottomSheetFooter {...props} bottomInset={0}>
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <GardenButton
          label={stepIdx === 0 ? "Cancel" : "Back"}
          tone="outline"
          icon={stepIdx === 0 ? undefined : "arrow-back"}
          onPress={onBack}
          disabled={saving}
          style={{ flex: 1 }}
          fullWidth
        />
        <GardenButton
          label={primaryLabel}
          tone={isLast ? "coral" : "ink"}
          iconRight={isLast ? "checkmark" : "arrow-forward"}
          loading={saving}
          loadingLabel="Saving…"
          onPress={onPrimary}
          style={{ flex: 1.6 }}
          fullWidth
        />
      </View>
    </BottomSheetFooter>
  );

  return (
    <BottomSheetModal
      ref={c.addSheetRef}
      {...gardenSheetChrome}
      snapPoints={["90%"]}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={() => c.setEventToEdit(null)}
      footerComponent={renderFooter}
    >
      <BottomSheetScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress */}
        <View style={s.progressRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.eyebrow}>{isEdit ? "Edit event" : "Add to calendar"}</Text>
            <HandNote size={17}>{`Step ${stepIdx + 1} of ${TOTAL}`}</HandNote>
          </View>
          <SeedProgress
            done={stepIdx}
            total={TOTAL}
            doneFlags={PARENT_CALENDAR_ADD_EVENT_STEPS.map((_, i) => i < stepIdx)}
          />
        </View>

        {/* Live preview */}
        <PreviewCard form={form} />

        {/* Step body */}
        <Animated.View key={step.id} entering={entering} style={{ gap: 14 }}>
          <View style={{ gap: 4 }}>
            <Display size={26}>{step.question}</Display>
            <Text style={s.hint}>{step.hint}</Text>
          </View>

          {step.id === "title" ? (
            <GardenField
              InputComponent={BottomSheetTextInput as never}
              value={form.title}
              onChangeText={(t) => patch({ title: t })}
              placeholder="e.g. Neighborhood playdate"
              autoFocus
              returnKeyType="next"
              onSubmitEditing={onPrimary}
              accessibilityLabel="Event name"
              maxLength={120}
            />
          ) : null}

          {step.id === "date" ? (
            <DateStep
              value={form.event_date}
              todayYMD={c.todayYMD}
              pickerMonth={pickerMonth}
              setPickerMonth={setPickerMonth}
              onPick={(ymd) => patch({ event_date: ymd })}
            />
          ) : null}

          {step.id === "time" ? (
            <TimeStep form={form} patch={patch} />
          ) : null}

          {step.id === "details" ? (
            <View style={{ gap: 14 }}>
              <View style={{ gap: 6 }}>
                <Text style={s.label}>Location (optional)</Text>
                <GardenField
                  InputComponent={BottomSheetTextInput as never}
                  icon="location-outline"
                  value={form.location}
                  onChangeText={(t) => patch({ location: t })}
                  placeholder="Where is it?"
                  clearable
                  accessibilityLabel="Location (optional)"
                />
              </View>
              <View style={{ gap: 6 }}>
                <Text style={s.label}>Notes (optional)</Text>
                <GardenField
                  InputComponent={BottomSheetTextInput as never}
                  boxed
                  multiline
                  value={form.description}
                  onChangeText={(t) => patch({ description: t })}
                  placeholder="Anything other parents should know?"
                  style={{ minHeight: 96 }}
                  accessibilityLabel="Notes (optional)"
                />
              </View>
            </View>
          ) : null}

          {error ? (
            <Animated.View entering={FadeIn.duration(160)} style={s.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={18} color="#8a5a00" />
              <Text style={s.errorText}>{error}</Text>
            </Animated.View>
          ) : null}
        </Animated.View>

      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ─── Live preview ────────────────────────────────────────────────────────────
function PreviewCard({ form }: { form: ParentCalendarEventFormValues }) {
  const hasDate = isValidYMD(form.event_date);
  const d = hasDate ? parseYMD(form.event_date) : null;
  return (
    <View style={s.preview} accessibilityLabel="Event preview" accessible>
      <View style={[s.previewDate, !d && { backgroundColor: "#f1e7d8" }]}>
        <Text style={s.previewMo}>{d ? d.toLocaleDateString("en-US", { month: "short" }) : "—"}</Text>
        <Text style={s.previewDay}>{d ? d.getDate() : "?"}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.previewTitle, !form.title.trim() && { color: Garden.muted }]} numberOfLines={2}>
          {form.title.trim() || "e.g. Neighborhood playdate"}
        </Text>
        <Text style={s.previewMeta} numberOfLines={1}>
          {d ? `${d.toLocaleDateString("en-US", { weekday: "short" })} · ` : ""}
          {formatEventTime({
            is_all_day: form.is_all_day,
            start_time: form.start_time,
            end_time: form.end_time,
          })}
          {form.location.trim() ? ` · ${form.location.trim()}` : ""}
        </Text>
      </View>
      <HandNote size={14} color={Garden.muted}>
        preview
      </HandNote>
    </View>
  );
}

// ─── Date step ───────────────────────────────────────────────────────────────
function DateStep({
  value,
  todayYMD,
  pickerMonth,
  setPickerMonth,
  onPick,
}: {
  value: string;
  todayYMD: string;
  pickerMonth: Date;
  setPickerMonth: (d: Date) => void;
  onPick: (ymd: string) => void;
}) {
  const today = parseYMD(todayYMD);
  const sat = addDays(today, (6 - today.getDay() + 7) % 7 || 7);
  const quick = [
    { label: "Today", ymd: todayYMD },
    { label: "Tomorrow", ymd: toYMD(addDays(today, 1)) },
    { label: "This Saturday", ymd: toYMD(sat) },
  ];
  const y = pickerMonth.getFullYear();
  const m = pickerMonth.getMonth();
  const pick = (ymd: string) => {
    onPick(ymd);
    const d = parseYMD(ymd);
    if (d.getMonth() !== m || d.getFullYear() !== y) setPickerMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {quick.map((q) => {
          const on = value === q.ymd;
          return (
            <PressableScale
              key={q.label}
              haptics="select"
              onPress={() => pick(q.ymd)}
              accessibilityLabel={`${q.label}, ${formatFullDate(q.ymd)}`}
              accessibilityState={{ selected: on }}
              style={[s.chip, on && s.chipOn]}
            >
              <Text style={[s.chipText, on && { color: Garden.white }]}>{q.label}</Text>
            </PressableScale>
          );
        })}
      </View>
      <View style={s.pickerCard}>
        <View style={s.pickerHead}>
          <PressableScale
            onPress={() => setPickerMonth(new Date(y, m - 1, 1))}
            accessibilityLabel="Previous month"
            style={s.pickerNav}
          >
            <Ionicons name="chevron-back" size={18} color={Garden.ink} />
          </PressableScale>
          <Text style={s.pickerTitle}>{`${MONTH_NAMES[m]} ${y}`}</Text>
          <PressableScale
            onPress={() => setPickerMonth(new Date(y, m + 1, 1))}
            accessibilityLabel="Next month"
            style={s.pickerNav}
          >
            <Ionicons name="chevron-forward" size={18} color={Garden.ink} />
          </PressableScale>
        </View>
        <MonthGrid
          year={y}
          month={m}
          todayYMD={todayYMD}
          selectedDate={value || null}
          onSelect={pick}
          compact
          dimPast
        />
      </View>
      {isValidYMD(value) ? (
        <Animated.View entering={FadeIn.duration(160)} style={s.picked}>
          <Ionicons name="checkmark-circle" size={18} color={Garden.sageDeep} />
          <Text style={s.pickedText}>{formatFullDate(value)}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

// ─── Time step ───────────────────────────────────────────────────────────────
function TimeRail({
  label,
  value,
  slots,
  onPick,
}: {
  label: string;
  value: string;
  slots: number[];
  onPick: (time: string) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const cur = timeToMinutes(value);
  // Include an existing off-grid value (e.g. 9:15 from an older event).
  const list = !Number.isNaN(cur) && !slots.includes(cur) ? [...slots, cur].sort((a, b) => a - b) : slots;
  const idx = Math.max(0, list.indexOf(cur));

  useEffect(() => {
    const t = setTimeout(
      () => ref.current?.scrollTo({ x: Math.max(0, idx * (CHIP_W + CHIP_GAP) - 60), animated: false }),
      30,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll on mount / list change only
  }, [list.length]);

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text style={s.label}>{label}</Text>
        {!Number.isNaN(cur) ? <Text style={s.railValue}>{fmt12(value)}</Text> : null}
      </View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: CHIP_GAP, paddingRight: 8 }}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
      >
        {list.map((mins) => {
          const t = minutesToTime(mins);
          const on = mins === cur;
          return (
            <PressableScale
              key={mins}
              haptics="select"
              onPress={() => onPick(t)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={fmt12(t)}
              style={[s.timeChip, on && s.chipOn]}
            >
              <Text style={[s.chipText, on && { color: Garden.white }]}>{fmt12(t)}</Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TimeStep({
  form,
  patch,
}: {
  form: ParentCalendarEventFormValues;
  patch: (p: Partial<ParentCalendarEventFormValues>) => void;
}) {
  const start = timeToMinutes(form.start_time);
  const endSlots = SLOTS.filter((x) => Number.isNaN(start) || x > start);
  const dur = durationLabel(form.start_time, form.end_time);
  return (
    <View style={{ gap: 16 }}>
      <GardenSegmented
        accessibilityLabel="Event timing"
        value={form.is_all_day ? "all" : "timed"}
        onChange={(v) => patch({ is_all_day: v === "all" })}
        options={[
          { value: "all", label: "All day" },
          { value: "timed", label: "Set a time" },
        ]}
      />
      {form.is_all_day ? (
        <Animated.View entering={FadeIn.duration(180)} style={s.allDay}>
          <Text style={{ fontSize: 22 }}>☀️</Text>
          <Text style={s.allDayText}>All day</Text>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(180)} style={{ gap: 16 }}>
          <TimeRail
            label="Starts"
            value={form.start_time}
            slots={SLOTS}
            onPick={(t) => {
              const sMin = timeToMinutes(t);
              const eMin = timeToMinutes(form.end_time);
              // Keep the end after the start: bump it to +1 hr when needed.
              const end = Number.isNaN(eMin) || eMin <= sMin ? minutesToTime(Math.min(sMin + 60, 23 * 60 + 30)) : form.end_time;
              patch({ start_time: t, end_time: end });
            }}
          />
          <TimeRail
            label="Ends"
            value={form.end_time}
            slots={endSlots}
            onPick={(t) => patch({ end_time: t })}
          />
          {dur ? <HandNote size={16}>{`that's ${dur}`}</HandNote> : null}
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 130, gap: 18 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  hint: { fontFamily: GardenFonts.body, fontSize: 14.5, lineHeight: 20, color: Garden.soft },
  label: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  preview: {
    ...gardenCard,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderStyle: "dashed",
    borderColor: "#e3d6c2",
  },
  previewDate: {
    width: 46,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 6,
    backgroundColor: "#6B8F9C22",
  },
  previewMo: { fontFamily: GardenFonts.bodyHeavy, fontSize: 10.5, textTransform: "uppercase", color: "#4d7280" },
  previewDay: { fontFamily: GardenFonts.display, fontSize: 20, lineHeight: 22, color: "#4d7280" },
  previewTitle: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.ink },
  previewMeta: { fontFamily: GardenFonts.body, fontSize: 12.5, color: Garden.soft },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  chipText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.ink },
  timeChip: {
    width: CHIP_W,
    minHeight: 44,
    borderRadius: GardenRadii.sm,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
    alignItems: "center",
    justifyContent: "center",
  },
  railValue: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.sageDeep },
  pickerCard: { ...gardenCard, borderRadius: 22, padding: 10 },
  pickerHead: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  pickerNav: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  pickerTitle: { flex: 1, textAlign: "center", fontFamily: GardenFonts.display, fontSize: 18, color: Garden.ink },
  picked: { flexDirection: "row", alignItems: "center", gap: 8 },
  pickedText: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.sageDeep },
  allDay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: GardenRadii.md,
    backgroundColor: "#fff3c4",
  },
  allDayText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: "#5c4500" },
  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: GardenRadii.sm,
    backgroundColor: "#fff3c4",
  },
  errorText: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 14, color: "#8a5a00" },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Garden.cream,
    borderTopWidth: 1,
    borderTopColor: Garden.line,
  },
});
