import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { notifyError } from "@/lib/discord";
import {
  type TourBooking,
  TOUR_TIME_SLOTS_15MIN,
  buildTourMessageReminder,
  fetchUpcomingTours,
  formatTourDateLabel,
  formatTourDateLong,
  sendTourReminderEmail,
  sendTourThankYouEmail,
  updateTourBookingDateTime,
} from "@/lib/admin-actions";

const STATUS_STYLES: Record<
  TourBooking["status"],
  { bg: string; text: string; label: string }
> = {
  pending: { bg: "#FEF3C7", text: "#B45309", label: "Pending" },
  confirmed: { bg: "#D1FAE5", text: "#047857", label: "Confirmed" },
  cancelled: { bg: "#FEE2E2", text: "#B91C1C", label: "Cancelled" },
  completed: { bg: "#DBEAFE", text: "#1D4ED8", label: "Completed" },
  no_show: { bg: "#FEE2E2", text: "#B91C1C", label: "No Show" },
};

const HOW_LABELS: Record<string, string> = {
  google: "Google",
  social_media: "Social Media",
  friend_family: "Friend / Family",
  flyer: "Flyer / Poster",
  other: "Other",
};

function StatusPill({ status }: { status: TourBooking["status"] }) {
  const s = STATUS_STYLES[status];
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusPillText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

export default function AdminToursScreen() {
  const router = useRouter();
  const { userRole } = useAuth();

  const [bookings, setBookings] = useState<TourBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<TourBooking | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [sendingThankYou, setSendingThankYou] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [thankYouSent, setThankYouSent] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);

  const detailRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (userRole && userRole !== "super_admin") {
      router.replace("/(staff)/home");
    }
  }, [userRole, router]);

  const load = useCallback(async () => {
    try {
      const data = await fetchUpcomingTours();
      setBookings(data);
    } catch (e) {
      notifyError("admin-tours-load", e);
      Alert.alert("Error", "Failed to load tour bookings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userRole === "super_admin") {
        setLoading(true);
        load();
      }
    }, [load, userRole]),
  );

  const sections = useMemo(() => {
    const byDate = new Map<string, TourBooking[]>();
    for (const b of bookings) {
      if (!byDate.has(b.tour_date)) byDate.set(b.tour_date, []);
      byDate.get(b.tour_date)!.push(b);
    }
    return [...byDate.entries()].map(([date, data]) => ({
      title: formatTourDateLabel(date),
      date,
      data,
    }));
  }, [bookings]);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  function openDetail(booking: TourBooking) {
    setSelected(booking);
    setIsEditing(false);
    setReminderSent(false);
    setThankYouSent(false);
    setMessageCopied(false);
    setEditDate(booking.tour_date);
    setEditTime(booking.tour_time);
    detailRef.current?.present();
  }

  async function handleSaveEdit() {
    if (!selected) return;
    if (!editDate.trim() || !editTime.trim()) {
      Alert.alert("Missing fields", "Date and time are required.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateTourBookingDateTime({
        id: selected.id,
        tour_date: editDate.trim(),
        tour_time: editTime.trim(),
      });
      setSelected(updated);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setIsEditing(false);
    } catch (e) {
      notifyError("admin-tours-update", e);
      Alert.alert("Error", "Failed to update booking.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReminder() {
    if (!selected) return;
    setSendingReminder(true);
    try {
      const result = await sendTourReminderEmail({
        firstName: selected.first_name,
        email: selected.email,
        tourDate: formatTourDateLong(selected.tour_date),
        tourTime: selected.tour_time,
      });
      if (!result.success) {
        Alert.alert("Error", result.error ?? "Failed to send reminder.");
        return;
      }
      setReminderSent(true);
    } catch (e) {
      notifyError("admin-tours-reminder", e);
      Alert.alert("Error", "Failed to send reminder.");
    } finally {
      setSendingReminder(false);
    }
  }

  async function handleSendThankYou() {
    if (!selected) return;
    setSendingThankYou(true);
    try {
      const result = await sendTourThankYouEmail({
        firstName: selected.first_name,
        email: selected.email,
      });
      if (!result.success) {
        Alert.alert("Error", result.error ?? "Failed to send thank you email.");
        return;
      }
      setThankYouSent(true);
    } catch (e) {
      notifyError("admin-tours-thank-you", e);
      Alert.alert("Error", "Failed to send thank you email.");
    } finally {
      setSendingThankYou(false);
    }
  }

  async function handleCopyMessageReminder() {
    if (!selected) return;
    try {
      await Clipboard.setStringAsync(buildTourMessageReminder(selected));
      setMessageCopied(true);
      Alert.alert("Copied", "Message reminder copied to clipboard.");
    } catch (e) {
      notifyError("admin-tours-message-copy", e);
      Alert.alert("Error", "Failed to copy message to clipboard.");
    }
  }

  if (userRole !== "super_admin") {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Brand.sage700} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Brand.sage700} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Campus Tours</Text>
          <Text style={styles.headerSub}>Upcoming tours</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{bookings.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Brand.sage700} style={{ marginTop: 40 }} />
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="map-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No upcoming tours</Text>
          <Text style={styles.emptySub}>Scheduled tours will appear here.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => openDetail(item)}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTime}>{item.tour_time}</Text>
                <Text style={styles.rowName}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.rowSub}>
                  {item.child_name} · {item.child_grade}
                </Text>
              </View>
              <StatusPill status={item.status} />
            </Pressable>
          )}
        />
      )}

      <BottomSheetModal
        ref={detailRef}
        snapPoints={["85%"]}
        enablePanDownToClose
        onDismiss={() => setSelected(null)}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        {selected && (
          <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
            <Text style={styles.sheetEyebrow}>Tour Booking</Text>
            <Text style={styles.sheetTitle}>
              {selected.first_name} {selected.last_name}
            </Text>

            <Text style={styles.fieldLabel}>Tour Date</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editDate}
                onChangeText={setEditDate}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.fieldValue}>
                {formatTourDateLong(selected.tour_date)}
              </Text>
            )}

            <Text style={styles.fieldLabel}>Tour Time</Text>
            {isEditing ? (
              <View style={styles.timeGrid}>
                {TOUR_TIME_SLOTS_15MIN.map((slot) => (
                  <Pressable
                    key={slot}
                    style={[
                      styles.timeChip,
                      editTime === slot && styles.timeChipActive,
                    ]}
                    onPress={() => setEditTime(slot)}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        editTime === slot && styles.timeChipTextActive,
                      ]}
                    >
                      {slot}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{selected.tour_time}</Text>
            )}

            {isEditing ? (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setIsEditing(false)}
                  disabled={saving}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleSaveEdit}
                  disabled={saving}
                >
                  <Text style={styles.primaryBtnText}>
                    {saving ? "Saving…" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editBtnText}>Edit Date & Time</Text>
              </TouchableOpacity>
            )}

            {[
              { label: "Status", value: STATUS_STYLES[selected.status].label },
              { label: "Email", value: selected.email },
              { label: "Phone", value: selected.phone ?? "—" },
              { label: "Child", value: selected.child_name },
              { label: "Grade", value: selected.child_grade },
              {
                label: "Children Attending",
                value: String(selected.num_children),
              },
              {
                label: "How They Heard",
                value:
                  HOW_LABELS[selected.how_did_you_hear] ??
                  selected.how_did_you_hear,
              },
              {
                label: "Accommodations",
                value: selected.accommodations ?? "—",
              },
            ].map(({ label, value }) => (
              <View key={label} style={styles.detailBlock}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <Text style={styles.fieldValue}>{value}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                styles.fullBtn,
                reminderSent && styles.sentBtn,
              ]}
              onPress={handleSendReminder}
              disabled={sendingReminder || reminderSent}
            >
              <Text
                style={[
                  styles.primaryBtnText,
                  reminderSent && styles.sentBtnText,
                ]}
              >
                {sendingReminder
                  ? "Sending…"
                  : reminderSent
                    ? "Reminder Sent ✓"
                    : "Send Tour Reminder"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                styles.fullBtn,
                { marginTop: 10 },
                thankYouSent && styles.sentBtn,
              ]}
              onPress={handleSendThankYou}
              disabled={sendingThankYou || thankYouSent}
            >
              <Text
                style={[
                  styles.primaryBtnText,
                  thankYouSent && styles.sentBtnText,
                ]}
              >
                {sendingThankYou
                  ? "Sending…"
                  : thankYouSent
                    ? "Thank You Sent ✓"
                    : "Send Thank You Email"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                styles.fullBtn,
                { marginTop: 10 },
                messageCopied && styles.sentBtn,
              ]}
              onPress={handleCopyMessageReminder}
            >
              <Text
                style={[
                  styles.primaryBtnText,
                  messageCopied && styles.sentBtnText,
                ]}
              >
                {messageCopied ? "Copied ✓" : "Send Message Reminder"}
              </Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        )}
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage800,
  },
  headerSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statChip: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statValue: {
    fontSize: 20,
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  sectionHeader: {
    fontSize: 13,
    fontFamily: FontFamilies.bodySemiBold,
    color: "#6b7280",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f3f4f6",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rowMain: { flex: 1, marginRight: 8 },
  rowTime: {
    fontSize: 12,
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
    marginBottom: 2,
  },
  rowName: {
    fontSize: 15,
    fontFamily: FontFamilies.bodySemiBold,
    color: "#111827",
  },
  rowSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 11, fontFamily: FontFamilies.bodySemiBold },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: FontFamilies.bodySemiBold,
    color: "#374151",
    marginTop: 12,
  },
  emptySub: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
  sheetContent: { padding: 20, paddingBottom: 40 },
  sheetEyebrow: {
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.bodySemiBold,
    color: "#111827",
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
    marginTop: 12,
  },
  fieldValue: { fontSize: 15, color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  timeChipActive: {
    borderColor: Brand.sage700,
    backgroundColor: "rgba(94,124,104,0.12)",
  },
  timeChipText: { fontSize: 12, color: "#6b7280" },
  timeChipTextActive: { color: Brand.sage700, fontFamily: FontFamilies.bodySemiBold },
  editActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  editBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  editBtnText: { fontSize: 13, color: "#6b7280", fontFamily: FontFamilies.bodySemiBold },
  primaryBtn: {
    flex: 1,
    backgroundColor: Brand.sage700,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: FontFamilies.bodySemiBold,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  secondaryBtnText: { fontSize: 14, color: "#6b7280" },
  fullBtn: { marginTop: 20, flex: undefined, width: "100%" },
  sentBtn: {
    backgroundColor: "#e8f0e8",
    borderWidth: 1,
    borderColor: Brand.sage700,
  },
  sentBtnText: { color: Brand.sage700 },
  detailBlock: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 10,
  },
});
