// Garden UI for Rewards: reward cards, stat tiles, the referral link box and
// history rows, and the testimonial prompts.
import {
  Display,
  Garden,
  GardenAvatar,
  GardenFonts,
  GardenRadii,
  GardenSkeleton,
  GardenSpace,
  GardenTints,
  HandNote,
  Pill,
  PressableScale,
  StickyNote,
  gardenCard,
  gardenEnter,
  type GardenTint,
} from "@/components/garden";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import type { HomeReferral } from "../useRewards";

export const GUTTER = GardenSpace.gutter;

// ─── Stats ───────────────────────────────────────────────────────────────────
export function StatTiles({
  loading,
  referralCount,
  enrolledCount,
  earnedDollars,
}: {
  loading?: boolean;
  referralCount: number;
  enrolledCount: number;
  earnedDollars: number;
}) {
  const stats = [
    { value: String(referralCount), label: "Referred" },
    { value: String(enrolledCount), label: "Enrolled" },
    { value: `$${earnedDollars}`, label: "Earned" },
  ];
  return (
    <View style={st.stats}>
      {stats.map((s) => (
        <View
          key={s.label}
          style={st.stat}
          accessible
          accessibilityLabel={loading ? `${s.label}, loading` : `${s.label}: ${s.value}`}
        >
          {loading ? (
            <GardenSkeleton width={36} height={24} radius={8} />
          ) : (
            <Display size={24} color={Garden.ink}>
              {s.value}
            </Display>
          )}
          <Text style={st.statLabel} maxFontSizeMultiplier={1.3}>
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Reward card (index) ─────────────────────────────────────────────────────
export function RewardCard({
  index,
  tint,
  emoji,
  title,
  badge,
  description,
  children,
  cta,
  onPress,
  a11yLabel,
}: {
  index: number;
  tint: GardenTint;
  emoji: string;
  title: string;
  badge: string;
  description: string;
  children?: ReactNode;
  cta: string;
  onPress: () => void;
  a11yLabel: string;
}) {
  const reduce = useReducedMotion();
  const t = GardenTints[tint];
  return (
    <Animated.View
      entering={reduce ? undefined : gardenEnter(index, { max: 8 })}
      style={{ paddingHorizontal: GUTTER }}
    >
      <PressableScale
        pressedScale={0.98}
        onPress={onPress}
        accessibilityLabel={a11yLabel}
        style={[st.rewardCard, { backgroundColor: t.bg }]}
      >
        <View style={st.rewardTop}>
          <View style={st.rewardHead}>
            <View style={st.rewardIcon}>
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Display size={21}>{title}</Display>
              <Pill tint={tint} style={[st.badgePill, { backgroundColor: t.fg }]} textStyle={{ color: Garden.white }}>
                {badge}
              </Pill>
            </View>
          </View>
          <Text style={[st.rewardDesc, { color: t.fg }]} maxFontSizeMultiplier={1.4}>
            {description}
          </Text>
          {children}
        </View>
        <View style={st.rewardFooter}>
          <Text style={[st.rewardCta, { color: t.fg }]}>{cta}</Text>
          <View style={[st.ctaArrow, { backgroundColor: t.fg }]}>
            <Ionicons name="arrow-forward" size={14} color={Garden.white} />
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

// ─── Referral history ────────────────────────────────────────────────────────
function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = Math.floor(diff / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

function statusLabel(status: string) {
  if (status === "rewarded") return "Rewarded";
  if (status === "enrolled") return "Enrolled";
  return "Pending";
}

function statusTint(status: string): GardenTint {
  if (status === "rewarded") return "mint";
  if (status === "enrolled") return "sage";
  return "butter";
}

export function ReferralRow({ r, index }: { r: HomeReferral; index: number }) {
  const reduce = useReducedMotion();
  const label = statusLabel(r.status);
  return (
    <Animated.View
      entering={reduce ? undefined : gardenEnter(index, { max: 6 })}
      style={st.historyRow}
      accessible
      accessibilityLabel={`${r.referred_email ?? "Referral"}, ${timeAgo(r.created_at)}, ${label}`}
    >
      <GardenAvatar name={r.referred_email ?? "?"} icon="person-outline" size={38} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={st.historyEmail} numberOfLines={1} maxFontSizeMultiplier={1.4}>
          {r.referred_email ?? "—"}
        </Text>
        <Text style={st.historyMeta}>{timeAgo(r.created_at)}</Text>
      </View>
      <Pill tint={statusTint(r.status)}>{r.status === "rewarded" ? `✓ ${label}` : label}</Pill>
    </Animated.View>
  );
}

// ─── Testimonial prompts ─────────────────────────────────────────────────────
export function PromptsNote({ firstChildName }: { firstChildName: string }) {
  const prompts = [
    `What has ${firstChildName || "your child"} enjoyed most at Sage Field?`,
    "How has the program impacted them or your family?",
    "Is there a specific moment or experience that stood out?",
    "Would you recommend Sage Field to another family, and why?",
  ];
  return (
    <StickyNote tilt={-1}>
      <HandNote size={17} color="#7a5a00" style={{ marginBottom: 6 }}>
        some prompts ✍️
      </HandNote>
      <View style={{ gap: 7 }}>
        {prompts.map((p, i) => (
          <View key={i} style={st.promptRow}>
            <Text style={st.promptBullet}>•</Text>
            <Text style={st.promptText} maxFontSizeMultiplier={1.4}>
              {p}
            </Text>
          </View>
        ))}
      </View>
    </StickyNote>
  );
}

const st = StyleSheet.create({
  stats: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    minHeight: 68,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: GardenRadii.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 10,
  },
  statLabel: { fontFamily: GardenFonts.bodyBold, fontSize: 12, color: Garden.soft },
  rewardCard: { borderRadius: GardenRadii.card, overflow: "hidden" },
  rewardTop: { padding: 18, gap: 12 },
  rewardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePill: { paddingHorizontal: 10 },
  rewardDesc: { fontFamily: GardenFonts.bodySemi, fontSize: 14, lineHeight: 20 },
  rewardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  rewardCta: { flex: 1, fontFamily: GardenFonts.bodyHeavy, fontSize: 14.5 },
  ctaArrow: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  historyRow: {
    ...gardenCard,
    borderRadius: GardenRadii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    minHeight: 64,
  },
  historyEmail: { fontFamily: GardenFonts.bodyBold, fontSize: 14.5, color: Garden.ink },
  historyMeta: { fontFamily: GardenFonts.body, fontSize: 12, color: Garden.muted },
  promptRow: { flexDirection: "row", gap: 6 },
  promptBullet: { fontFamily: GardenFonts.bodyHeavy, fontSize: 14, color: "#7a5a00" },
  promptText: { flex: 1, fontFamily: GardenFonts.bodySemi, fontSize: 14, lineHeight: 20, color: "#5c4500" },
});
