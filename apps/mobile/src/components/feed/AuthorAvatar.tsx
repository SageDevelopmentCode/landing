import { FontFamilies } from "@/constants/theme";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import { avatarColor, getInitials } from "./feedUtils";

export function AuthorAvatar({
  name,
  userId,
  profileImageUrl,
  size = 44,
}: {
  name: string;
  userId: string;
  profileImageUrl?: string | null;
  size?: number;
}) {
  if (profileImageUrl) {
    return (
      <Image
        source={{ uri: profileImageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarColor(userId),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: FontFamilies.bodySemiBold, fontSize: size * 0.35, color: "#fff" }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
