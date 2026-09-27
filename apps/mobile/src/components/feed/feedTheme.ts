import { Brand } from "@/constants/theme";

export const FeedTheme = {
  canvas: Brand.welcomeBg,
  cardBg: "#FFFFFF",
  cardRadius: 26,
  cardPaddingH: 18,
  cardMarginH: 16,
  cardGap: 14,
  shadow: {
    shadowColor: "#3D5C4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  authorName: "#3D5C4A",
  meta: "#8B9E8F",
  body: "#374151",
  reply: "#3D5C4A",
  mediaRadius: 16,
} as const;
