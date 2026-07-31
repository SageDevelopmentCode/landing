import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand, FontFamilies } from "@/constants/theme";

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = ITEM_H * 2;

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function parseDate(value: string) {
  const today = new Date();
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return { year: y, month: m, day: d };
  }
  return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
}

function formatDisplay(value: string) {
  const { year, month, day } = parseDate(value);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

type WheelProps = {
  data: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  flex?: number;
};

function WheelColumn({ data, selectedIndex, onSelect, flex = 1 }: WheelProps) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
  }, []);

  useEffect(() => {
    ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: true });
  }, [selectedIndex]);

  return (
    <ScrollView
      ref={ref}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      onMomentumScrollEnd={(e) => {
        const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
        const clamped = Math.max(0, Math.min(i, data.length - 1));
        if (clamped !== selectedIndex) onSelect(clamped);
      }}
      style={{ flex }}
      contentContainerStyle={{ paddingVertical: PAD }}
    >
      {data.map((item, i) => (
        <View key={i} style={wheel.item}>
          <Text style={[wheel.text, i === selectedIndex && wheel.textSelected]}>
            {item}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const wheel = StyleSheet.create({
  item: {
    height: ITEM_H,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: FontFamilies.body,
    fontSize: 17,
    color: "#9ca3af",
  },
  textSelected: {
    color: "#111827",
    fontFamily: FontFamilies.bodySemiBold,
  },
});

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export function DatePickerField({ value, onChange }: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => parseDate(value));

  function openPicker() {
    setDraft(parseDate(value));
    setOpen(true);
  }

  function commit() {
    const mm = String(draft.month).padStart(2, "0");
    const dd = String(draft.day).padStart(2, "0");
    onChange(`${draft.year}-${mm}-${dd}`);
    setOpen(false);
  }

  const days = Array.from(
    { length: daysInMonth(draft.month, draft.year) },
    (_, i) => String(i + 1)
  );

  const yearIndex = Math.max(0, years.indexOf(draft.year));

  return (
    <>
      <Pressable style={styles.field} onPress={openPicker}>
        <Text style={value ? styles.fieldText : styles.placeholder}>
          {value ? formatDisplay(value) : "Select date"}
        </Text>
        <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </Pressable>
            <Text style={styles.title}>Date taken</Text>
            <Pressable onPress={commit} hitSlop={8}>
              <Text style={styles.doneBtn}>Done</Text>
            </Pressable>
          </View>

          <View style={styles.wheelsRow}>
            {/* Selection indicator */}
            <View style={styles.selectionBar} pointerEvents="none" />

            {/* Month */}
            <WheelColumn
              data={MONTHS}
              selectedIndex={draft.month - 1}
              onSelect={(i) => {
                const newMonth = i + 1;
                const maxDay = daysInMonth(newMonth, draft.year);
                setDraft({ ...draft, month: newMonth, day: Math.min(draft.day, maxDay) });
              }}
              flex={3}
            />
            {/* Day */}
            <WheelColumn
              key={`day-${draft.month}-${draft.year}`}
              data={days}
              selectedIndex={draft.day - 1}
              onSelect={(i) => setDraft({ ...draft, day: i + 1 })}
              flex={1}
            />
            {/* Year */}
            <WheelColumn
              data={years.map(String)}
              selectedIndex={yearIndex}
              onSelect={(i) => {
                const newYear = years[i];
                const maxDay = daysInMonth(draft.month, newYear);
                setDraft({ ...draft, year: newYear, day: Math.min(draft.day, maxDay) });
              }}
              flex={2}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  fieldText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#111827",
  },
  placeholder: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#111827",
  },
  cancelBtn: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    color: "#6b7280",
  },
  doneBtn: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: Brand.sage700,
  },
  wheelsRow: {
    flexDirection: "row",
    height: ITEM_H * VISIBLE,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  selectionBar: {
    position: "absolute",
    top: ITEM_H * 2,
    left: 12,
    right: 12,
    height: ITEM_H,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
});
