import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RewardsScreen() {
  const router = useRouter();
  const { userId, effectiveParentId } = useAuth();

  const [referralCount, setReferralCount] = useState(0);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [earnedDollars, setEarnedDollars] = useState(0);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!effectiveParentId || !userId) return;

      async function load() {
        try {
          const [referralsResult, testimonialResult] = await Promise.all([
            supabase
              .schema("parent_app")
              .from("referrals")
              .select("status")
              .eq("referrer_id", effectiveParentId),
            supabase
              .schema("marketing")
              .from("testimonials")
              .select("id")
              .eq("parent_id", userId)
              .limit(1),
          ]);

          const refs = referralsResult.data ?? [];
          setReferralCount(refs.length);
          setEnrolledCount(
            refs.filter(
              (r: { status: string }) =>
                r.status === "enrolled" || r.status === "rewarded",
            ).length,
          );
          setEarnedDollars(
            refs.filter((r: { status: string }) => r.status === "rewarded")
              .length * 500,
          );
          setTestimonialSubmitted(
            (testimonialResult.data?.length ?? 0) > 0,
          );
        } catch (e) {
          notifyError("rewards-index-load", e);
        } finally {
          setLoading(false);
        }
      }

      load();
    }, [effectiveParentId, userId]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#1f2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Rewards</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BottomTabInset + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>AVAILABLE REWARDS</Text>

        {/* Refer a Family card */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            styles.referCard,
            pressed && { opacity: 0.92 },
          ]}
          onPress={() => router.push("/(tabs)/rewards/refer")}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: `${Brand.sage700}22` }]}>
                <Ionicons name="gift-outline" size={15} color={Brand.sage700} />
              </View>
              <Text style={[styles.cardTitle, { color: "#1f2937" }]}>
                Refer a Family
              </Text>
              <View style={[styles.badge, { backgroundColor: Brand.sage700 }]}>
                <Text style={styles.badgeTxt}>$500 gift card</Text>
              </View>
            </View>

            <Text style={[styles.cardDesc, { color: "#4b5563" }]}>
              Share your referral link — earn a $500 gift card once your
              referral enrolls and pays their first month.
            </Text>

            {!loading && (
              <View style={styles.statsRow}>
                {[
                  { value: referralCount, label: "Referred" },
                  { value: enrolledCount, label: "Enrolled" },
                  { value: `$${earnedDollars}`, label: "Earned" },
                ].map((stat) => (
                  <View key={stat.label} style={[styles.statBox, { borderColor: "#c2ddc8" }]}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <Text style={[styles.ctaTxt, { color: Brand.sage700 }]}>
              View details
            </Text>
            <Ionicons name="chevron-forward" size={14} color={Brand.sage700} />
          </View>
        </Pressable>

        {/* Share Your Experience card */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            styles.testimonialCard,
            pressed && { opacity: 0.92 },
          ]}
          onPress={() => router.push("/(tabs)/rewards/testimonial")}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: "#f5ede0", borderRadius: 8 }]}>
                <Text style={{ fontSize: 13 }}>☕</Text>
              </View>
              <Text style={[styles.cardTitle, { color: "#78350f" }]}>
                Share Your Experience
              </Text>
              <View style={[styles.badge, { backgroundColor: "#a0784a" }]}>
                <Text style={styles.badgeTxt}>$15 Starbucks</Text>
              </View>
            </View>

            <Text style={[styles.cardDesc, { color: "#92400e" }]}>
              Write a short testimonial about your family's experience at Sage
              Field and earn a $15 Starbucks gift card.
            </Text>

            {!loading && (
              testimonialSubmitted ? (
                <View style={styles.submittedRow}>
                  <Ionicons name="checkmark-circle" size={15} color="#a0784a" />
                  <Text style={styles.submittedTxt}>Testimonial received!</Text>
                </View>
              ) : (
                <View style={styles.submittedRow}>
                  <Ionicons name="ellipse-outline" size={13} color="#d6c9b8" />
                  <Text style={[styles.submittedTxt, { color: "#9ca3af" }]}>
                    Not submitted yet
                  </Text>
                </View>
              )
            )}
          </View>

          <View style={styles.cardFooter}>
            <Text style={[styles.ctaTxt, { color: "#a0784a" }]}>
              {testimonialSubmitted ? "View details" : "☕ Share & earn $15"}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#a0784a" />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },
  content: {
    padding: 20,
    gap: 14,
  },
  sectionLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#9ca3af",
    letterSpacing: 0.8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  referCard: {
    backgroundColor: "#EEF5EF",
    borderColor: "#c2ddc8",
  },
  testimonialCard: {
    backgroundColor: "#FDF8F3",
    borderColor: "#d6c9b8",
  },
  cardTop: {
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#fff",
  },
  cardDesc: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    gap: 1,
  },
  statValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },
  statLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#6b7280",
  },
  submittedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  submittedTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 12,
    color: "#a0784a",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  ctaTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    flex: 1,
  },
});
