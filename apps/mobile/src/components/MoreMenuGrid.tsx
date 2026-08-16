import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FontFamilies } from "@/constants/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export type MoreMenuItem = {
  label: string;
  icon: IoniconName;
  route?: string;
  url?: string;
  iconColor: string;
  iconBg: string;
};

export type MoreMenuSection = {
  title: string;
  items: MoreMenuItem[];
};

type MoreMenuGridProps = {
  sections: MoreMenuSection[];
  onItemPress: (item: MoreMenuItem) => void;
};

function chunkRows<T>(items: T[], size: number): (T | null)[][] {
  const padded = [...items];
  while (padded.length % size !== 0) padded.push(null as T);
  const rows: (T | null)[][] = [];
  for (let i = 0; i < padded.length; i += size) {
    rows.push(padded.slice(i, i + size));
  }
  return rows;
}

function MenuCell({
  item,
  onPress,
}: {
  item: MoreMenuItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
      onPress={onPress}
    >
      <View style={[styles.iconBadge, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={24} color={item.iconColor} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {item.label}
      </Text>
    </Pressable>
  );
}

export function MoreMenuGrid({ sections, onItemPress }: MoreMenuGridProps) {
  return (
    <View style={styles.sections}>
      {sections.map((section) => {
        const rows = chunkRows(section.items, 3);
        return (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.grid}>
              {rows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.row}>
                  {row.map((item, cellIdx) =>
                    item === null ? (
                      <View key={`spacer-${cellIdx}`} style={styles.cellSpacer} />
                    ) : (
                      <MenuCell
                        key={item.label}
                        item={item}
                        onPress={() => onItemPress(item)}
                      />
                    ),
                  )}
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function MoreMenuHeader({ subtitle }: { subtitle: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },
  sections: {
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  grid: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#f3f4f6",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cellPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  cellSpacer: {
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 14,
  },
});
