import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { notifyError } from "@/lib/discord";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HomeReferral = {
  id: string;
  referred_email: string | null;
  status: string;
  created_at: string;
};

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = Math.floor(diff / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export default function ReferScreen() {
  const router = useRouter();
  const { userId, effectiveParentId } = useAuth();
  const [referrals, setReferrals] = useState<HomeReferral[]>([]);
  const [referralLink, setReferralLink] = useState("");
  const [referralsCopied, setReferralsCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!effectiveParentId || !userId) return;
    const refCode = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
    setReferralLink(`https://sagefield.co/apply?ref=${refCode}`);

    supabase
      .schema("parent_app")
      .from("referrals")
      .select("id, referred_email, status, created_at")
      .eq("referrer_id", effectiveParentId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setReferrals(data);
        setLoading(false);
      })
      .catch((e) => {
        notifyError("rewards-refer-load", e);
        setLoading(false);
      });
  }, [effectiveParentId, userId]);

  async function handleCopyReferralLink() {
    await Clipboard.setStringAsync(referralLink);
    setReferralsCopied(true);
    setTimeout(() => setReferralsCopied(false), 2000);
  }

  async function handleShareReferralLink() {
    await Share.share({
      message: `I think your family would love Sage Field! Use my link to apply: ${referralLink}`,
      url: referralLink,
    });
  }

  const referralCount = referrals.length;
  const enrolledCount = referrals.filter(
    (r) => r.status === "enrolled" || r.status === "rewarded",
  ).length;
  const earnedDollars =
    referrals.filter((r) => r.status === "rewarded").length * 500;

  function statusLabel(status: string) {
    if (status === "rewarded") return "Rewarded";
    if (status === "enrolled") return "Enrolled";
    return "Pending";
  }

  function statusColor(status: string) {
    if (status === "rewarded") return "#15803d";
    if (status === "enrolled") return Brand.sage700;
    return "#9ca3af";
  }

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
        <Text style={styles.headerTitle}>Refer a Family</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BottomTabInset + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Ionicons name="gift-outline" size={15} color={Brand.sage700} />
            </View>
            <Text style={styles.cardTitle}>Refer a Family</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>$500 gift card</Text>
            </View>
          </View>

          <Text style={styles.desc}>
            Know a family who'd be a great fit for Sage Field? Share your link —
            you'll receive a{" "}
            <Text style={{ fontFamily: FontFamilies.bodySemiBold, color: "#1f2937" }}>
              $500 gift card
            </Text>{" "}
            of your choice (Amazon, Target, Visa, etc.) once they enroll and pay
            their first month of tuition.
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { value: referralCount, label: "Referred" },
              { value: enrolledCount, label: "Enrolled" },
              { value: `$${earnedDollars}`, label: "Earned" },
            ].map((stat) => (
              <View key={stat.label} style={styles.statBox}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Copy button */}
          <Pressable
            style={({ pressed }) => [
              styles.copyBtn,
              referralsCopied && styles.copyBtnCopied,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleCopyReferralLink}
          >
            <Ionicons
              name={referralsCopied ? "checkmark" : "copy-outline"}
              size={15}
              color="#fff"
            />
            <Text style={styles.copyBtnText}>
              {referralsCopied ? "Copied!" : "Copy my referral link"}
            </Text>
          </Pressable>

          {/* Share button */}
          <Pressable
            style={({ pressed }) => [
              styles.shareBtn,
              pressed && { opacity: 0.75 },
            ]}
            onPress={handleShareReferralLink}
          >
            <Ionicons name="share-outline" size={15} color={Brand.sage700} />
            <Text style={styles.shareBtnText}>Share with a friend</Text>
          </Pressable>

          <Text style={styles.desc}>
            If sharing the link isn't convenient, just let them know to mention
            your name when they apply.
          </Text>
        </View>

        {/* Referral history */}
        {!loading && referrals.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyLabel}>YOUR REFERRALS</Text>
            {referrals.map((r) => (
              <View key={r.id} style={styles.historyRow}>
                <View style={styles.historyAvatar}>
                  <Ionicons name="person-outline" size={14} color={Brand.sage700} />
                </View>
                <View style={styles.historyBody}>
                  <Text style={styles.historyEmail} numberOfLines={1}>
                    {r.referred_email ?? "—"}
                  </Text>
                  <Text style={styles.historyMeta}>{timeAgo(r.created_at)}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${statusColor(r.status)}18` },
                  ]}
                >
                  <Text
                    style={[styles.statusBadgeTxt, { color: statusColor(r.status) }]}
                  >
                    {statusLabel(r.status)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
    gap: 20,
  },
  card: {
    backgroundColor: "#EEF5EF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c2ddc8",
    padding: 16,
    gap: 12,
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
    backgroundColor: `${Brand.sage700}22`,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
    flex: 1,
  },
  badge: {
    backgroundColor: Brand.sage700,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#fff",
  },
  desc: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#4b5563",
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
    borderColor: "#c2ddc8",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 18,
    color: "#1f2937",
  },
  statLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#6b7280",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Brand.sage700,
    paddingVertical: 12,
    borderRadius: 10,
  },
  copyBtnCopied: {
    backgroundColor: "#16a34a",
  },
  copyBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#fff",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Brand.sage700,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  shareBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: Brand.sage700,
  },
  historySection: {
    gap: 10,
  },
  historyLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 10,
    color: "#9ca3af",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
  },
  historyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0EDE2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  historyBody: {
    flex: 1,
    gap: 2,
  },
  historyEmail: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1f2937",
  },
  historyMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
  },
  statusBadge: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeTxt: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
  },
});
