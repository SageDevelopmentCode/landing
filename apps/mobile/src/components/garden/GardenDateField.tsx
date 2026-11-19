// Garden date field: a pill that opens a cream wheel picker (month / day /
// year) with "Today" / "Yesterday" shortcuts. Value is a local YYYY-MM-DD
// string ("" = no date). Same API as the old components/photos/DatePickerField.
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Display } from "./GardenBits";
import { GardenButton } from "./GardenButton";
import { Garden, GardenFonts, GardenRadii, MIN_TAP } from "./gardenTheme";
import { haptic } from "./haptics";

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = ITEM_H * 2;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Parts = { year: number; month: number; day: number };

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

/** Local YYYY-MM-DD for a Date (never UTC). */
export function localDateKey(d: Date = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function parseDate(value: string): Parts {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return { year: y, month: m, day: d };
  }
  const t = new Date();
  return { year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate() };
}

function toKey(p: Parts) {
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** "Mon, Nov 18, 2026" */
export function formatDateKey(value: string) {
  const { year, month, day } = parseDate(value);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function WheelColumn({
  data,
  selectedIndex,
  onSelect,
  flex = 1,
  label,
}: {
  data: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  flex?: number;
  label: string;
}) {
  const ref = useRef<ScrollView>(null);
  const mounted = useRef(false);

  useEffect(() => {
    ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: mounted.current });
    mounted.current = true;
  }, [selectedIndex]);

  return (
    <ScrollView
      ref={ref}
      accessibilityLabel={`${label}: ${data[selectedIndex] ?? ""}`}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      onMomentumScrollEnd={(e) => {
        const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
        const clamped = Math.max(0, Math.min(i, data.length - 1));
        if (clamped !== selectedIndex) {
          haptic.select();
          onSelect(clamped);
        }
      }}
      style={{ flex }}
      contentContainerStyle={{ paddingVertical: PAD }}
    >
      {data.map((item, i) => (
        <Pressable
          key={`${item}-${i}`}
          onPress={() => {
            if (i === selectedIndex) return;
            haptic.select();
            onSelect(i);
          }}
          style={styles.wheelItem}
        >
          <Text
            maxFontSizeMultiplier={1.2}
            style={[styles.wheelText, i === selectedIndex && styles.wheelTextOn]}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export type GardenDateFieldProps = {
  value: string;
  onChange: (v: string) => void;
  modalTitle?: string;
  placeholder?: string;
  allowClear?: boolean;
  minYear?: number;
  maxYear?: number;
  /** Red ring + message under the pill. */
  error?: string | null;
  disabled?: boolean;
};

export function GardenDateField({
  value,
  onChange,
  modalTitle = "Date taken",
  placeholder = "Select date",
  allowClear = false,
  minYear,
  maxYear,
  error,
  disabled,
}: GardenDateFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Parts>(() => parseDate(value));

  // Year range is computed at render (never at module load) and always
  // widened to include the current value and draft, so old dates stay editable.
  const currentYear = new Date().getFullYear();
  const valueYear = value ? parseDate(value).year : currentYear;
  const lo = Math.min(minYear ?? currentYear - 9, valueYear, draft.year);
  const hi = Math.max(maxYear ?? currentYear, valueYear, draft.year);
  const years = Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);
  const days = Array.from({ length: daysInMonth(draft.month, draft.year) }, (_, i) => String(i + 1));

  const today = localDateKey();
  const yesterday = localDateKey(new Date(Date.now() - 86_400_000));
  const todayInRange = (y: number) => y >= lo && y <= hi;

  function openPicker() {
    if (disabled) return;
    haptic.tap();
    setDraft(parseDate(value));
    setOpen(true);
  }

  function commit(next?: string) {
    haptic.select();
    onChange(next ?? toKey(draft));
    setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={openPicker}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${modalTitle}: ${value ? formatDateKey(value) : placeholder}`}
        accessibilityHint="Opens a date picker"
        style={({ pressed }) => [
          styles.field,
          !!error && styles.fieldError,
          pressed && { opacity: 0.8 },
          disabled && { opacity: 0.55 },
        ]}
      >
        <Ionicons name="calendar-outline" size={18} color={value ? Garden.sageDeep : Garden.muted} />
        <Text
          maxFontSizeMultiplier={1.4}
          style={[styles.fieldText, !value && { color: Garden.muted }]}
          numberOfLines={1}
        >
          {value ? formatDateKey(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Garden.muted} />
      </Pressable>
      {error ? (
        <Text style={styles.errorText} maxFontSizeMultiplier={1.4}>
          {error}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close date picker"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Display size={24} style={{ flex: 1 }}>
              {modalTitle}
            </Display>
            {allowClear && value ? (
              <Pressable
                onPress={() => commit("")}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Clear date"
              >
                <Text style={styles.clear}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.quickRow}>
            {todayInRange(currentYear) ? (
              <QuickChip label="Today" on={toKey(draft) === today} onPress={() => setDraft(parseDate(today))} />
            ) : null}
            <QuickChip
              label="Yesterday"
              on={toKey(draft) === yesterday}
              onPress={() => setDraft(parseDate(yesterday))}
            />
          </View>

          <View style={styles.wheels}>
            <View style={styles.selectionBar} pointerEvents="none" />
            <WheelColumn
              label="Month"
              data={MONTHS}
              selectedIndex={draft.month - 1}
              onSelect={(i) => {
                const month = i + 1;
                setDraft((d) => ({ ...d, month, day: Math.min(d.day, daysInMonth(month, d.year)) }));
              }}
              flex={3}
            />
            <WheelColumn
              key={`day-${draft.month}-${draft.year}`}
              label="Day"
              data={days}
              selectedIndex={draft.day - 1}
              onSelect={(i) => setDraft((d) => ({ ...d, day: i + 1 }))}
              flex={1}
            />
            <WheelColumn
              label="Year"
              data={years.map(String)}
              selectedIndex={Math.max(0, years.indexOf(draft.year))}
              onSelect={(i) => {
                const year = years[i];
                setDraft((d) => ({ ...d, year, day: Math.min(d.day, daysInMonth(d.month, year)) }));
              }}
              flex={2}
            />
          </View>

          <View style={styles.actions}>
            <GardenButton label="Cancel" tone="outline" onPress={() => setOpen(false)} style={{ flex: 1 }} />
            <GardenButton
              label="Done"
              tone="sage"
              icon="checkmark"
              onPress={() => commit()}
              style={{ flex: 1 }}
              accessibilityHint={formatDateKey(toKey(draft))}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function QuickChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      hitSlop={6}
      style={[styles.chip, on && styles.chipOn]}
    >
      <Text style={[styles.chipText, on && { color: Garden.white }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: MIN_TAP + 4,
    paddingHorizontal: 16,
    borderRadius: GardenRadii.pill,
    backgroundColor: Garden.white,
    borderWidth: 1.5,
    borderColor: Garden.line,
  },
  fieldError: { borderColor: Garden.coralDeep },
  fieldText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 15.5, color: Garden.ink },
  errorText: {
    marginTop: 6,
    marginLeft: 14,
    fontFamily: GardenFonts.bodyBold,
    fontSize: 12.5,
    color: Garden.danger,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(43,42,38,0.35)" },
  sheet: {
    backgroundColor: Garden.cream,
    borderTopLeftRadius: GardenRadii.panel,
    borderTopRightRadius: GardenRadii.panel,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(43,42,38,0.25)",
    marginBottom: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  clear: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: Garden.coralDeep },
  quickRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.pill,
    borderWidth: 1.5,
    borderColor: Garden.line,
    backgroundColor: Garden.white,
    justifyContent: "center",
  },
  chipOn: { backgroundColor: Garden.sageDeep, borderColor: Garden.sageDeep },
  chipText: { fontFamily: GardenFonts.bodyHeavy, fontSize: 13, color: Garden.soft },
  wheels: {
    flexDirection: "row",
    height: ITEM_H * VISIBLE,
    overflow: "hidden",
    borderRadius: GardenRadii.md,
    backgroundColor: Garden.white,
    borderWidth: 1,
    borderColor: Garden.line,
  },
  selectionBar: {
    position: "absolute",
    top: ITEM_H * 2,
    left: 8,
    right: 8,
    height: ITEM_H,
    borderRadius: GardenRadii.sm,
    backgroundColor: "#e1eee3",
  },
  wheelItem: { height: ITEM_H, alignItems: "center", justifyContent: "center" },
  wheelText: { fontFamily: GardenFonts.bodySemi, fontSize: 17, color: Garden.muted },
  wheelTextOn: { fontFamily: GardenFonts.bodyHeavy, color: Garden.ink },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
});
