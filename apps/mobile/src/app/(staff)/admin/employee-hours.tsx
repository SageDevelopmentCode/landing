import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Brand, BottomTabInset, FontFamilies } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { notifyError } from "@/lib/discord";
import {
  type ClockSessionWithTeacher,
  type EmployeeOption,
  createClockSessionForTeacher,
  fetchClockSessionsForDate,
  fetchEmployees,
  updateClockSession,
} from "@/lib/admin-actions";
import { fmt12, formatDurationMs, toDateKey } from "@/lib/clock-utils";

function isoToTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildISO(originalIso: string, timeInput: string): string {
  const d = new Date(originalIso);
  const [h, m] = timeInput.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function formatDateNavLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = toDateKey(new Date());
  if (dateStr === today) return "Today";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function sessionDuration(clockIn: string, clockOut: string | null): string {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  return formatDurationMs(end - start);
}

type EmployeeGroup = {
  teacher_id: string;
  full_name: string | null;
  profile_image_url: string | null;
  sessions: ClockSessionWithTeacher[];
  totalMins: number;
  hasActive: boolean;
};

function groupByEmployee(sessions: ClockSessionWithTeacher[]): EmployeeGroup[] {
  const map = new Map<string, EmployeeGroup>();
  for (const s of sessions) {
    if (!map.has(s.teacher_id)) {
      map.set(s.teacher_id, {
        teacher_id: s.teacher_id,
        full_name: s.full_name,
        profile_image_url: s.profile_image_url,
        sessions: [],
        totalMins: 0,
        hasActive: false,
      });
    }
    const g = map.get(s.teacher_id)!;
    g.sessions.push(s);
    if (!s.clock_out_at) {
      g.hasActive = true;
    } else {
      g.totalMins += Math.round(
        (new Date(s.clock_out_at).getTime() - new Date(s.clock_in_at).getTime()) /
          60000,
      );
    }
  }
  return [...map.values()].sort((a, b) => {
    if (a.hasActive !== b.hasActive) return a.hasActive ? -1 : 1;
    return (a.full_name ?? "").localeCompare(b.full_name ?? "");
  });
}

function fmtMins(totalMins: number): string {
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export default function AdminEmployeeHoursScreen() {
  const router = useRouter();
  const { userRole } = useAuth();

  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [sessions, setSessions] = useState<ClockSessionWithTeacher[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editSession, setEditSession] = useState<ClockSessionWithTeacher | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [addTeacherId, setAddTeacherId] = useState("");
  const [addClockIn, setAddClockIn] = useState("09:00");
  const [addClockOut, setAddClockOut] = useState("17:00");
  const [addNote, setAddNote] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  const editRef = useRef<BottomSheetModal>(null);
  const addRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (userRole && userRole !== "super_admin") {
      router.replace("/(staff)/home");
    }
  }, [userRole, router]);

  const loadSessions = useCallback(async () => {
    try {
      const sessionData = await fetchClockSessionsForDate(selectedDate);
      setSessions(sessionData);
    } catch (e) {
      notifyError("admin-hours-load", e);
      Alert.alert("Error", "Failed to load clock sessions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  const loadEmployees = useCallback(async () => {
    try {
      const employeeData = await fetchEmployees();
      setEmployees(employeeData);
      setEmployeesLoaded(true);
    } catch (e) {
      notifyError("admin-hours-employees", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userRole === "super_admin") {
        setLoading(true);
        loadSessions();
        if (!employeesLoaded) loadEmployees();
      }
    }, [loadSessions, loadEmployees, employeesLoaded, userRole]),
  );

  useEffect(() => {
    if (userRole === "super_admin") {
      setLoading(true);
      loadSessions();
    }
  }, [selectedDate, loadSessions, userRole]);

  const activeSessions = useMemo(
    () => sessions.filter((s) => !s.clock_out_at),
    [sessions],
  );
  const groups = useMemo(() => groupByEmployee(sessions), [sessions]);
  const totalMins = groups.reduce((s, g) => s + g.totalMins, 0);
  const uniqueTeachers = groups.length;

  function openEdit(session: ClockSessionWithTeacher) {
    setEditSession(session);
    setEditClockIn(isoToTimeInput(session.clock_in_at));
    setEditClockOut(session.clock_out_at ? isoToTimeInput(session.clock_out_at) : "");
    editRef.current?.present();
  }

  async function handleSaveEdit() {
    if (!editSession) return;
    setEditSaving(true);
    try {
      const newIn = buildISO(editSession.clock_in_at, editClockIn);
      const newOut = editClockOut
        ? buildISO(editSession.clock_in_at, editClockOut)
        : null;
      await updateClockSession(editSession.id, newIn, newOut);
      editRef.current?.dismiss();
      setEditSession(null);
      await loadSessions();
    } catch (e) {
      notifyError("admin-hours-edit", e);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update session.");
    } finally {
      setEditSaving(false);
    }
  }

  function openAdd() {
    setAddTeacherId(employees[0]?.id ?? "");
    setAddClockIn("09:00");
    setAddClockOut("17:00");
    setAddNote("");
    addRef.current?.present();
  }

  async function handleAddSession() {
    if (!addTeacherId) {
      Alert.alert("Missing employee", "Select an employee.");
      return;
    }
    setAddSaving(true);
    try {
      const clockInISO = new Date(`${selectedDate}T${addClockIn}:00`).toISOString();
      const clockOutISO = addClockOut
        ? new Date(`${selectedDate}T${addClockOut}:00`).toISOString()
        : null;
      await createClockSessionForTeacher(
        addTeacherId,
        clockInISO,
        clockOutISO,
        addNote || null,
      );
      addRef.current?.dismiss();
      await loadSessions();
    } catch (e) {
      notifyError("admin-hours-add", e);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add session.");
    } finally {
      setAddSaving(false);
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
          <Text style={styles.headerTitle}>Employee Hours</Text>
          <Text style={styles.headerSub}>
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} ·{" "}
            {uniqueTeachers} employee{uniqueTeachers !== 1 ? "s" : ""} ·{" "}
            {fmtMins(totalMins)} total
          </Text>
        </View>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.dateNav}>
        <Pressable
          style={styles.dateNavBtn}
          onPress={() => setSelectedDate((d) => shiftDate(d, -1))}
        >
          <Ionicons name="chevron-back" size={18} color={Brand.sage700} />
        </Pressable>
        <Pressable
          style={styles.dateNavCenter}
          onPress={() => setSelectedDate(toDateKey(new Date()))}
        >
          <Text style={styles.dateNavLabel}>{formatDateNavLabel(selectedDate)}</Text>
          <Text style={styles.dateNavSub}>{selectedDate}</Text>
        </Pressable>
        <Pressable
          style={styles.dateNavBtn}
          onPress={() => setSelectedDate((d) => shiftDate(d, 1))}
        >
          <Ionicons name="chevron-forward" size={18} color={Brand.sage700} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={Brand.sage700} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadSessions();
              }}
            />
          }
        >
          {activeSessions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.activeDot} />
                <Text style={styles.sectionTitle}>
                  Clocked In ({activeSessions.length})
                </Text>
              </View>
              {activeSessions.map((s) => (
                <Pressable
                  key={s.id}
                  style={styles.activeRow}
                  onPress={() => openEdit(s)}
                >
                  <EmployeeAvatar
                    name={s.full_name}
                    url={s.profile_image_url}
                  />
                  <View style={styles.activeMain}>
                    <Text style={styles.employeeName}>
                      {s.full_name ?? "Unknown"}
                    </Text>
                    <Text style={styles.activeSince}>
                      since {fmt12(s.clock_in_at)}
                    </Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sessions</Text>
            {sessions.length === 0 ? (
              <Text style={styles.emptyText}>No sessions for this date.</Text>
            ) : (
              groups.map((g) => (
                <View key={g.teacher_id} style={styles.employeeCard}>
                  <View style={styles.employeeHeader}>
                    <EmployeeAvatar
                      name={g.full_name}
                      url={g.profile_image_url}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.employeeName}>
                        {g.full_name ?? "Unknown"}
                      </Text>
                      <Text style={styles.employeeMeta}>
                        {g.sessions.length} session
                        {g.sessions.length !== 1 ? "s" : ""}
                        {g.totalMins > 0 ? ` · ${fmtMins(g.totalMins)}` : ""}
                      </Text>
                    </View>
                  </View>
                  {g.sessions.map((s) => (
                    <Pressable
                      key={s.id}
                      style={styles.sessionRow}
                      onPress={() => openEdit(s)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionTimes}>
                          {fmt12(s.clock_in_at)} →{" "}
                          {s.clock_out_at ? fmt12(s.clock_out_at) : "Active"}
                        </Text>
                        {s.note ? (
                          <Text style={styles.sessionNote}>{s.note}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.sessionDuration}>
                        {sessionDuration(s.clock_in_at, s.clock_out_at)}
                      </Text>
                      <Ionicons
                        name="pencil-outline"
                        size={16}
                        color="#9ca3af"
                        style={{ marginLeft: 8 }}
                      />
                    </Pressable>
                  ))}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <BottomSheetModal
        ref={editRef}
        snapPoints={["45%"]}
        enablePanDownToClose
        keyboardBehavior="interactive"
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        {editSession && (
          <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Edit Session</Text>
            <Text style={styles.sheetSub}>{editSession.full_name ?? "Employee"}</Text>

            <Text style={styles.fieldLabel}>Clock In (HH:MM)</Text>
            <BottomSheetTextInput
              style={styles.input}
              value={editClockIn}
              onChangeText={setEditClockIn}
              placeholder="09:00"
            />

            <Text style={styles.fieldLabel}>
              Clock Out (HH:MM, leave empty if active)
            </Text>
            <BottomSheetTextInput
              style={styles.input}
              value={editClockOut}
              onChangeText={setEditClockOut}
              placeholder="17:00"
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => editRef.current?.dismiss()}
                disabled={editSaving}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSaveEdit}
                disabled={editSaving}
              >
                <Text style={styles.primaryBtnText}>
                  {editSaving ? "Saving…" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        )}
      </BottomSheetModal>

      <BottomSheetModal
        ref={addRef}
        snapPoints={["70%"]}
        enablePanDownToClose
        keyboardBehavior="interactive"
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Add Time Session</Text>
          <Text style={styles.sheetSub}>{selectedDate}</Text>

          <Text style={styles.fieldLabel}>Employee</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.employeeChips}>
              {employees.map((e) => (
                <Pressable
                  key={e.id}
                  style={[
                    styles.employeeChip,
                    addTeacherId === e.id && styles.employeeChipActive,
                  ]}
                  onPress={() => setAddTeacherId(e.id)}
                >
                  <Text
                    style={[
                      styles.employeeChipText,
                      addTeacherId === e.id && styles.employeeChipTextActive,
                    ]}
                  >
                    {e.full_name ?? e.id}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.fieldLabel}>Clock In (HH:MM)</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={addClockIn}
            onChangeText={setAddClockIn}
          />

          <Text style={styles.fieldLabel}>Clock Out (HH:MM, optional)</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={addClockOut}
            onChangeText={setAddClockOut}
          />

          <Text style={styles.fieldLabel}>Note (optional)</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={addNote}
            onChangeText={setAddNote}
            placeholder="e.g. makeup shift"
          />

          <TouchableOpacity
            style={[styles.primaryBtn, styles.fullBtn]}
            onPress={handleAddSession}
            disabled={addSaving}
          >
            <Text style={styles.primaryBtnText}>
              {addSaving ? "Saving…" : "Save Session"}
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

function EmployeeAvatar({
  name,
  url,
}: {
  name: string | null;
  url: string | null;
}) {
  if (url) {
    return <Image source={{ uri: url }} style={styles.avatar} />;
  }
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitial}>
        {(name ?? "?").charAt(0).toUpperCase()}
      </Text>
    </View>
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
  headerSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.sage700,
    alignItems: "center",
    justifyContent: "center",
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 8,
  },
  dateNavBtn: { padding: 8 },
  dateNavCenter: { flex: 1, alignItems: "center" },
  dateNavLabel: {
    fontSize: 15,
    fontFamily: FontFamilies.bodySemiBold,
    color: "#111827",
  },
  dateNavSub: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FontFamilies.bodySemiBold,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  activeMain: { flex: 1, marginLeft: 10 },
  activeSince: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  activeBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeBadgeText: {
    fontSize: 11,
    color: "#047857",
    fontFamily: FontFamilies.bodySemiBold,
  },
  emptyText: { fontSize: 14, color: "#9ca3af", fontStyle: "italic" },
  employeeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
    overflow: "hidden",
  },
  employeeHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 10,
  },
  employeeName: {
    fontSize: 15,
    fontFamily: FontFamilies.bodySemiBold,
    color: "#111827",
  },
  employeeMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  sessionTimes: { fontSize: 13, color: "#374151" },
  sessionNote: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  sessionDuration: {
    fontSize: 12,
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(94,124,104,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 14,
    fontFamily: FontFamilies.bodySemiBold,
    color: Brand.sage700,
  },
  sheetContent: { padding: 20, paddingBottom: 40 },
  sheetTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.bodySemiBold,
    color: "#111827",
  },
  sheetSub: { fontSize: 13, color: "#6b7280", marginBottom: 12 },
  fieldLabel: {
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 20 },
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
  employeeChips: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  employeeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  employeeChipActive: {
    borderColor: Brand.sage700,
    backgroundColor: "rgba(94,124,104,0.12)",
  },
  employeeChipText: { fontSize: 13, color: "#6b7280" },
  employeeChipTextActive: {
    color: Brand.sage700,
    fontFamily: FontFamilies.bodySemiBold,
  },
});
