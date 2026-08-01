import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";
import { notifyError } from "@/lib/discord";
import { Brand, FontFamilies } from "@/constants/theme";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type PaystubStatus = "pending" | "approved" | "paid";

type Paystub = {
  id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  hourly_rate_snapshot: number;
  gross_pay: number;
  status: PaystubStatus;
  submitted_at: string;
  approved_at: string | null;
  paid_at: string | null;
  admin_note: string | null;
};

const STATUS_CONFIG: Record<PaystubStatus, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "#fef3c7", text: "#92400e" },
  approved: { label: "Approved", bg: "#eff6ff", text: "#1d4ed8" },
  paid: { label: "Paid", bg: "#f0fdf4", text: "#166534" },
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtPeriod(start: string, end: string) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const mo = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${mo(s)} – ${mo(e)}, ${e.getFullYear()}`;
}

function PaystubCard({
  item,
  expanded,
  onToggle,
}: {
  item: Paystub;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = STATUS_CONFIG[item.status];
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardPeriod}>{fmtPeriod(item.period_start, item.period_end)}</Text>
          <Text style={styles.cardGross}>${item.gross_pay.toFixed(2)}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#9ca3af"
            style={{ marginTop: 4 }}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Hours</Text>
              <Text style={styles.detailValue}>{item.total_hours.toFixed(2)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Rate</Text>
              <Text style={styles.detailValue}>${item.hourly_rate_snapshot}/hr</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Gross Pay</Text>
              <Text style={[styles.detailValue, { color: Brand.sage700 }]}>
                ${item.gross_pay.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.dateList}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Submitted</Text>
              <Text style={styles.dateValue}>{fmtDate(item.submitted_at)}</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Approved</Text>
              <Text style={styles.dateValue}>{fmtDate(item.approved_at)}</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Paid</Text>
              <Text style={styles.dateValue}>{fmtDate(item.paid_at)}</Text>
            </View>
          </View>

          {item.admin_note && (
            <View style={styles.adminNote}>
              <Text style={styles.adminNoteLabel}>Admin Note</Text>
              <Text style={styles.adminNoteText}>{item.admin_note}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function PayrollHistoryScreen() {
  const router = useRouter();
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data, error: fetchErr } = await supabase
      .schema("teachers")
      .from("paystubs")
      .select("*")
      .eq("teacher_id", user.id)
      .order("period_start", { ascending: false });

    if (fetchErr) notifyError("staff-payroll-history-fetch", fetchErr);
    if (data) setPaystubs(data as Paystub[]);
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!cancelled) load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  function toggle(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Brand.sage700} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Pay History</Text>
        <View style={{ width: 34 }} />
      </View>

      <FlatList
        data={paystubs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Brand.sage700}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No paystubs submitted yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PaystubCard
            item={item}
            expanded={expandedId === item.id}
            onToggle={() => toggle(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backBtn: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
  },

  list: { padding: 16, gap: 12 },

  emptyWrap: {
    alignItems: "center",
    paddingTop: 64,
    gap: 12,
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
  },

  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
  },
  cardPeriod: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 2,
  },
  cardGross: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
  },

  cardBody: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 14,
    gap: 14,
  },
  detailGrid: {
    flexDirection: "row",
    gap: 8,
  },
  detailItem: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  detailLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#9ca3af",
    marginBottom: 3,
  },
  detailValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },

  dateList: { gap: 8 },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },
  dateValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },

  adminNote: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
  },
  adminNoteLabel: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  adminNoteText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#374151",
  },
});
