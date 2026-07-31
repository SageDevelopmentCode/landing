import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import { supabase } from "@/lib/supabase";
import { notifyDiscord, notifyError } from "@/lib/discord";
import {
  fmt12,
  formatDurationMs,
  getPastPayPeriods,
  sessionDurationHours,
  toDateKey,
} from "@/lib/clock-utils";
import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";

type PaystubStatus = "pending" | "approved" | "paid";

type Paystub = {
  id: string;
  teacher_id: string;
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

type RawSession = {
  id: string;
  clock_in_at: string;
  clock_out_at: string;
};

const PERIODS = getPastPayPeriods(12);

const STATUS_CONFIG = {
  pending:  { label: "Pending",  bg: "#fef3c7", text: "#92400e" },
  approved: { label: "Approved", bg: "#eff6ff", text: "#1d4ed8" },
  paid:     { label: "Paid",     bg: "#f0fdf4", text: "#166534" },
} as const;

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function StaffPayrollScreen() {
  const router = useRouter();
  const pickerRef = useRef<BottomSheetModal>(null);
  const detailRef = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [teacherEmail, setTeacherEmail] = useState<string | null>(null);
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [sessions, setSessions] = useState<RawSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const selectedPeriod = PERIODS[selectedPeriodIdx];

  const periodSessions = useMemo(
    () =>
      sessions.filter((s) => {
        const day = toDateKey(new Date(s.clock_in_at));
        return day >= selectedPeriod.start && day <= selectedPeriod.end;
      }),
    [sessions, selectedPeriod]
  );

  const totalHours = useMemo(
    () =>
      Math.round(
        periodSessions.reduce(
          (sum, s) => sum + sessionDurationHours(s.clock_in_at, s.clock_out_at),
          0
        ) * 100
      ) / 100,
    [periodSessions]
  );

  const grossPay = useMemo(
    () =>
      hourlyRate != null
        ? Math.round(totalHours * hourlyRate * 100) / 100
        : null,
    [totalHours, hourlyRate]
  );

  const submittedPaystub = useMemo(
    () =>
      paystubs.find(
        (p) =>
          p.period_start === selectedPeriod.start &&
          p.period_end === selectedPeriod.end
      ) ?? null,
    [paystubs, selectedPeriod]
  );

  const alreadySubmitted = submittedPaystub !== null;

  const canSubmit =
    !!hourlyRate && totalHours > 0 && !alreadySubmitted && !submitting;

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

    const [userRes, paystubsRes, sessionsRes] = await Promise.all([
      supabase
        .schema("admin")
        .from("users")
        .select("hourly_rate, full_name, email")
        .eq("id", user.id)
        .single(),
      supabase
        .schema("teachers")
        .from("paystubs")
        .select("*")
        .eq("teacher_id", user.id)
        .order("period_start", { ascending: false }),
      supabase
        .schema("teachers")
        .from("clock_sessions")
        .select("id, clock_in_at, clock_out_at")
        .eq("teacher_id", user.id)
        .not("clock_out_at", "is", null),
    ]);

    if (userRes.error) notifyError("staff-payroll-load", userRes.error);
    if (paystubsRes.error) notifyError("staff-payroll-load", paystubsRes.error);
    if (sessionsRes.error) notifyError("staff-payroll-load", sessionsRes.error);
    if (userRes.data) {
      setHourlyRate(userRes.data.hourly_rate ?? null);
      setTeacherName(userRes.data.full_name ?? null);
      setTeacherEmail(userRes.data.email ?? null);
    }
    if (paystubsRes.data) setPaystubs(paystubsRes.data as Paystub[]);
    if (sessionsRes.data) setSessions(sessionsRes.data as RawSession[]);

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

  function selectPeriod(idx: number) {
    setSelectedPeriodIdx(idx);
    setSubmitError(null);
    setSubmitSuccess(false);
    pickerRef.current?.dismiss();
  }

  async function handleSubmit() {
    if (!canSubmit || !hourlyRate) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError("Not authenticated.");
      setSubmitting(false);
      return;
    }

    const { data: stub, error } = await supabase
      .schema("teachers")
      .from("paystubs")
      .insert({
        teacher_id: user.id,
        period_start: selectedPeriod.start,
        period_end: selectedPeriod.end,
        total_hours: totalHours,
        hourly_rate_snapshot: hourlyRate,
        gross_pay: grossPay,
      })
      .select("*")
      .single();

    if (error) {
      notifyError("staff-payroll-submit", error);
      setSubmitError(
        error.message.includes("duplicate") || error.message.includes("already")
          ? "A paystub for this period has already been submitted."
          : error.message
      );
      setSubmitting(false);
      return;
    }

    setPaystubs((prev) => [stub as Paystub, ...prev]);
    setSubmitSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    notifyDiscord({
      type: "paystub_submitted",
      data: {
        teacherName: teacherName ?? teacherEmail ?? "Unknown",
        teacherEmail,
        periodStart: selectedPeriod.start,
        periodEnd: selectedPeriod.end,
        totalHours,
        hourlyRate,
        grossPay,
      },
    });
    setSubmitting(false);
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={Brand.sage700}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Payroll</Text>
            <TouchableOpacity
              onPress={() => router.push("/(staff)/payroll-history")}
              style={styles.historyBtn}
            >
              <Text style={styles.historyBtnText}>View History</Text>
              <Ionicons name="chevron-forward" size={14} color={Brand.sage700} />
            </TouchableOpacity>
          </View>

          {/* No-rate banner */}
          {hourlyRate === null && (
            <View style={styles.noRateBanner}>
              <Ionicons name="warning-outline" size={16} color="#92400e" />
              <Text style={styles.noRateText}>
                Your hourly rate hasn't been set yet. Contact an admin before submitting.
              </Text>
            </View>
          )}

          {/* Period selector */}
          <TouchableOpacity
            style={styles.periodRow}
            onPress={() => pickerRef.current?.present()}
          >
            <View>
              <Text style={styles.periodLabel}>Pay Period</Text>
              <Text style={styles.periodValue}>{selectedPeriod.label}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#6b7280" />
          </TouchableOpacity>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Hours Worked</Text>
              <Text style={styles.statValue}>{totalHours.toFixed(2)}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMid]}>
              <Text style={styles.statLabel}>Hourly Rate</Text>
              <Text style={styles.statValue}>
                {hourlyRate != null ? `$${hourlyRate}` : "—"}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Gross Pay</Text>
              <Text style={[styles.statValue, { color: Brand.sage700 }]}>
                {grossPay != null ? `$${grossPay.toFixed(2)}` : "—"}
              </Text>
            </View>
          </View>

          {/* Already submitted — tap to view detail */}
          {alreadySubmitted && submittedPaystub && (
            <TouchableOpacity
              style={styles.alreadyRow}
              onPress={() => detailRef.current?.present()}
              activeOpacity={0.7}
            >
              <Ionicons name="receipt-outline" size={16} color="#1d4ed8" />
              <Text style={styles.alreadyText}>
                Already submitted for this period.
              </Text>
              <View style={[styles.badge, { backgroundColor: STATUS_CONFIG[submittedPaystub.status].bg }]}>
                <Text style={[styles.badgeText, { color: STATUS_CONFIG[submittedPaystub.status].text }]}>
                  {STATUS_CONFIG[submittedPaystub.status].label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#1d4ed8" />
            </TouchableOpacity>
          )}

          {/* Session list */}
          <Text style={styles.sectionTitle}>Sessions</Text>
          {periodSessions.length === 0 ? (
            <Text style={styles.emptyText}>No completed sessions for this period.</Text>
          ) : (
            periodSessions.map((s) => {
              const dur = sessionDurationHours(s.clock_in_at, s.clock_out_at);
              const durMs = dur * 3_600_000;
              return (
                <View key={s.id} style={styles.sessionRow}>
                  <Text style={styles.sessionDate}>
                    {new Date(s.clock_in_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Text style={styles.sessionTimes}>
                    {fmt12(s.clock_in_at)} – {fmt12(s.clock_out_at)}
                  </Text>
                  <Text style={styles.sessionDur}>{formatDurationMs(durMs)}</Text>
                </View>
              );
            })
          )}

          {/* Feedback banners */}
          {submitSuccess && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#166534" />
              <Text style={styles.successText}>Paystub submitted successfully.</Text>
            </View>
          )}
          {submitError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#991b1b" />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}

          {/* Bottom padding for pinned button */}
          <View style={{ height: BottomTabInset + 80 }} />
        </ScrollView>

        {/* Submit button — pinned to bottom */}
        <View style={styles.submitWrap}>
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Paystub</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Submitted paystub detail sheet — always mounted so ref is stable */}
        <BottomSheetModal
          ref={detailRef}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
          backdropComponent={renderBackdrop}
        >
          <BottomSheetView>
            {submittedPaystub ? (
              <View style={styles.detailSheet}>
                {/* Sheet header */}
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={styles.detailSheetTitle}>Paystub</Text>
                    <Text style={styles.detailPeriod}>{selectedPeriod.label}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: STATUS_CONFIG[submittedPaystub.status].bg }]}>
                    <Text style={[styles.badgeText, { color: STATUS_CONFIG[submittedPaystub.status].text }]}>
                      {STATUS_CONFIG[submittedPaystub.status].label}
                    </Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.detailGrid}>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardLabel}>Hours</Text>
                    <Text style={styles.detailCardValue}>{submittedPaystub.total_hours.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardLabel}>Rate</Text>
                    <Text style={styles.detailCardValue}>${submittedPaystub.hourly_rate_snapshot}/hr</Text>
                  </View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardLabel}>Gross Pay</Text>
                    <Text style={[styles.detailCardValue, { color: Brand.sage700 }]}>
                      ${submittedPaystub.gross_pay.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Dates */}
                <View style={styles.detailDates}>
                  <View style={styles.detailDateRow}>
                    <Text style={styles.detailDateLabel}>Submitted</Text>
                    <Text style={styles.detailDateValue}>{fmtDate(submittedPaystub.submitted_at)}</Text>
                  </View>
                  <View style={styles.detailDateRow}>
                    <Text style={styles.detailDateLabel}>Approved</Text>
                    <Text style={styles.detailDateValue}>{fmtDate(submittedPaystub.approved_at)}</Text>
                  </View>
                  <View style={styles.detailDateRow}>
                    <Text style={styles.detailDateLabel}>Paid</Text>
                    <Text style={styles.detailDateValue}>{fmtDate(submittedPaystub.paid_at)}</Text>
                  </View>
                </View>

                {/* Admin note */}
                {submittedPaystub.admin_note && (
                  <View style={styles.adminNote}>
                    <Text style={styles.adminNoteLabel}>Admin Note</Text>
                    <Text style={styles.adminNoteText}>{submittedPaystub.admin_note}</Text>
                  </View>
                )}
              </View>
            ) : null}
          </BottomSheetView>
        </BottomSheetModal>

        {/* Period picker bottom sheet */}
        <BottomSheetModal
          ref={pickerRef}
          snapPoints={["50%", "75%"]}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
          backdropComponent={renderBackdrop}
        >
          <Text style={styles.sheetTitle}>Select Pay Period</Text>
          <BottomSheetFlatList
            data={PERIODS}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.periodOption,
                  index === selectedPeriodIdx && styles.periodOptionSelected,
                ]}
                onPress={() => selectPeriod(index)}
              >
                <Text
                  style={[
                    styles.periodOptionText,
                    index === selectedPeriodIdx && styles.periodOptionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
                {index === selectedPeriodIdx && (
                  <Ionicons name="checkmark" size={16} color={Brand.sage700} />
                )}
              </TouchableOpacity>
            )}
          />
        </BottomSheetModal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: 24, paddingTop: 32 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: FontFamilies.heading,
    fontSize: 28,
    color: "#1f2937",
  },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  historyBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: Brand.sage700,
  },

  noRateBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  noRateText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#92400e",
    flex: 1,
  },

  periodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  periodLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 2,
  },
  periodValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    color: "#1f2937",
  },

  statsGrid: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statCardMid: {
    borderColor: "#e5e7eb",
  },
  statLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#9ca3af",
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
  },

  alreadyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  alreadyText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#1d4ed8",
    flex: 1,
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

  detailSheet: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, gap: 16 },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailSheetTitle: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
    marginBottom: 2,
  },
  detailPeriod: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
  },
  detailGrid: { flexDirection: "row", gap: 8 },
  detailCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  detailCardLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: "#9ca3af",
    marginBottom: 4,
  },
  detailCardValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
  },
  detailDates: { gap: 10 },
  detailDateRow: { flexDirection: "row", justifyContent: "space-between" },
  detailDateLabel: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#9ca3af",
  },
  detailDateValue: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },
  adminNote: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
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

  sectionTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 16,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sessionDate: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#1f2937",
    width: 56,
  },
  sessionTimes: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#6b7280",
    flex: 1,
  },
  sessionDur: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 13,
    color: "#374151",
  },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  successText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#166534",
    flex: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: "#991b1b",
    flex: 1,
  },

  submitWrap: {
    position: "absolute",
    bottom: BottomTabInset,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  submitBtn: {
    backgroundColor: Brand.sage700,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#ffffff",
  },

  sheetBg: { backgroundColor: "#ffffff" },
  sheetHandle: { backgroundColor: "#d1d5db" },
  sheetTitle: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    color: "#1f2937",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  periodOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  periodOptionSelected: {
    backgroundColor: "#f0fdf4",
  },
  periodOptionText: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
  },
  periodOptionTextSelected: {
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
});
