import { FontFamilies } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type SchoolYearMonthGridItem = {
  key: string;
  label: string;
  subtitle: string;
  partialPaidLabel?: string;
};

type Props = {
  months: SchoolYearMonthGridItem[];
  selectedKeys: Set<string>;
  paidKeys: Set<string>;
  accentColor: string;
  accentTintBg: string;
  onToggle: (key: string) => void;
};

function chunkArr<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    rows.push(arr.slice(i, i + size));
  }
  return rows;
}

export function SchoolYearMonthlyMonthGrid({
  months,
  selectedKeys,
  paidKeys,
  accentColor,
  accentTintBg,
  onToggle,
}: Props) {
  return (
    <View style={s.grid}>
      {chunkArr(months, 2).map((row, i) => (
        <View key={i} style={s.row}>
          {row.map((month) => {
            const isPaid = paidKeys.has(month.key);
            const isSelected = selectedKeys.has(month.key);
            return (
              <Pressable
                key={month.key}
                style={[
                  s.card,
                  isPaid && s.cardPaid,
                  isSelected && { backgroundColor: accentTintBg },
                  (isPaid || isSelected) && {
                    borderLeftWidth: 3,
                    borderLeftColor: isPaid ? "#16A34A" : accentColor,
                  },
                ]}
                onPress={() => !isPaid && onToggle(month.key)}
                disabled={isPaid}
              >
                <View style={s.cardHeader}>
                  <View
                    style={[
                      s.checkCircle,
                      isPaid
                        ? { backgroundColor: "#16A34A" }
                        : isSelected
                          ? { backgroundColor: accentColor }
                          : s.checkCircleEmpty,
                    ]}
                  >
                    {(isPaid || isSelected) && (
                      <Ionicons name="checkmark" size={12} color="#ffffff" />
                    )}
                  </View>
                  <Text style={s.monthLabel} numberOfLines={1}>
                    {month.label}
                  </Text>
                  {isPaid && (
                    <View style={s.paidBadge}>
                      <Text style={s.paidBadgeText}>Paid</Text>
                    </View>
                  )}
                </View>
                <Text style={s.subtitle}>
                  {month.subtitle}
                  {month.partialPaidLabel ? (
                    <Text style={s.partialPaid}> {month.partialPaidLabel}</Text>
                  ) : null}
                </Text>
              </Pressable>
            );
          })}
          {row.length === 1 && <View style={s.cardSpacer} />}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  card: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  cardPaid: {
    backgroundColor: "#F0FDF4",
    opacity: 0.85,
  },
  cardSpacer: { flex: 1 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkCircleEmpty: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  monthLabel: {
    flex: 1,
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#111827",
  },
  paidBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  paidBadgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#16A34A",
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9CA3AF",
    marginLeft: 28,
  },
  partialPaid: {
    fontFamily: FontFamilies.bodySemiBold,
    color: "#16A34A",
  },
});
