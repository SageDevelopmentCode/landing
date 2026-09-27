import { Pressable, StyleSheet, Text, View } from "react-native";
import { HomeTheme, homeTypography } from "./homeTheme";

type Props = {
  title: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  style?: object;
};

export function HomeSectionHeader({
  title,
  onViewAll,
  viewAllLabel = "View all",
  style,
}: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{title}</Text>
      {onViewAll ? (
        <Pressable
          onPress={onViewAll}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.link}>{viewAllLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HomeTheme.horizontalInset,
  },
  title: homeTypography.sectionTitle,
  link: homeTypography.sectionLink,
});
