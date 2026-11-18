// Garden bottom sheets for the Children screen: special request, profile
// section edit, pickup person, and the JS-only date chooser.
import {
  Display,
  Garden,
  GardenButton,
  GardenField,
  GardenFonts,
  GardenRadii,
  GardenTints,
  HandNote,
  PressableScale,
  gardenCard,
  gardenSheetChrome,
} from "@/components/garden";
import { MonthGrid } from "@/features/calendar/garden/CalendarParts";
import {
  formatFullDate,
  isValidYMD,
  MONTH_NAMES,
  parseYMD,
  toYMD,
} from "@/features/calendar/calendarUtils";
import {
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { draftFromStudent, PROFILE_SECTIONS, type SectionDraft } from "../profileSections";
import {
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  CATEGORY_TINTS,
  EMPTY_PERSON,
  NOTE_CATEGORIES,
  type LearningNoteCategory,
  type LocalPerson,
  type YesNo,
} from "../types";
import type { Children } from "../useChildren";
import type { ChildrenFeedback } from "./useChildrenFeedback";

const Input = BottomSheetTextInput as never;

const formSheetProps = {
  ...gardenSheetChrome,
  enableDynamicSizing: false,
  keyboardBehavior: "interactive" as const,
  keyboardBlurBehavior: "restore" as const,
  android_keyboardInputMode: "adjustResize" as const,
};

function SheetFooter({
  props,
  cancelLabel = "Cancel",
  onCancel,
  primaryLabel,
  onPrimary,
  loading,
  disabled,
  primaryTone = "coral",
  primaryIcon = "checkmark",
}: {
  props: BottomSheetFooterProps;
  cancelLabel?: string;
  onCancel: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  loading?: boolean;
  disabled?: boolean;
  primaryTone?: "coral" | "ink" | "sage";
  primaryIcon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const insets = useSafeAreaInsets();
  return (
    <BottomSheetFooter {...props} bottomInset={0}>
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <GardenButton label={cancelLabel} tone="outline" onPress={onCancel} disabled={loading} style={{ flex: 1 }} fullWidth />
        <GardenButton
          label={primaryLabel}
          tone={primaryTone}
          iconRight={primaryIcon}
          loading={loading}
          loadingLabel="Saving…"
          disabled={disabled}
          onPress={onPrimary}
          style={{ flex: 1.6 }}
          fullWidth
        />
      </View>
    </BottomSheetFooter>
  );
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <Text style={s.label} maxFontSizeMultiplier={1.3}>
      {children}
      {required ? <Text style={{ color: Garden.coralDeep }}> *</Text> : null}
    </Text>
  );
}

// ─── Special request ─────────────────────────────────────────────────────────
export function NoteSheet({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  const l = c.learning;
  const initial = l.editingNote;
  const [category, setCategory] = useState<LearningNoteCategory>("academic");
  const [text, setText] = useState("");

  useEffect(() => {
    setCategory(initial?.category ?? "academic");
    setText(initial?.note_text ?? "");
    // Re-seed each time the sheet is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l.noteSession]);

  const canSave = text.trim().length > 0;
  const first = c.student?.child_legal_name.trim().split(/\s+/)[0] ?? "";

  return (
    <BottomSheetModal
      ref={l.noteSheetRef}
      {...formSheetProps}
      snapPoints={["82%"]}
      footerComponent={(p) => (
        <SheetFooter
          props={p}
          onCancel={() => l.noteSheetRef.current?.dismiss()}
          primaryLabel={initial ? "Save Changes" : "Save Request"}
          onPrimary={() => canSave && void fb.saveNote(category, text)}
          loading={fb.savingNote}
          disabled={!canSave}
        />
      )}
    >
      <BottomSheetScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 2 }}>
          <Display size={26}>{initial ? "Edit Request" : "Add Special Request"}</Display>
          {first ? <HandNote size={17}>{`for ${first}`}</HandNote> : null}
        </View>

        <View style={{ gap: 8 }}>
          <FieldLabel>Category</FieldLabel>
          <View style={s.wrapRow} accessibilityRole="radiogroup">
            {NOTE_CATEGORIES.map((cat) => {
              const on = cat === category;
              const t = GardenTints[CATEGORY_TINTS[cat]];
              return (
                <PressableScale
                  key={cat}
                  haptics="select"
                  onPress={() => setCategory(cat)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={CATEGORY_LABELS[cat]}
                  style={[s.catChip, on && { backgroundColor: t.bg, borderColor: t.fg }]}
                >
                  <Text style={{ fontSize: 15 }}>{CATEGORY_EMOJI[cat]}</Text>
                  <Text style={[s.catText, on && { color: t.fg }]} maxFontSizeMultiplier={1.3}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <FieldLabel>Note</FieldLabel>
          <GardenField
            InputComponent={Input}
            boxed
            multiline
            value={text}
            onChangeText={setText}
            placeholder="Let teachers know what your child needs…"
            maxLength={1000}
            style={{ minHeight: 140 }}
            accessibilityLabel="Note"
          />
          <Text style={s.counter} maxFontSizeMultiplier={1.2}>{`${text.length}/1000`}</Text>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ─── Profile section edit ────────────────────────────────────────────────────
function YesNoChoice({ value, onChange, label }: { value: YesNo; onChange: (v: YesNo) => void; label: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {(["yes", "no"] as const).map((opt) => {
        const on = value === opt;
        return (
          <PressableScale
            key={opt}
            haptics="select"
            onPress={() => onChange(opt)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={opt === "yes" ? "Yes" : "No"}
            style={[s.yesNo, on && s.yesNoOn]}
          >
            {on ? <Ionicons name="checkmark" size={16} color={Garden.white} /> : null}
            <Text style={[s.yesNoText, on && { color: Garden.white }]}>{opt === "yes" ? "Yes" : "No"}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function ProfileSectionSheet({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  const p = c.profile;
  const kind = p.sectionKind;
  const def = PROFILE_SECTIONS[kind];
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState<SectionDraft>({});

  useEffect(() => {
    if (c.student) setDraft(draftFromStudent(kind, c.student));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.sectionSession]);

  const set = (key: string) => (v: string) => setDraft((d) => ({ ...d, [key]: v }));

  return (
    <BottomSheetModal
      ref={p.sectionSheetRef}
      {...formSheetProps}
      snapPoints={["88%"]}
      footerComponent={(fp) => (
        <SheetFooter
          props={fp}
          onCancel={() => p.sectionSheetRef.current?.dismiss()}
          primaryLabel="Save Changes"
          onPrimary={() => void fb.saveSection(kind, draft)}
          loading={fb.savingSection}
        />
      )}
    >
      <BottomSheetScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Display size={26}>{def.title}</Display>

        {(def.yesNoFields ?? []).map((f) => (
          <View key={f.key} style={s.group}>
            <FieldLabel>{f.label}</FieldLabel>
            <YesNoChoice value={(draft[f.key] ?? "") as YesNo} onChange={set(f.key)} label={f.label} />
            {draft[f.key] === "yes" ? (
              <Animated.View entering={reduce ? undefined : FadeIn.duration(180)} style={{ gap: 8, marginTop: 6 }}>
                <FieldLabel>{f.descLabel}</FieldLabel>
                <GardenField
                  InputComponent={Input}
                  boxed
                  multiline
                  value={draft[f.descKey] ?? ""}
                  onChangeText={set(f.descKey)}
                  placeholder={f.descPlaceholder}
                  style={{ minHeight: 84 }}
                  accessibilityLabel={f.descLabel}
                />
              </Animated.View>
            ) : null}
          </View>
        ))}

        {def.textFields.map((f) => (
          <View key={f.key} style={{ gap: 8 }}>
            <FieldLabel>{f.label}</FieldLabel>
            <GardenField
              InputComponent={Input}
              boxed
              multiline
              value={draft[f.key] ?? ""}
              onChangeText={set(f.key)}
              placeholder={f.placeholder}
              style={{ minHeight: 84 }}
              accessibilityLabel={f.label}
            />
          </View>
        ))}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ─── Pickup person ───────────────────────────────────────────────────────────
type PersonFieldDef = {
  key: keyof Omit<LocalPerson, "tempId">;
  label: string;
  placeholder: string;
  required?: boolean;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  props?: Record<string, unknown>;
};

const PERSON_FIELDS: PersonFieldDef[] = [
  { key: "full_name", label: "Full Name", placeholder: "Jane Smith", required: true, icon: "person-outline", props: { autoCapitalize: "words", textContentType: "name" } },
  { key: "relationship", label: "Relationship", placeholder: "e.g. Grandmother, Uncle", required: true, icon: "heart-outline" },
  { key: "phone", label: "Phone", placeholder: "(555) 123-4567", required: true, icon: "call-outline", props: { keyboardType: "phone-pad", textContentType: "telephoneNumber" } },
  { key: "email", label: "Email", placeholder: "jane@example.com", icon: "mail-outline", props: { keyboardType: "email-address", autoCapitalize: "none", textContentType: "emailAddress" } },
  { key: "dl_state_id_number", label: "DL / State ID Number", placeholder: "D1234567", icon: "card-outline", props: { autoCapitalize: "characters" } },
  { key: "vehicle_info", label: "Vehicle Info", placeholder: "2019 Honda Civic, Silver", icon: "car-outline" },
  { key: "license_plate_state", label: "License Plate State", placeholder: "CA", icon: "flag-outline", props: { autoCapitalize: "characters", maxLength: 3 } },
];

export function PersonSheet({ c, fb }: { c: Children; fb: ChildrenFeedback }) {
  const pk = c.pickup;
  const initial = pk.editingPerson;
  const [form, setForm] = useState<LocalPerson>({ tempId: "", ...EMPTY_PERSON });
  const [tried, setTried] = useState(false);

  useEffect(() => {
    setForm(initial ?? { tempId: String(Date.now()), ...EMPTY_PERSON });
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pk.personSession]);

  const set = (key: keyof LocalPerson) => (v: string) => setForm((f) => ({ ...f, [key]: v }));
  const missing = PERSON_FIELDS.filter((f) => f.required && !form[f.key].trim()).map((f) => f.key);
  const canSave = missing.length === 0;

  return (
    <BottomSheetModal
      ref={pk.personSheetRef}
      {...formSheetProps}
      snapPoints={["90%"]}
      footerComponent={(p) => (
        <SheetFooter
          props={p}
          onCancel={() => pk.personSheetRef.current?.dismiss()}
          primaryLabel={initial ? "Save Changes" : "Add Person"}
          primaryTone="ink"
          onPrimary={() => {
            setTried(true);
            if (canSave) fb.savePerson(form);
          }}
        />
      )}
    >
      <BottomSheetScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 2 }}>
          <Display size={26}>{initial ? "Edit Person" : "Add Person"}</Display>
          <HandNote size={17}>* required</HandNote>
        </View>
        {PERSON_FIELDS.map((f) => {
          const err = tried && missing.includes(f.key);
          return (
            <View key={f.key} style={{ gap: 8 }}>
              <FieldLabel required={f.required}>{f.label}</FieldLabel>
              <GardenField
                InputComponent={Input}
                icon={f.icon}
                value={form[f.key]}
                onChangeText={set(f.key)}
                placeholder={f.placeholder}
                accessibilityLabel={`${f.label}${f.required ? ", required" : ""}`}
                containerStyle={err ? { borderColor: Garden.coralDeep } : undefined}
                {...(f.props ?? {})}
              />
              {err ? (
                <Text style={s.fieldError} accessibilityLiveRegion="polite">
                  {`${f.label} is required`}
                </Text>
              ) : null}
            </View>
          );
        })}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ─── Date chooser (JS only — no native picker) ───────────────────────────────
export function DatePickSheet({ c }: { c: Children }) {
  const pk = c.pickup;
  const field = pk.dateField;
  const current = field === "dateOfRequest" ? pk.dateOfRequest : pk.effectiveUntil;
  const todayYMD = toYMD(new Date());
  const [value, setValue] = useState("");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  useEffect(() => {
    const v = isValidYMD(current) ? current : "";
    setValue(v);
    const base = v ? parseYMD(v) : new Date();
    setMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pk.dateSession]);

  const y = month.getFullYear();
  const m = month.getMonth();
  const title = field === "dateOfRequest" ? "Date of Request" : "Effective Until";
  const pick = (ymd: string) => {
    setValue(ymd);
    const d = parseYMD(ymd);
    if (d.getMonth() !== m || d.getFullYear() !== y) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  return (
    <BottomSheetModal
      ref={pk.dateSheetRef}
      {...gardenSheetChrome}
      enableDynamicSizing
      footerComponent={(p) => (
        <SheetFooter
          props={p}
          cancelLabel="Clear"
          onCancel={() => {
            pk.setDate(field, "");
            pk.dateSheetRef.current?.dismiss();
          }}
          primaryLabel="Use this date"
          primaryTone="ink"
          disabled={!value}
          onPrimary={() => {
            pk.setDate(field, value);
            pk.dateSheetRef.current?.dismiss();
          }}
        />
      )}
    >
      <BottomSheetScrollView contentContainerStyle={[s.content, { paddingBottom: 120 }]}>
        <Display size={26}>{title}</Display>
        {current && !isValidYMD(current) ? (
          <View style={s.warn}>
            <Ionicons name="information-circle" size={18} color="#8a5a00" />
            <Text style={s.warnText}>{`Saved as “${current}”. Pick a date to replace it.`}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <PressableScale
            haptics="select"
            onPress={() => pick(todayYMD)}
            accessibilityLabel={`Today, ${formatFullDate(todayYMD)}`}
            style={[s.catChip, value === todayYMD && s.chipOn]}
          >
            <Text style={[s.catText, value === todayYMD && { color: Garden.white }]}>Today</Text>
          </PressableScale>
        </View>
        <View style={s.pickerCard}>
          <View style={s.pickerHead}>
            <PressableScale onPress={() => setMonth(new Date(y, m - 1, 1))} accessibilityLabel="Previous month" style={s.pickerNav}>
              <Ionicons name="chevron-back" size={18} color={Garden.ink} />
            </PressableScale>
            <Text style={s.pickerTitle}>{`${MONTH_NAMES[m]} ${y}`}</Text>
            <PressableScale onPress={() => setMonth(new Date(y, m + 1, 1))} accessibilityLabel="Next month" style={s.pickerNav}>
              <Ionicons name="chevron-forward" size={18} color={Garden.ink} />
            </PressableScale>
          </View>
          <MonthGrid year={y} month={m} todayYMD={todayYMD} selectedDate={value || null} onSelect={pick} compact />
        </View>
        {value ? (
          <View style={s.picked}>
            <Ionicons name="checkmark-circle" size={18} color={Garden.sageDeep} />
            <Text style={s.pickedText}>{formatFullDate(value)}</Text>
          </View>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 130, gap: 18 },
  label: {
    fontFamily: GardenFonts.bodyHeavy,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Garden.muted,
  },
  group: { gap: 8, ...gardenCard, borderRadius: 22, padding: 14 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  chipOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  catText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.ink },
  counter: { alignSelf: "flex-end", fontFamily: GardenFonts.bodySemi, fontSize: 12, color: Garden.muted },
  yesNo: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 46,
    borderRadius: GardenRadii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Garden.cream,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  yesNoOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  yesNoText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 15, color: Garden.ink },
  fieldError: { fontFamily: GardenFonts.bodyBold, fontSize: 12.5, color: Garden.coralDeep, marginLeft: 6 },
  warn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: GardenRadii.sm,
    backgroundColor: "#fff3c4",
  },
  warnText: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: "#8a5a00" },
  pickerCard: { ...gardenCard, borderRadius: 22, padding: 10 },
  pickerHead: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  pickerNav: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  pickerTitle: { flex: 1, textAlign: "center", fontFamily: GardenFonts.display, fontSize: 18, color: Garden.ink },
  picked: { flexDirection: "row", alignItems: "center", gap: 8 },
  pickedText: { fontFamily: GardenFonts.bodyBold, fontSize: 15, color: Garden.sageDeep },
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
