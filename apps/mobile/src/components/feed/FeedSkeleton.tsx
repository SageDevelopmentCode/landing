import { SkeletonBox } from "@/components/ui/SkeletonBox";
import { View } from "react-native";
import { FeedTheme } from "./feedTheme";

export function FeedSkeleton() {
  return (
    <View style={{ paddingTop: 8 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            backgroundColor: FeedTheme.cardBg,
            borderRadius: FeedTheme.cardRadius,
            marginHorizontal: FeedTheme.cardMarginH,
            marginBottom: FeedTheme.cardGap,
            padding: FeedTheme.cardPaddingH,
            ...FeedTheme.shadow,
          }}
        >
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <SkeletonBox width={46} height={46} borderRadius={23} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBox width="50%" height={14} borderRadius={4} />
              <SkeletonBox width="35%" height={11} borderRadius={4} />
            </View>
          </View>
          <SkeletonBox width={100} height={22} borderRadius={8} />
          <View style={{ gap: 6, marginTop: 12 }}>
            <SkeletonBox width="100%" height={13} borderRadius={4} />
            <SkeletonBox width="80%" height={13} borderRadius={4} />
          </View>
          <SkeletonBox width="100%" height={180} borderRadius={FeedTheme.mediaRadius} style={{ marginTop: 14 }} />
        </View>
      ))}
    </View>
  );
}
