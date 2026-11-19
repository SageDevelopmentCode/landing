// Refer a Family — Garden. Data lives in useReferrals(); copy/share feedback
// is handled here (toast + haptic + the Copy button's success morph).
import {
  Display,
  Garden,
  GardenButton,
  GardenErrorCard,
  GardenFonts,
  GardenRadii,
  GardenScreenHero,
  GardenSectionHeader,
  GardenSkeleton,
  GardenTints,
  Pill,
  PressableScale,
  haptic,
  useRefreshFeedback,
  useToast,
} from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { GUTTER, ReferralRow, StatTiles } from "@/features/rewards/garden/RewardsParts";
import { useReferrals } from "@/features/rewards/useRewards";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReferScreen() {
  const r = useReferrals();
  const fb = useRefreshFeedback(r.reload);
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  async function handleCopy() {
    if (!r.referralLink) return;
    try {
      await Clipboard.setStringAsync(r.referralLink);
      haptic.success();
      setCopied(true);
      toast.show({ tone: "success", title: "Link copied", message: r.referralLink, duration: 2000, silent: true });
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.show({ tone: "error", title: "Couldn't copy the link", message: r.referralLink });
    }
  }

  async function handleShare() {
    if (!r.referralLink) return;
    try {
      await Share.share({
        message: `I think your family would love Sage Field! Use my link to apply: ${r.referralLink}`,
        url: r.referralLink,
      });
    } catch {
      toast.show({
        tone: "error",
        title: "Couldn't open sharing",
        message: "Try copying your link instead.",
        action: { label: "Copy", onPress: () => void handleCopy() },
      });
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <GardenScreenHero title="Refer a Family" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 8, paddingBottom: BottomTabInset + 32, gap: 22 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />
        }
      >
        {r.error ? (
          <GardenErrorCard
            title="We couldn't load your referrals"
            onRetry={() => void fb.retry()}
            retrying={fb.retrying}
          />
        ) : null}

        <View style={st.card}>
          <View style={st.head}>
            <View style={st.icon}>
              <Text style={{ fontSize: 24 }}>🎁</Text>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Display size={22}>Refer a Family</Display>
              <Pill tint="sage" style={{ backgroundColor: Garden.sageDeep }} textStyle={{ color: Garden.white }}>
                $500 gift card
              </Pill>
            </View>
          </View>

          <Text style={st.desc} maxFontSizeMultiplier={1.4}>
            Know a family who&apos;d be a great fit for Sage Field? Share your link — you&apos;ll receive a{" "}
            <Text style={{ fontFamily: GardenFonts.bodyHeavy, color: Garden.ink }}>$500 gift card</Text> of
            your choice (Amazon, Target, Visa, etc.) once they enroll and pay their first month of tuition.
          </Text>

          <StatTiles
            loading={r.loading}
            referralCount={r.referralCount}
            enrolledCount={r.enrolledCount}
            earnedDollars={r.earnedDollars}
          />

          {r.referralLink ? (
            <PressableScale
              pressedScale={0.98}
              haptics="select"
              onPress={() => void handleCopy()}
              accessibilityLabel={`Your referral link, ${r.referralLink}. Copy`}
              style={[st.linkBox, copied && st.linkBoxCopied]}
            >
              <Ionicons name="link-outline" size={16} color={Garden.sageDeep} />
              <Text style={st.linkText} numberOfLines={1} selectable>
                {r.referralLink}
              </Text>
              <Ionicons
                name={copied ? "checkmark-circle" : "copy-outline"}
                size={18}
                color={copied ? Garden.sage : Garden.muted}
              />
            </PressableScale>
          ) : null}

          <View style={{ gap: 10 }}>
            <GardenButton
              label="Copy my referral link"
              icon="copy-outline"
              tone="sage"
              fullWidth
              success={copied}
              successLabel="Copied!"
              disabled={!r.referralLink}
              onPress={() => void handleCopy()}
            />
            <GardenButton
              label="Share with a friend"
              icon="share-outline"
              tone="outline"
              fullWidth
              disabled={!r.referralLink}
              onPress={() => void handleShare()}
            />
          </View>

          <Text style={st.desc} maxFontSizeMultiplier={1.4}>
            If sharing the link isn&apos;t convenient, just let them know to mention your name when they apply.
          </Text>
        </View>

        {r.loading ? (
          <View style={{ gap: 10 }}>
            <GardenSkeleton width="45%" height={22} />
            <GardenSkeleton width="100%" height={64} radius={GardenRadii.md} />
          </View>
        ) : r.referrals.length > 0 ? (
          <View style={{ gap: 10 }}>
            <GardenSectionHeader title="Your referrals" style={{ paddingHorizontal: 0, marginBottom: 2 }} />
            {r.referrals.map((ref, i) => (
              <ReferralRow key={ref.id} r={ref} index={i} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: GardenTints.sage.bg,
    borderRadius: GardenRadii.card,
    padding: 18,
    gap: 16,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: Garden.white,
    alignItems: "center",
    justifyContent: "center",
  },
  desc: { fontFamily: GardenFonts.body, fontSize: 14.5, lineHeight: 21, color: Garden.soft },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: GardenRadii.sm,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Garden.sage,
    backgroundColor: Garden.white,
  },
  linkBoxCopied: { borderStyle: "solid", backgroundColor: GardenTints.mint.bg },
  linkText: { flex: 1, fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: Garden.ink },
});
