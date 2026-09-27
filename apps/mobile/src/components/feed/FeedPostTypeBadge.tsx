import { FontFamilies } from "@/constants/theme";
import { getPostTypeDisplay } from "@/lib/feedPostTypeDisplay";
import { Text, View } from "react-native";

export function FeedPostTypeBadge({ value }: { value: string | null }) {
  const display = getPostTypeDisplay(value);
  if (!display) return null;
  return (
    <View
      style={{
        backgroundColor: display.bg,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: display.text,
          fontSize: 10,
          fontFamily: FontFamilies.bodySemiBold,
          letterSpacing: 0.6,
        }}
      >
        {display.labelUpper}
      </Text>
    </View>
  );
}
