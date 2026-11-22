// Garden design system — React Native tokens.
// Mirrors the web tokens in app/_garden/garden.css (see
// .claude/skills/sagefield-garden/SKILL.md + mobile.md).
import { Platform, type ViewStyle } from "react-native";

export const Garden = {
  cream: "#fff8ef",
  ink: "#2b2a26",
  soft: "#5b5850",
  muted: "#8a867c",
  line: "#efe6d8",
  coral: "#f29a8f",
  coralDeep: "#e07a6e",
  sage: "#6b9474",
  sageDeep: "#4a6354",
  butter: "#ffe58a",
  butterDeep: "#e9c94f",
  mint: "#cdeed5",
  sky: "#cfe6fb",
  lav: "#e8d8f1",
  peach: "#ffdcc7",
  white: "#ffffff",
  danger: "#c2410c",
  dangerTint: "#fde6dc",
} as const;

export type GardenTint =
  | "coral"
  | "sage"
  | "butter"
  | "sky"
  | "lav"
  | "mint"
  | "peach";

/** Pastel fill + readable ink for each tint. */
export const GardenTints: Record<GardenTint, { bg: string; fg: string }> = {
  coral: { bg: "#fde3df", fg: "#b9554a" },
  sage: { bg: "#e1eee3", fg: Garden.sageDeep },
  butter: { bg: "#fff3c4", fg: "#7a5a00" },
  sky: { bg: "#e3f0fc", fg: "#2f5f8a" },
  lav: { bg: "#f1e8f6", fg: "#6b4785" },
  mint: { bg: "#e2f6e7", fg: "#2f6b44" },
  peach: { bg: "#ffe9dc", fg: "#a2522a" },
};

export const GardenFonts = {
  display: "BricolageGrotesque_800ExtraBold",
  displayBold: "BricolageGrotesque_700Bold",
  body: "Nunito_400Regular",
  bodySemi: "Nunito_600SemiBold",
  bodyBold: "Nunito_700Bold",
  bodyHeavy: "Nunito_800ExtraBold",
  hand: "GochiHand_400Regular",
} as const;

export const GardenRadii = {
  sm: 14,
  md: 20,
  card: 28,
  panel: 36,
  pill: 999,
} as const;

export const GardenSpace = {
  gutter: 18,
  sectionGap: 30,
} as const;

/** Minimum comfortable tap target (Apple HIG 44pt). */
export const MIN_TAP = 44;

/** Max scale for accessibility font sizes on display type, so headings never explode the layout. */
export const DISPLAY_MAX_SCALE = 1.35;

export const gardenShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#2b2a26",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  default: { elevation: 3 },
}) as ViewStyle;

export const gardenShadowSm: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#2b2a26",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  default: { elevation: 2 },
}) as ViewStyle;

export const gardenCard: ViewStyle = {
  backgroundColor: Garden.white,
  borderRadius: GardenRadii.card,
  borderWidth: 1,
  borderColor: Garden.line,
  ...gardenShadowSm,
};

export const GardenSprings = {
  // Tuned to settle without overshoot: smooth, not bouncy.
  press: { damping: 26, stiffness: 380, mass: 0.6 },
  pop: { damping: 22, stiffness: 240, mass: 0.7 },
  gentle: { damping: 24, stiffness: 170 },
} as const;
