import { FontFamilies } from "@/constants/theme";
import { FeedTheme } from "@/components/feed/feedTheme";

export const HomeTheme = {
  ...FeedTheme,
  horizontalInset: FeedTheme.cardMarginH,
  sectionGap: 22,
} as const;

export const homeTypography = {
  sectionTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 22,
    color: FeedTheme.authorName,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: FeedTheme.authorName,
  },
  meta: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: FeedTheme.meta,
  },
} as const;

export const homeCardSurface = {
  backgroundColor: HomeTheme.cardBg,
  borderRadius: HomeTheme.cardRadius,
  borderWidth: 1,
  borderColor: "#EDE8E2",
  ...HomeTheme.shadow,
} as const;
